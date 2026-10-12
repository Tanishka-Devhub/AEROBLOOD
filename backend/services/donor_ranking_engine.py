"""Adaptive Donor Ranking Engine for AERO-BLOOD.

Identifies, filters, and ranks eligible compatible blood donors for an unfulfilled
or urgent blood request using an adaptive multi-criteria decision model.
"""

from datetime import date
import math
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import BloodCompatibility, BloodGroup, BloodRequest, Donation, Donor, Hospital
from schemas import (
    DonorRankingPreviewResponse,
    DonorRecommendationItem,
)

# Operational & Clinical Policy Defaults
DEFAULT_SPEED_KMPH = 40.0
DEFAULT_MINIMUM_DAYS_SINCE_DONATION = 56  # Standard whole-blood recovery interval
EARTH_RADIUS_KM = 6371.0
MAX_TRAVEL_MINUTES = 120.0  # Bounded 2-hour travel window for scoring
DEFAULT_UNKNOWN_LOCATION_SCORE = 0.50  # Neutral midpoint when distance is unavailable
FIRST_TIME_DONOR_READINESS_SCORE = 0.85  # Baseline readiness for first-time donors

# Normalized Match Dimension Scores
EXACT_MATCH_SCORE = 1.00
COMPATIBLE_MATCH_SCORE = 0.75

# Adaptive Urgency Weights: match is always dominant (0.50); response time scales with priority
ADAPTIVE_WEIGHTS = {
    "NORMAL": {
        "match": 0.50,
        "recency": 0.20,
        "response": 0.30,
    },
    "URGENT": {
        "match": 0.50,
        "recency": 0.15,
        "response": 0.35,
    },
    "EMERGENCY": {
        "match": 0.50,
        "recency": 0.10,
        "response": 0.40,
    },
}


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate the great-circle distance between two geographic coordinates in kilometers."""
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


def calculate_readiness_score(
    days_since_last_donation: int | None,
    minimum_days: int = DEFAULT_MINIMUM_DAYS_SINCE_DONATION,
) -> float:
    """Convert days since last donation into a normalized readiness score in [0.0, 1.0].

    - Never donated (None): 0.85 (first-time donor with full recovery)
    - Just passed minimum threshold (e.g. 56 days): 0.50 (baseline readiness)
    - Full recovery plateau (180 days or more): 1.00 (maximum readiness)
    - Monotonically increasing between minimum_days and 180 days.
    """
    if days_since_last_donation is None:
        return FIRST_TIME_DONOR_READINESS_SCORE

    if days_since_last_donation < minimum_days:
        return 0.0

    plateau_days = 180
    if days_since_last_donation >= plateau_days:
        return 1.00

    fraction = (days_since_last_donation - minimum_days) / float(plateau_days - minimum_days)
    return 0.50 + 0.50 * fraction


def calculate_response_time_score(
    estimated_arrival_minutes: int | None,
) -> float:
    """Normalize travel time into a [0.0, 1.0] score.

    - Missing coordinates / unknown: DEFAULT_UNKNOWN_LOCATION_SCORE (0.50)
    - 0 minutes: 1.00
    - 60 minutes: 0.50
    - 120 minutes or more: 0.00
    - Monotonically decreasing with arrival time.
    """
    if estimated_arrival_minutes is None:
        return DEFAULT_UNKNOWN_LOCATION_SCORE

    if estimated_arrival_minutes <= 0:
        return 1.00

    if estimated_arrival_minutes >= MAX_TRAVEL_MINUTES:
        return 0.00

    return max(0.0, 1.0 - (estimated_arrival_minutes / MAX_TRAVEL_MINUTES))


def generate_recommendation_reason(
    match_type: str,
    donor_group_name: str,
    days_since_last_donation: int | None,
    estimated_arrival_minutes: int | None,
    distance_km: float | None,
) -> str:
    """Construct an informative, explainable recommendation reason."""
    reasons = []

    # 1. Match type
    if match_type == "EXACT":
        reasons.append(f"Exact blood-group match ({donor_group_name})")
    else:
        reasons.append(f"Compatible substitute blood-group match ({donor_group_name})")

    # 2. Recency / readiness
    if days_since_last_donation is None:
        reasons.append("first-time eligible donor with no recent donation restriction")
    elif days_since_last_donation >= 180:
        reasons.append(f"excellent donation readiness ({days_since_last_donation} days since last donation)")
    else:
        reasons.append(f"eligible donation readiness ({days_since_last_donation} days since last donation)")

    # 3. Distance / travel
    if estimated_arrival_minutes is not None and distance_km is not None:
        if estimated_arrival_minutes <= 30:
            reasons.append(f"short estimated travel time of {estimated_arrival_minutes} min ({distance_km:.1f} km)")
        elif estimated_arrival_minutes <= 60:
            reasons.append(f"moderate estimated travel time of {estimated_arrival_minutes} min ({distance_km:.1f} km)")
        else:
            reasons.append(f"longer estimated travel time of {estimated_arrival_minutes} min ({distance_km:.1f} km)")
    else:
        reasons.append("travel estimation unavailable (missing location coordinates)")

    return ", ".join(reasons) + "."


class DonorRankingEngine:
    """Decision-support ranking engine that evaluates eligible compatible blood donors for a blood request."""

    def __init__(self, db: Session):
        self.db = db

    def rank_donors(
        self,
        request_id: int,
        top_n: int = 10,
        evaluation_date: date | None = None,
        minimum_days_since_donation: int = DEFAULT_MINIMUM_DAYS_SINCE_DONATION,
        speed_kmph: float = DEFAULT_SPEED_KMPH,
        donor_ids: Sequence[int] | None = None,
    ) -> DonorRankingPreviewResponse:
        """Find, filter, score, and rank compatible eligible donors for a blood request."""
        # 1. Validate blood request
        request = (
            self.db.query(BloodRequest)
            .filter(BloodRequest.request_id == request_id)
            .first()
        )
        if request is None:
            raise HTTPException(status_code=404, detail="Blood request not found")

        # 2. Retrieve hospital metadata
        hospital = (
            self.db.query(Hospital)
            .filter(Hospital.hospital_id == request.hospital_id)
            .first()
        )
        hospital_name = hospital.name if hospital else f"Hospital #{request.hospital_id}"
        hospital_lat = (
            float(hospital.latitude)
            if hospital and hospital.latitude is not None
            else None
        )
        hospital_lon = (
            float(hospital.longitude)
            if hospital and hospital.longitude is not None
            else None
        )

        # 3. Retrieve required blood group name
        req_blood_group = (
            self.db.query(BloodGroup)
            .filter(BloodGroup.blood_group_id == request.blood_group_id)
            .first()
        )
        required_blood_group_name = (
            req_blood_group.group_name
            if req_blood_group
            else str(request.blood_group_id)
        )

        # 4. Determine compatible donor blood groups from authoritative BloodCompatibility table
        compat_rows = (
            self.db.query(BloodCompatibility.donor_blood_group_id)
            .filter(
                BloodCompatibility.recipient_blood_group_id == request.blood_group_id,
                BloodCompatibility.is_compatible == True,
            )
            .all()
        )
        compatible_donor_group_ids = [r[0] for r in compat_rows]

        if not compatible_donor_group_ids:
            return DonorRankingPreviewResponse(
                request_id=request.request_id,
                hospital_id=request.hospital_id,
                hospital_name=hospital_name,
                required_blood_group=required_blood_group_name,
                priority=request.priority,
                donors_found=0,
                recommendations=[],
                message="No eligible compatible donors were found for this request.",
            )

        # 5. Preload blood group names
        all_groups = self.db.query(BloodGroup).all()
        group_names = {g.blood_group_id: g.group_name for g in all_groups}

        today = evaluation_date if evaluation_date is not None else date.today()

        # 6. Query candidate donors along with their latest donation in a single query (No N+1)
        # Chronologically latest donation (max donation_date, tie-broken by donation_id)
        max_date_subquery = self.db.query(
            Donation.donor_id,
            func.max(Donation.donation_date).label("max_donation_date"),
        ).group_by(Donation.donor_id)
        if donor_ids is not None:
            max_date_subquery = max_date_subquery.filter(
                Donation.donor_id.in_(donor_ids)
            )
        max_date_sub = max_date_subquery.subquery()

        latest_subquery_builder = (
            self.db.query(
                Donation.donor_id,
                func.max(Donation.donation_id).label("latest_donation_id"),
            )
            .join(
                max_date_sub,
                (Donation.donor_id == max_date_sub.c.donor_id)
                & (Donation.donation_date == max_date_sub.c.max_donation_date),
            )
            .group_by(Donation.donor_id)
        )
        latest_subquery = latest_subquery_builder.subquery()

        candidate_query = (
            self.db.query(Donor, Donation)
            .outerjoin(latest_subquery, Donor.donor_id == latest_subquery.c.donor_id)
            .outerjoin(
                Donation, Donation.donation_id == latest_subquery.c.latest_donation_id
            )
            .filter(
                Donor.status == "ACTIVE",
                Donor.blood_group_id.in_(compatible_donor_group_ids),
            )
        )
        if donor_ids is not None:
            candidate_query = candidate_query.filter(Donor.donor_id.in_(donor_ids))

        candidate_rows = candidate_query.all()

        # 7. Resolve adaptive weights based on request priority
        norm_priority = request.priority.strip().upper() if request.priority else "NORMAL"
        weights = ADAPTIVE_WEIGHTS.get(norm_priority, ADAPTIVE_WEIGHTS["NORMAL"])

        scored_candidates: list[dict] = []

        # 8. Stage A (Hard Filters) & Stage B (Soft Scoring)
        for donor, latest_donation in candidate_rows:
            # Stage A — Hard Filter: latest donation eligibility & screening
            days_since_last_donation: int | None = None
            if latest_donation is not None:
                # If latest recorded donation was ineligible or screening failed, exclude
                if (
                    latest_donation.eligibility_status != "ELIGIBLE"
                    or latest_donation.screening_status == "FAILED"
                ):
                    continue

                # Hard Filter: recent donation interval
                days_since = (today - latest_donation.donation_date).days
                if days_since < minimum_days_since_donation:
                    continue

                days_since_last_donation = days_since
            else:
                # First-time donor has no previous donation record -> passes recency gate
                days_since_last_donation = None

            # Stage B — Soft Scoring
            # 1. Match score
            donor_group_name = group_names.get(
                donor.blood_group_id, str(donor.blood_group_id)
            )
            if donor.blood_group_id == request.blood_group_id:
                match_type = "EXACT"
                match_score = EXACT_MATCH_SCORE
            else:
                match_type = "COMPATIBLE"
                match_score = COMPATIBLE_MATCH_SCORE

            # 2. Recency / readiness score
            recency_score = calculate_readiness_score(
                days_since_last_donation, minimum_days=minimum_days_since_donation
            )

            # 3. Distance & response time score
            donor_lat = getattr(donor, "latitude", None)
            donor_lon = getattr(donor, "longitude", None)

            if (
                donor_lat is not None
                and donor_lon is not None
                and hospital_lat is not None
                and hospital_lon is not None
            ):
                dist_km = calculate_haversine_distance(
                    float(donor_lat),
                    float(donor_lon),
                    hospital_lat,
                    hospital_lon,
                )
                dist_km = round(dist_km, 2)
                effective_speed = max(float(speed_kmph), 1.0)
                travel_hours = dist_km / effective_speed
                arrival_minutes = max(1, round(travel_hours * 60))
            else:
                dist_km = None
                arrival_minutes = None

            response_time_score = calculate_response_time_score(arrival_minutes)

            # 4. Adaptive Final Score (0 - 100)
            raw_final = (
                match_score * weights["match"]
                + recency_score * weights["recency"]
                + response_time_score * weights["response"]
            )
            final_score = round(raw_final * 100.0, 2)

            reason_str = generate_recommendation_reason(
                match_type=match_type,
                donor_group_name=donor_group_name,
                days_since_last_donation=days_since_last_donation,
                estimated_arrival_minutes=arrival_minutes,
                distance_km=dist_km,
            )

            # Deterministic tie-breaking sort key:
            # 1) final_score DESC
            # 2) exact match first (0 vs 1)
            # 3) arrival_minutes ASC (None placed at infinity)
            # 4) days_since_last_donation DESC (None placed at neutral 9999)
            # 5) donor_id ASC (unique stable tie-breaker)
            sort_key = (
                -final_score,
                0 if match_type == "EXACT" else 1,
                float("inf") if arrival_minutes is None else arrival_minutes,
                -(days_since_last_donation if days_since_last_donation is not None else 9999),
                donor.donor_id,
            )

            scored_candidates.append(
                {
                    "sort_key": sort_key,
                    "donor_id": donor.donor_id,
                    "blood_group": donor_group_name,
                    "match_type": match_type,
                    "match_score": round(match_score * 100.0, 2),
                    "days_since_last_donation": days_since_last_donation,
                    "recency_score": round(recency_score * 100.0, 2),
                    "distance_km": dist_km,
                    "estimated_arrival_minutes": arrival_minutes,
                    "response_time_score": round(response_time_score * 100.0, 2),
                    "final_score": final_score,
                    "recommendation_reason": reason_str,
                }
            )

        # 9. Sort deterministically and select Top-N
        scored_candidates.sort(key=lambda c: c["sort_key"])
        selected_candidates = scored_candidates[:top_n]

        recommendations: list[DonorRecommendationItem] = []
        for rank_idx, cand in enumerate(selected_candidates, 1):
            recommendations.append(
                DonorRecommendationItem(
                    rank=rank_idx,
                    donor_id=cand["donor_id"],
                    blood_group=cand["blood_group"],
                    match_type=cand["match_type"],
                    match_score=cand["match_score"],
                    days_since_last_donation=cand["days_since_last_donation"],
                    recency_score=cand["recency_score"],
                    distance_km=cand["distance_km"],
                    estimated_arrival_minutes=cand["estimated_arrival_minutes"],
                    response_time_score=cand["response_time_score"],
                    final_score=cand["final_score"],
                    recommendation_reason=cand["recommendation_reason"],
                )
            )

        message = (
            "No eligible compatible donors were found for this request."
            if not recommendations
            else None
        )

        return DonorRankingPreviewResponse(
            request_id=request.request_id,
            hospital_id=request.hospital_id,
            hospital_name=hospital_name,
            required_blood_group=required_blood_group_name,
            priority=request.priority,
            donors_found=len(recommendations),
            recommendations=recommendations,
            message=message,
        )
