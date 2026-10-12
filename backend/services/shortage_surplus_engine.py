from dataclasses import dataclass
from datetime import date
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import BloodBank, BloodGroup, BloodUnit, Donation
from schemas import InventoryStatus

DEFAULT_LOW_STOCK_THRESHOLD = 5
DEFAULT_SURPLUS_THRESHOLD = 20
DEFAULT_MIN_STOCK_BY_TYPE = {"O-": 8, "O+": 8}


@dataclass
class BloodGroupStockReport:
    blood_group_id: int
    group_name: str
    usable_units: int
    min_threshold: int
    surplus_threshold: int
    status: InventoryStatus
    shortfall: int
    excess: int


@dataclass
class ShortageSurplusSummary:
    total_usable_units: int
    shortage_groups_count: int
    balanced_groups_count: int
    surplus_groups_count: int
    has_critical_shortage: bool


@dataclass
class BloodBankShortageSurplusReport:
    blood_bank_id: int
    blood_bank_name: str
    summary: ShortageSurplusSummary
    stock_by_group: list[BloodGroupStockReport]


class ShortageSurplusEngine:
    """Engine for detecting blood shortages and surpluses at blood-bank level."""

    def __init__(self, db: Session):
        self.db = db

    def detect_for_blood_bank(
        self,
        blood_bank_id: int,
        evaluation_date: date | None = None,
        min_threshold_default: int = DEFAULT_LOW_STOCK_THRESHOLD,
        surplus_threshold_default: int = DEFAULT_SURPLUS_THRESHOLD,
        min_threshold_overrides: dict[str, int] | None = None,
        surplus_threshold_overrides: dict[str, int] | None = None,
    ) -> BloodBankShortageSurplusReport:
        """Inspect inventory for one specific blood bank and classify stock levels for all 8 blood groups."""
        # 1. Validate blood bank existence
        blood_bank = (
            self.db.query(BloodBank)
            .filter(BloodBank.blood_bank_id == blood_bank_id)
            .first()
        )
        if blood_bank is None:
            raise HTTPException(status_code=404, detail="Blood bank not found")

        # 2. Validate baseline thresholds
        if min_threshold_default < 0:
            raise ValueError("min_threshold_default must be greater than or equal to 0")
        if surplus_threshold_default < 0:
            raise ValueError("surplus_threshold_default must be greater than or equal to 0")
        if min_threshold_default > surplus_threshold_default:
            raise ValueError("min_threshold_default cannot be greater than surplus_threshold_default")

        # 3. Retrieve all authoritative blood groups from database (deterministic order)
        all_groups = (
            self.db.query(BloodGroup)
            .order_by(BloodGroup.blood_group_id.asc())
            .all()
        )
        valid_group_names = {g.group_name.upper(): g.group_name for g in all_groups}

        # 4. Normalize and validate threshold overrides
        norm_min_overrides: dict[str, int] = {}
        if min_threshold_overrides:
            for k, v in min_threshold_overrides.items():
                norm_key = str(k).strip().upper()
                if norm_key not in valid_group_names:
                    raise ValueError(f"Unknown blood group override key: '{k}'")
                if v < 0:
                    raise ValueError(f"min_threshold for '{k}' must be greater than or equal to 0")
                norm_min_overrides[valid_group_names[norm_key]] = v

        norm_surplus_overrides: dict[str, int] = {}
        if surplus_threshold_overrides:
            for k, v in surplus_threshold_overrides.items():
                norm_key = str(k).strip().upper()
                if norm_key not in valid_group_names:
                    raise ValueError(f"Unknown blood group override key: '{k}'")
                if v < 0:
                    raise ValueError(f"surplus_threshold for '{k}' must be greater than or equal to 0")
                norm_surplus_overrides[valid_group_names[norm_key]] = v

        # Validate per-group min <= surplus
        resolved_thresholds: dict[str, tuple[int, int]] = {}
        for g in all_groups:
            g_name = g.group_name
            # Resolve minimum threshold
            if g_name in norm_min_overrides:
                g_min = norm_min_overrides[g_name]
            elif g_name in DEFAULT_MIN_STOCK_BY_TYPE:
                g_min = DEFAULT_MIN_STOCK_BY_TYPE[g_name]
            else:
                g_min = min_threshold_default

            # Resolve surplus threshold
            if g_name in norm_surplus_overrides:
                g_surplus = norm_surplus_overrides[g_name]
            else:
                g_surplus = surplus_threshold_default

            if g_min > g_surplus:
                raise ValueError(
                    f"min_threshold ({g_min}) cannot be greater than surplus_threshold ({g_surplus}) for blood group '{g_name}'"
                )
            resolved_thresholds[g_name] = (g_min, g_surplus)

        # 5. Query usable inventory for this blood bank using a single aggregate query (No N+1)
        today = evaluation_date if evaluation_date is not None else date.today()

        counts_query = (
            self.db.query(Donation.blood_group_id, func.count(BloodUnit.unit_id))
            .join(BloodUnit, BloodUnit.donation_id == Donation.donation_id)
            .filter(
                BloodUnit.blood_bank_id == blood_bank_id,
                BloodUnit.status == "AVAILABLE",
                BloodUnit.expiry_date >= today,
            )
            .group_by(Donation.blood_group_id)
            .all()
        )
        usable_counts_map = {row[0]: row[1] for row in counts_query}

        # 6. Build report for all 8 blood groups deterministically
        stock_reports: list[BloodGroupStockReport] = []
        for g in all_groups:
            usable_units = usable_counts_map.get(g.blood_group_id, 0)
            min_thresh, surplus_thresh = resolved_thresholds[g.group_name]

            if usable_units < min_thresh:
                status = InventoryStatus.SHORTAGE
                shortfall = min_thresh - usable_units
                excess = 0
            elif usable_units > surplus_thresh:
                status = InventoryStatus.SURPLUS
                shortfall = 0
                excess = usable_units - surplus_thresh
            else:
                status = InventoryStatus.BALANCED
                shortfall = 0
                excess = 0

            stock_reports.append(
                BloodGroupStockReport(
                    blood_group_id=g.blood_group_id,
                    group_name=g.group_name,
                    usable_units=usable_units,
                    min_threshold=min_thresh,
                    surplus_threshold=surplus_thresh,
                    status=status,
                    shortfall=shortfall,
                    excess=excess,
                )
            )

        # 7. Calculate summary
        total_usable_units = sum(r.usable_units for r in stock_reports)
        shortage_groups_count = sum(1 for r in stock_reports if r.status == InventoryStatus.SHORTAGE)
        balanced_groups_count = sum(1 for r in stock_reports if r.status == InventoryStatus.BALANCED)
        surplus_groups_count = sum(1 for r in stock_reports if r.status == InventoryStatus.SURPLUS)
        has_critical_shortage = any(r.usable_units == 0 for r in stock_reports)

        summary = ShortageSurplusSummary(
            total_usable_units=total_usable_units,
            shortage_groups_count=shortage_groups_count,
            balanced_groups_count=balanced_groups_count,
            surplus_groups_count=surplus_groups_count,
            has_critical_shortage=has_critical_shortage,
        )

        return BloodBankShortageSurplusReport(
            blood_bank_id=blood_bank.blood_bank_id,
            blood_bank_name=blood_bank.name,
            summary=summary,
            stock_by_group=stock_reports,
        )
