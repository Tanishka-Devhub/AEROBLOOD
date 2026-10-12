from dataclasses import dataclass
from datetime import date
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import BloodCompatibility, BloodRequest, BloodUnit, Donation


@dataclass
class AllocationCandidate:
    unit_id: int
    donation_id: int
    blood_bank_id: int
    donor_blood_group_id: int
    collection_date: date
    expiry_date: date
    status: str


@dataclass
class AllocationResult:
    request_id: int
    recipient_blood_group_id: int
    quantity_required: int
    quantity_allocated: int
    allocation_status: str  # "FULLY_ALLOCATABLE" | "PARTIALLY_ALLOCATABLE" | "NOT_ALLOCATABLE"
    is_fully_allocatable: bool
    selected_unit_ids: list[int]
    candidates: list[AllocationCandidate]


class AllocationEngine:
    """Decision engine that determines candidate blood units for a blood request."""

    def __init__(self, db: Session):
        self.db = db

    def allocate(
        self,
        request_id: int,
        as_of_date: date | None = None,
    ) -> AllocationResult:
        """Alias for find_candidates."""
        return self.find_candidates(request_id, as_of_date=as_of_date)

    def find_candidates(
        self,
        request_id: int,
        as_of_date: date | None = None,
    ) -> AllocationResult:
        """Find the best eligible candidate blood units for a blood request by request ID."""
        request = (
            self.db.query(BloodRequest)
            .filter(BloodRequest.request_id == request_id)
            .first()
        )
        if request is None:
            raise HTTPException(status_code=404, detail="Blood request not found")

        return self.find_candidates_for_request(request, as_of_date=as_of_date)

    def _fetch_candidates(
        self,
        compatible_donor_group_ids: list[int],
        current_date: date,
        quantity_required: int,
    ) -> Sequence[tuple[BloodUnit, int]]:
        """Query eligible candidates from database with FIFO + earliest expiry priority."""
        return (
            self.db.query(BloodUnit, Donation.blood_group_id)
            .join(Donation, BloodUnit.donation_id == Donation.donation_id)
            .filter(
                Donation.blood_group_id.in_(compatible_donor_group_ids),
                BloodUnit.status == "AVAILABLE",
                BloodUnit.expiry_date >= current_date,
            )
            .order_by(
                BloodUnit.expiry_date.asc(),
                BloodUnit.collection_date.asc(),
                BloodUnit.unit_id.asc(),
            )
            .limit(quantity_required)
            .all()
        )

    def find_candidates_for_request(
        self,
        request: BloodRequest,
        as_of_date: date | None = None,
    ) -> AllocationResult:
        """Find the best eligible candidate blood units for a given BloodRequest instance."""
        current_date = as_of_date if as_of_date is not None else date.today()
        quantity_required = request.quantity_required

        if quantity_required <= 0:
            return AllocationResult(
                request_id=request.request_id,
                recipient_blood_group_id=request.blood_group_id,
                quantity_required=quantity_required,
                quantity_allocated=0,
                allocation_status="NOT_ALLOCATABLE",
                is_fully_allocatable=False,
                selected_unit_ids=[],
                candidates=[],
            )

        # 1. Determine compatible donor blood groups from authoritative bloodcompatibility table
        compatible_rows = (
            self.db.query(BloodCompatibility.donor_blood_group_id)
            .filter(
                BloodCompatibility.recipient_blood_group_id == request.blood_group_id,
                BloodCompatibility.is_compatible == True,
            )
            .all()
        )
        compatible_donor_group_ids = [row[0] for row in compatible_rows]

        if not compatible_donor_group_ids:
            return AllocationResult(
                request_id=request.request_id,
                recipient_blood_group_id=request.blood_group_id,
                quantity_required=quantity_required,
                quantity_allocated=0,
                allocation_status="NOT_ALLOCATABLE",
                is_fully_allocatable=False,
                selected_unit_ids=[],
                candidates=[],
            )

        # 2. Query eligible candidates with FIFO + earliest expiry priority:
        #    - Unit status must be 'AVAILABLE'
        #    - Unit must not be expired (expiry_date >= current_date)
        #    - Unit donor blood group must be compatible
        #    - Ordered by: expiry_date ASC, collection_date ASC, unit_id ASC
        #    - Limited by quantity_required
        candidates_raw = self._fetch_candidates(
            compatible_donor_group_ids=compatible_donor_group_ids,
            current_date=current_date,
            quantity_required=quantity_required,
        )

        candidates = [
            AllocationCandidate(
                unit_id=unit.unit_id,
                donation_id=unit.donation_id,
                blood_bank_id=unit.blood_bank_id,
                donor_blood_group_id=donor_bg_id,
                collection_date=unit.collection_date,
                expiry_date=unit.expiry_date,
                status=unit.status,
            )
            for unit, donor_bg_id in candidates_raw
        ]

        selected_unit_ids = [c.unit_id for c in candidates]
        allocated_count = len(candidates)

        if allocated_count == quantity_required:
            status = "FULLY_ALLOCATABLE"
            is_fully = True
        elif allocated_count > 0:
            status = "PARTIALLY_ALLOCATABLE"
            is_fully = False
        else:
            status = "NOT_ALLOCATABLE"
            is_fully = False

        return AllocationResult(
            request_id=request.request_id,
            recipient_blood_group_id=request.blood_group_id,
            quantity_required=quantity_required,
            quantity_allocated=allocated_count,
            allocation_status=status,
            is_fully_allocatable=is_fully,
            selected_unit_ids=selected_unit_ids,
            candidates=candidates,
        )
