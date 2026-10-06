from dataclasses import dataclass
from datetime import date, timedelta
from typing import Sequence

from sqlalchemy.orm import Session

from models import BloodUnit
from schemas import ExpiryStatus


DEFAULT_EXPIRY_WARNING_DAYS = 3
DEFAULT_EXPIRY_CRITICAL_DAYS = 1


@dataclass
class ExpiringUnit:
    unit_id: int
    donation_id: int
    blood_bank_id: int
    collection_date: date
    expiry_date: date
    current_status: str
    expiry_status: ExpiryStatus
    days_left: int


@dataclass
class ExpiryCounts:
    expired: int
    critical: int
    expiring_soon: int
    total_flagged: int


@dataclass
class ExpiryMonitoringResult:
    counts: ExpiryCounts
    flagged_units: list[ExpiringUnit]


@dataclass
class QuarantineResult:
    units_changed: int
    changed_unit_ids: list[int]


class ExpiryEngine:
    """Engine for monitoring blood unit expiry and executing explicit quarantine."""

    def __init__(self, db: Session):
        self.db = db

    def find_expiring_units(
        self,
        warning_days: int = DEFAULT_EXPIRY_WARNING_DAYS,
        critical_days: int = DEFAULT_EXPIRY_CRITICAL_DAYS,
        evaluation_date: date | None = None,
        statuses: Sequence[str] = ("AVAILABLE",),
        limit: int | None = None,
    ) -> ExpiryMonitoringResult:
        """Find units that are expired, critical, or expiring soon (read-only monitoring)."""
        if warning_days < 0:
            raise ValueError("warning_days must be greater than or equal to 0")
        if critical_days < 0:
            raise ValueError("critical_days must be greater than or equal to 0")
        if critical_days > warning_days:
            raise ValueError("critical_days cannot be greater than warning_days")

        today = evaluation_date if evaluation_date is not None else date.today()
        max_expiry_date = today + timedelta(days=warning_days)

        # Query eligible units:
        # Exclude USED, DISCARDED; by default focus on AVAILABLE units.
        # Order deterministically:
        #   1. expired / most urgent first (earliest expiry_date)
        #   2. earliest collection_date
        #   3. lowest unit_id
        query = (
            self.db.query(BloodUnit)
            .filter(
                BloodUnit.status.in_(statuses),
                BloodUnit.expiry_date <= max_expiry_date,
            )
            .order_by(
                BloodUnit.expiry_date.asc(),
                BloodUnit.collection_date.asc(),
                BloodUnit.unit_id.asc(),
            )
        )

        all_matching_units: list[BloodUnit] = query.all()

        flagged: list[ExpiringUnit] = []
        expired_count = 0
        critical_count = 0
        expiring_soon_count = 0

        for unit in all_matching_units:
            days_left = (unit.expiry_date - today).days

            if days_left < 0:
                expiry_status = ExpiryStatus.EXPIRED
                expired_count += 1
            elif days_left <= critical_days:
                expiry_status = ExpiryStatus.CRITICAL
                critical_count += 1
            elif days_left <= warning_days:
                expiry_status = ExpiryStatus.EXPIRING_SOON
                expiring_soon_count += 1
            else:
                continue

            flagged.append(
                ExpiringUnit(
                    unit_id=unit.unit_id,
                    donation_id=unit.donation_id,
                    blood_bank_id=unit.blood_bank_id,
                    collection_date=unit.collection_date,
                    expiry_date=unit.expiry_date,
                    current_status=unit.status,
                    expiry_status=expiry_status,
                    days_left=days_left,
                )
            )

        counts = ExpiryCounts(
            expired=expired_count,
            critical=critical_count,
            expiring_soon=expiring_soon_count,
            total_flagged=len(flagged),
        )

        if limit is not None and limit >= 0:
            flagged = flagged[:limit]

        return ExpiryMonitoringResult(
            counts=counts,
            flagged_units=flagged,
        )

    def quarantine_expired_units(
        self,
        evaluation_date: date | None = None,
        unit_ids: Sequence[int] | None = None,
    ) -> QuarantineResult:
        """Explicitly transition eligible expired AVAILABLE units to EXPIRED."""
        today = evaluation_date if evaluation_date is not None else date.today()

        query = self.db.query(BloodUnit).filter(
            BloodUnit.status == "AVAILABLE",
            BloodUnit.expiry_date < today,
        )

        if unit_ids is not None:
            query = query.filter(BloodUnit.unit_id.in_(unit_ids))

        units_to_quarantine = query.order_by(BloodUnit.unit_id.asc()).all()

        changed_ids: list[int] = []
        for unit in units_to_quarantine:
            unit.status = "EXPIRED"
            changed_ids.append(unit.unit_id)

        if changed_ids:
            self.db.commit()

        return QuarantineResult(
            units_changed=len(changed_ids),
            changed_unit_ids=changed_ids,
        )
