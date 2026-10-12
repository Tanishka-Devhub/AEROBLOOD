from datetime import date, timedelta
import math
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import BloodBank, BloodCompatibility, BloodGroup, BloodUnit, Donation
from schemas import (
    InventoryStatus,
    ProposedTransferResponse,
    RedistributionPreviewResponse,
    RedistributionReason,
    UnmetShortageResponse,
)
from services.shortage_surplus_engine import (
    DEFAULT_LOW_STOCK_THRESHOLD,
    DEFAULT_MIN_STOCK_BY_TYPE,
    ShortageSurplusEngine,
)

DEFAULT_SPEED_KMPH = 40.0
DEFAULT_EXPIRY_MARGIN_DAYS = 1
DEFAULT_EXPIRY_WARNING_DAYS = 3
EARTH_RADIUS_KM = 6371.0


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(dlambda / 2.0) ** 2)
    )
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


class RedistributionEngine:
    """Read-only recommendation engine for inter-bank blood unit redistribution."""

    def __init__(self, db: Session):
        self.db = db
        self.shortage_engine = ShortageSurplusEngine(db)

    def _get_donor_versatility(self) -> dict[int, int]:
        """Calculate versatility for each donor blood group from authoritative BloodCompatibility table.

        Versatility = count of recipient blood groups that the donor group can donate to.
        """
        rows = (
            self.db.query(
                BloodCompatibility.donor_blood_group_id,
                func.count(BloodCompatibility.recipient_blood_group_id),
            )
            .filter(BloodCompatibility.is_compatible == True)
            .group_by(BloodCompatibility.donor_blood_group_id)
            .all()
        )
        return {donor_id: count for donor_id, count in rows}

    def _get_compatible_donor_order(
        self, recipient_blood_group_id: int, versatility: dict[int, int]
    ) -> list[int]:
        """Order compatible donor groups for a recipient shortage:

        1. Exact donor blood group first
        2. Compatible substitutes ordered by ascending versatility (least versatile first)
        3. Break versatility ties deterministically by donor_blood_group_id ASC
        Preserves versatile donors (such as O-) as last resort.
        """
        compat_rows = (
            self.db.query(BloodCompatibility.donor_blood_group_id)
            .filter(
                BloodCompatibility.recipient_blood_group_id == recipient_blood_group_id,
                BloodCompatibility.is_compatible == True,
            )
            .all()
        )
        compatible_donor_ids = [row[0] for row in compat_rows]

        exact = [d for d in compatible_donor_ids if d == recipient_blood_group_id]
        substitutes = [d for d in compatible_donor_ids if d != recipient_blood_group_id]
        substitutes.sort(key=lambda d: (versatility.get(d, 0), d))

        return exact + substitutes

    def preview(
        self,
        destination_blood_bank_id: int,
        source_blood_bank_id: int | None = None,
        max_transfers: int = 50,
        speed_kmph: float = DEFAULT_SPEED_KMPH,
        expiry_margin_days: int = DEFAULT_EXPIRY_MARGIN_DAYS,
        evaluation_date: date | None = None,
        distances: dict[tuple[int, int], float] | None = None,
    ) -> RedistributionPreviewResponse:
        """Generate a read-only redistribution plan for a destination blood bank."""
        today = evaluation_date if evaluation_date is not None else date.today()

        # 1. Validate destination blood bank existence
        dest_bank = (
            self.db.query(BloodBank)
            .filter(BloodBank.blood_bank_id == destination_blood_bank_id)
            .first()
        )
        if dest_bank is None:
            raise HTTPException(status_code=404, detail="Destination blood bank not found")

        # 2. Validate optional source blood bank existence and distinctness
        source_bank: BloodBank | None = None
        if source_blood_bank_id is not None:
            if source_blood_bank_id == destination_blood_bank_id:
                raise HTTPException(
                    status_code=400,
                    detail="source_blood_bank_id and destination_blood_bank_id must be different",
                )
            source_bank = (
                self.db.query(BloodBank)
                .filter(BloodBank.blood_bank_id == source_blood_bank_id)
                .first()
            )
            if source_bank is None:
                raise HTTPException(status_code=404, detail="Source blood bank not found")

        # 3. Detect shortages at destination bank using existing ShortageSurplusEngine
        dest_report = self.shortage_engine.detect_for_blood_bank(
            blood_bank_id=destination_blood_bank_id,
            evaluation_date=today,
        )

        # Filter blood groups with active shortage
        shortage_reports = [
            r for r in dest_report.stock_by_group if r.status == InventoryStatus.SHORTAGE
        ]

        if not shortage_reports:
            return RedistributionPreviewResponse(
                total_transfers_recommended=0,
                total_units_transferred=0,
                unmet_shortages_count=0,
                transfers=[],
                unmet_shortages=[],
            )

        # 4. Sort shortage groups by deterministic severity:
        #    1) largest relative shortfall: shortfall / max(min_threshold, 1) DESC
        #    2) largest absolute shortfall DESC
        #    3) blood_group_id ASC
        shortage_reports.sort(
            key=lambda r: (
                -(r.shortfall / max(r.min_threshold, 1)),
                -r.shortfall,
                r.blood_group_id,
            )
        )

        # Track remaining shortfall per blood group
        remaining_shortfalls: dict[int, int] = {
            r.blood_group_id: r.shortfall for r in shortage_reports
        }
        group_names: dict[int, str] = {
            r.blood_group_id: r.group_name for r in dest_report.stock_by_group
        }

        # 5. Load authoritative compatibility & versatility data
        versatility = self._get_donor_versatility()

        # Pre-load all blood banks metadata to avoid N+1 queries
        all_banks_rows = self.db.query(BloodBank).all()
        banks_by_id = {b.blood_bank_id: b for b in all_banks_rows}

        # 6. Distance helper function
        def get_distance_km(src_id: int, dst_id: int) -> float | None:
            if distances is not None:
                if (src_id, dst_id) in distances:
                    return float(distances[(src_id, dst_id)])
                if (dst_id, src_id) in distances:
                    return float(distances[(dst_id, src_id)])
            src = banks_by_id.get(src_id)
            dst = banks_by_id.get(dst_id)
            if src is not None and dst is not None:
                if (
                    src.latitude is not None
                    and src.longitude is not None
                    and dst.latitude is not None
                    and dst.longitude is not None
                ):
                    return calculate_haversine_distance(
                        float(src.latitude),
                        float(src.longitude),
                        float(dst.latitude),
                        float(dst.longitude),
                    )
            return None

        # 7. In-memory source budget tracking: (source_bank_id, donor_blood_group_id) -> int
        source_budgets: dict[tuple[int, int], int] = {}
        budget_initialized_banks: set[tuple[int, int]] = set()

        def get_min_threshold_for_group(group_id: int) -> int:
            g_name = group_names.get(group_id, "")
            if g_name in DEFAULT_MIN_STOCK_BY_TYPE:
                return DEFAULT_MIN_STOCK_BY_TYPE[g_name]
            return DEFAULT_LOW_STOCK_THRESHOLD

        def init_bank_budget_for_donor_group(bank_id: int, donor_grp_id: int) -> int:
            key = (bank_id, donor_grp_id)
            if key in budget_initialized_banks:
                return source_budgets.get(key, 0)

            min_thresh = get_min_threshold_for_group(donor_grp_id)
            usable_count = (
                self.db.query(func.count(BloodUnit.unit_id))
                .join(Donation, BloodUnit.donation_id == Donation.donation_id)
                .filter(
                    BloodUnit.blood_bank_id == bank_id,
                    Donation.blood_group_id == donor_grp_id,
                    BloodUnit.status == "AVAILABLE",
                    BloodUnit.expiry_date >= today,
                )
                .scalar()
                or 0
            )

            if usable_count <= min_thresh:
                budget = 0
            else:
                budget = usable_count - min_thresh

            source_budgets[key] = budget
            budget_initialized_banks.add(key)
            return budget

        # 8. Plan generation state
        transfers: list[ProposedTransferResponse] = []
        selected_unit_ids: set[int] = set()

        # 9. Iterate through shortage groups in order of severity
        for shortage in shortage_reports:
            recip_group_id = shortage.blood_group_id
            recip_group_name = shortage.group_name

            if remaining_shortfalls[recip_group_id] <= 0:
                continue

            if len(transfers) >= max_transfers:
                break

            # Compatible donor groups: exact match first, then least versatile substitutes
            donor_group_order = self._get_compatible_donor_order(recip_group_id, versatility)

            for donor_group_id in donor_group_order:
                if remaining_shortfalls[recip_group_id] <= 0:
                    break

                if len(transfers) >= max_transfers:
                    break

                donor_group_name = group_names.get(donor_group_id, str(donor_group_id))

                # Identify eligible candidate source banks for this donor group
                candidate_source_ids: list[int] = []
                if source_bank is not None:
                    # Explicit source bank requested
                    dist = get_distance_km(source_bank.blood_bank_id, destination_blood_bank_id)
                    if dist is not None:
                        b = init_bank_budget_for_donor_group(
                            source_bank.blood_bank_id, donor_group_id
                        )
                        if b > 0:
                            candidate_source_ids.append(source_bank.blood_bank_id)
                else:
                    # Discover viable source banks with usable stock > min_threshold
                    min_thresh = get_min_threshold_for_group(donor_group_id)
                    surplus_banks_query = (
                        self.db.query(
                            BloodUnit.blood_bank_id,
                            func.count(BloodUnit.unit_id),
                        )
                        .join(Donation, BloodUnit.donation_id == Donation.donation_id)
                        .filter(
                            BloodUnit.blood_bank_id != destination_blood_bank_id,
                            Donation.blood_group_id == donor_group_id,
                            BloodUnit.status == "AVAILABLE",
                            BloodUnit.expiry_date >= today,
                        )
                        .group_by(BloodUnit.blood_bank_id)
                        .having(func.count(BloodUnit.unit_id) > min_thresh)
                        .all()
                    )

                    # Initialize budgets and filter for routable banks
                    routable_banks_with_dist: list[tuple[float, int]] = []
                    for s_id, usable_c in surplus_banks_query:
                        b_key = (s_id, donor_group_id)
                        if b_key not in budget_initialized_banks:
                            source_budgets[b_key] = max(usable_c - min_thresh, 0)
                            budget_initialized_banks.add(b_key)

                        if source_budgets.get(b_key, 0) > 0:
                            dist = get_distance_km(s_id, destination_blood_bank_id)
                            if dist is not None:
                                routable_banks_with_dist.append((dist, s_id))

                    # Sort source banks by distance ASC
                    routable_banks_with_dist.sort(key=lambda item: (item[0], item[1]))
                    candidate_source_ids = [s_id for _, s_id in routable_banks_with_dist]

                if not candidate_source_ids:
                    continue

                # Query candidate units from the eligible source banks
                candidate_units_raw = (
                    self.db.query(BloodUnit)
                    .join(Donation, BloodUnit.donation_id == Donation.donation_id)
                    .filter(
                        BloodUnit.blood_bank_id.in_(candidate_source_ids),
                        Donation.blood_group_id == donor_group_id,
                        BloodUnit.status == "AVAILABLE",
                        BloodUnit.expiry_date >= today,
                    )
                    .order_by(
                        BloodUnit.expiry_date.asc(),
                        BloodUnit.collection_date.asc(),
                        BloodUnit.unit_id.asc(),
                    )
                    .all()
                )

                # Filter and construct candidate tuples with arrival and expiry safety
                eligible_candidates: list[tuple] = []
                for unit in candidate_units_raw:
                    if unit.unit_id in selected_unit_ids:
                        continue

                    dist_km = get_distance_km(unit.blood_bank_id, destination_blood_bank_id)
                    if dist_km is None:
                        continue

                    # Travel time and arrival date calculation
                    travel_hours = dist_km / speed_kmph
                    if travel_hours < 24.0:
                        arrival_date = today
                    else:
                        travel_days = math.floor(travel_hours / 24.0)
                        arrival_date = today + timedelta(days=travel_days)

                    # Expiry arrival safety check
                    if (unit.expiry_date - arrival_date).days < expiry_margin_days:
                        continue

                    days_left = (unit.expiry_date - today).days
                    is_expiring = days_left <= DEFAULT_EXPIRY_WARNING_DAYS

                    # Priority sort key:
                    # 1. Units close to expiry first (is_expiring: 0 vs 1)
                    # 2. Nearest source bank first (dist_km)
                    # 3. Earliest expiry date
                    # 4. Earliest collection date
                    # 5. unit_id ASC
                    sort_key = (
                        0 if is_expiring else 1,
                        dist_km,
                        unit.expiry_date,
                        unit.collection_date,
                        unit.unit_id,
                    )

                    eligible_candidates.append(
                        (
                            sort_key,
                            unit,
                            dist_km,
                            arrival_date,
                            days_left,
                            is_expiring,
                        )
                    )

                # Sort eligible candidates deterministically
                eligible_candidates.sort(key=lambda c: c[0])

                # Greedily allocate units while respecting budget and remaining shortfall
                for (
                    _key,
                    unit,
                    dist_km,
                    arrival_date,
                    days_left,
                    is_expiring,
                ) in eligible_candidates:
                    if remaining_shortfalls[recip_group_id] <= 0:
                        break

                    if len(transfers) >= max_transfers:
                        break

                    if unit.unit_id in selected_unit_ids:
                        continue

                    b_key = (unit.blood_bank_id, donor_group_id)
                    if source_budgets.get(b_key, 0) <= 0:
                        continue

                    # Earmark candidate unit
                    selected_unit_ids.add(unit.unit_id)
                    source_budgets[b_key] -= 1
                    remaining_shortfalls[recip_group_id] -= 1

                    src_bank_obj = banks_by_id[unit.blood_bank_id]
                    reason_val = (
                        RedistributionReason.EXPIRING_SOON.value
                        if is_expiring
                        else RedistributionReason.SURPLUS.value
                    )

                    transfers.append(
                        ProposedTransferResponse(
                            unit_id=unit.unit_id,
                            donor_blood_group=donor_group_name,
                            recipient_blood_group=recip_group_name,
                            source_blood_bank_id=unit.blood_bank_id,
                            source_blood_bank_name=src_bank_obj.name,
                            destination_blood_bank_id=destination_blood_bank_id,
                            destination_blood_bank_name=dest_bank.name,
                            distance_km=round(dist_km, 2),
                            arrival_date=arrival_date,
                            estimated_arrival_date=arrival_date,
                            expiry_date=unit.expiry_date,
                            days_until_expiry=days_left,
                            reason=reason_val,
                        )
                    )

        # 10. Compile unmet shortages
        unmet_shortages: list[UnmetShortageResponse] = []
        for shortage in shortage_reports:
            rem = remaining_shortfalls.get(shortage.blood_group_id, 0)
            if rem > 0:
                unmet_shortages.append(
                    UnmetShortageResponse(
                        destination_blood_bank_id=destination_blood_bank_id,
                        destination_blood_bank_name=dest_bank.name,
                        blood_group_name=shortage.group_name,
                        remaining_shortfall=rem,
                    )
                )

        return RedistributionPreviewResponse(
            total_transfers_recommended=len(transfers),
            total_units_transferred=len(transfers),
            unmet_shortages_count=len(unmet_shortages),
            transfers=transfers,
            unmet_shortages=unmet_shortages,
        )
