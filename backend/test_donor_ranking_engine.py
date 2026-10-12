"""Comprehensive test suite for the AERO-BLOOD Adaptive Donor Ranking Engine."""

from datetime import date, datetime, timedelta
import math
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import func

from database import SessionLocal
from main import app
from models import (
    Allocation,
    BloodBank,
    BloodCompatibility,
    BloodGroup,
    BloodRequest,
    BloodTransfer,
    BloodUnit,
    Donation,
    Donor,
    Hospital,
    HospitalStaff,
)
from schemas import DonorRankingPreviewRequest
from services.allocation_engine import AllocationEngine
from services.donor_ranking_engine import (
    ADAPTIVE_WEIGHTS,
    DEFAULT_MINIMUM_DAYS_SINCE_DONATION,
    DEFAULT_SPEED_KMPH,
    DEFAULT_UNKNOWN_LOCATION_SCORE,
    EARTH_RADIUS_KM,
    EXACT_MATCH_SCORE,
    COMPATIBLE_MATCH_SCORE,
    FIRST_TIME_DONOR_READINESS_SCORE,
    DonorRankingEngine,
    calculate_haversine_distance,
    calculate_readiness_score,
    calculate_response_time_score,
    generate_recommendation_reason,
)
from services.expiry_engine import ExpiryEngine
from services.redistribution_engine import RedistributionEngine
from services.shortage_surplus_engine import ShortageSurplusEngine


class TestDonorRankingEngineUnitFormulas(unittest.TestCase):
    """Test mathematical scoring formulas, distance, readiness, and adaptive weights."""

    def test_13_haversine_distance_calculation(self):
        """Test Haversine distance formula with exact coordinates."""
        # Same coordinate -> 0.0
        d_zero = calculate_haversine_distance(12.9716, 77.5946, 12.9716, 77.5946)
        self.assertEqual(d_zero, 0.0)

        # Distance between Bangalore (12.9716, 77.5946) and Mysore (12.2958, 76.6394) ~128 km
        d_known = calculate_haversine_distance(12.9716, 77.5946, 12.2958, 76.6394)
        self.assertAlmostEqual(d_known, 128.5, delta=2.0)

    def test_10_11_readiness_scoring_function(self):
        """Test donation readiness scoring function across various intervals."""
        # 1. Never donated / first-time donor
        score_none = calculate_readiness_score(None, minimum_days=56)
        self.assertEqual(score_none, FIRST_TIME_DONOR_READINESS_SCORE)

        # 2. Ineligible (under minimum threshold)
        score_ineligible = calculate_readiness_score(30, minimum_days=56)
        self.assertEqual(score_ineligible, 0.0)

        # 3. Exactly at minimum threshold (56 days) -> 0.50
        score_min = calculate_readiness_score(56, minimum_days=56)
        self.assertEqual(score_min, 0.50)

        # 4. Plateau recovery (>= 180 days) -> 1.00
        score_plateau = calculate_readiness_score(180, minimum_days=56)
        self.assertEqual(score_plateau, 1.00)
        score_long = calculate_readiness_score(365, minimum_days=56)
        self.assertEqual(score_long, 1.00)

        # 5. Monotonic increase between 56 and 180 days
        score_mid = calculate_readiness_score(118, minimum_days=56)
        self.assertGreater(score_mid, score_min)
        self.assertLess(score_mid, score_plateau)

    def test_14_15_16_17_response_time_scoring_function(self):
        """Test response time scoring behavior with known and missing locations."""
        # Missing location -> neutral midpoint 0.50 (no fake zero distance)
        score_missing = calculate_response_time_score(None)
        self.assertEqual(score_missing, DEFAULT_UNKNOWN_LOCATION_SCORE)

        # Immediate arrival (0 min) -> 1.00
        score_zero = calculate_response_time_score(0)
        self.assertEqual(score_zero, 1.00)

        # 60 minutes -> 0.50
        score_60 = calculate_response_time_score(60)
        self.assertEqual(score_60, 0.50)

        # >= 120 minutes -> 0.00
        score_max = calculate_response_time_score(120)
        self.assertEqual(score_max, 0.00)
        score_over = calculate_response_time_score(180)
        self.assertEqual(score_over, 0.00)

        # Monotonic: closer donor scores higher
        self.assertGreater(calculate_response_time_score(15), calculate_response_time_score(45))

    def test_18_19_20_adaptive_urgency_weights(self):
        """Test adaptive urgency weights reflect priority while keeping match dominant."""
        for priority, w in ADAPTIVE_WEIGHTS.items():
            # Match is always dominant factor
            self.assertEqual(w["match"], 0.50)
            # Weights sum to 1.00
            self.assertAlmostEqual(w["match"] + w["recency"] + w["response"], 1.00, places=4)

        # Response time influence increases from NORMAL -> URGENT -> EMERGENCY
        self.assertLess(ADAPTIVE_WEIGHTS["NORMAL"]["response"], ADAPTIVE_WEIGHTS["URGENT"]["response"])
        self.assertLess(ADAPTIVE_WEIGHTS["URGENT"]["response"], ADAPTIVE_WEIGHTS["EMERGENCY"]["response"])

        # Recency influence shifts to response time in emergencies
        self.assertGreater(ADAPTIVE_WEIGHTS["NORMAL"]["recency"], ADAPTIVE_WEIGHTS["EMERGENCY"]["recency"])


class TestDonorRankingEngineLiveEndpoints(unittest.TestCase):
    """Test preview endpoint and engine against existing live database."""

    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        self.engine = DonorRankingEngine(self.db)

    def tearDown(self):
        self.db.close()

    def test_01_valid_request_returns_recommendations(self):
        """Test that a valid blood request returns a ranked recommendation list."""
        response = self.client.post(
            "/donor-ranking-engine/preview",
            json={"request_id": 1, "top_n": 5},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["request_id"], 1)
        self.assertEqual(data["hospital_id"], 1)
        self.assertEqual(data["required_blood_group"], "A+")
        self.assertEqual(data["priority"], "NORMAL")
        self.assertGreater(data["donors_found"], 0)
        self.assertLessEqual(len(data["recommendations"]), 5)

        first_rec = data["recommendations"][0]
        self.assertEqual(first_rec["rank"], 1)
        self.assertIn("donor_id", first_rec)
        self.assertIn("blood_group", first_rec)
        self.assertIn("match_type", first_rec)
        self.assertIn("final_score", first_rec)
        self.assertIn("recommendation_reason", first_rec)

    def test_02_invalid_request_id_returns_404(self):
        """Test that a nonexistent request_id returns 404."""
        response = self.client.post(
            "/donor-ranking-engine/preview",
            json={"request_id": 9999999, "top_n": 10},
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_03_04_request_validation(self):
        """Test request body validation for top_n range."""
        # top_n < 1
        res_low = self.client.post(
            "/donor-ranking-engine/preview",
            json={"request_id": 1, "top_n": 0},
        )
        self.assertEqual(res_low.status_code, 422)

        # top_n > 100
        res_high = self.client.post(
            "/donor-ranking-engine/preview",
            json={"request_id": 1, "top_n": 101},
        )
        self.assertEqual(res_high.status_code, 422)

        # missing request_id
        res_missing = self.client.post(
            "/donor-ranking-engine/preview",
            json={"top_n": 10},
        )
        self.assertEqual(res_missing.status_code, 422)

    def test_22_23_24_25_26_scores_ordering_and_reasons(self):
        """Test that final scores are bounded, deterministic, and reasons are clear."""
        res = self.engine.rank_donors(request_id=1, top_n=10)
        self.assertGreater(len(res.recommendations), 0)

        prev_score = 100.1
        for rec in res.recommendations:
            # Score bounded in [0, 100]
            self.assertGreaterEqual(rec.final_score, 0.0)
            self.assertLessEqual(rec.final_score, 100.0)

            # Monotonic descending score
            self.assertLessEqual(rec.final_score, prev_score)
            prev_score = rec.final_score

            # Explanatory reason present and meaningful
            self.assertTrue(len(rec.recommendation_reason) > 10)
            self.assertTrue(
                "match" in rec.recommendation_reason.lower()
                or "readiness" in rec.recommendation_reason.lower()
            )

    def test_27_read_only_guarantee_no_production_mutation(self):
        """Test that ranking engine never mutates database tables."""
        tables = [
            BloodGroup,
            Donor,
            Donation,
            BloodUnit,
            BloodBank,
            Hospital,
            HospitalStaff,
            BloodRequest,
            Allocation,
            BloodTransfer,
            BloodCompatibility,
        ]
        counts_before = {
            t.__tablename__: self.db.query(func.count()).select_from(t).scalar()
            for t in tables
        }

        # Run preview
        self.engine.rank_donors(request_id=1, top_n=10)

        counts_after = {
            t.__tablename__: self.db.query(func.count()).select_from(t).scalar()
            for t in tables
        }
        self.assertEqual(counts_before, counts_after)


class TestDonorRankingEngineControlledScenarios(unittest.TestCase):
    """Controlled scenario tests with temporary test fixtures to verify business logic."""

    def setUp(self):
        self.db = SessionLocal()
        self.engine = DonorRankingEngine(self.db)
        self.created_donations: list[int] = []
        self.created_donors: list[int] = []
        self.created_requests: list[int] = []

    def tearDown(self):
        if self.created_donations:
            self.db.query(Donation).filter(
                Donation.donation_id.in_(self.created_donations)
            ).delete(synchronize_session=False)
        if self.created_donors:
            self.db.query(Donor).filter(
                Donor.donor_id.in_(self.created_donors)
            ).delete(synchronize_session=False)
        if self.created_requests:
            self.db.query(BloodRequest).filter(
                BloodRequest.request_id.in_(self.created_requests)
            ).delete(synchronize_session=False)
        self.db.commit()
        self.db.close()

    def _create_temp_donor(
        self,
        blood_group_id: int,
        status: str = "ACTIVE",
    ) -> Donor:
        unique_phone = f"+988{len(self.created_donors):07d}"
        donor = Donor(
            full_name=f"Test Donor {len(self.created_donors)}",
            date_of_birth=date(1992, 5, 10),
            gender="FEMALE",
            blood_group_id=blood_group_id,
            phone=unique_phone,
            registration_date=date(2025, 1, 1),
            status=status,
        )
        self.db.add(donor)
        self.db.commit()
        self.db.refresh(donor)
        self.created_donors.append(donor.donor_id)
        return donor

    def _create_temp_donation(
        self,
        donor_id: int,
        blood_group_id: int,
        days_ago: int,
        eligibility: str = "ELIGIBLE",
        screening: str = "PASSED",
    ) -> Donation:
        today = date(2026, 10, 6)
        donation = Donation(
            donor_id=donor_id,
            blood_bank_id=1,
            blood_group_id=blood_group_id,
            donation_date=today - timedelta(days=days_ago),
            eligibility_status=eligibility,
            screening_status=screening,
        )
        self.db.add(donation)
        self.db.commit()
        self.db.refresh(donation)
        self.created_donations.append(donation.donation_id)
        return donation

    def _create_temp_request(
        self,
        blood_group_id: int,
        priority: str = "NORMAL",
    ) -> BloodRequest:
        today = datetime(2026, 10, 6, 10, 0, 0)
        req = BloodRequest(
            hospital_id=1,
            patient_reference=f"PAT-TEST-{len(self.created_requests)}",
            blood_group_id=blood_group_id,
            quantity_required=2,
            requested_by_staff_id=1,
            attending_doctor_id=1,
            doctor_approval_status="APPROVED",
            request_date=today,
            required_by=today + timedelta(days=1),
            priority=priority,
            status="PENDING",
        )
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        self.created_requests.append(req.request_id)
        return req

    def test_06_exact_preferred_over_compatible_substitute(self):
        """Test exact blood group donor ranks higher than compatible substitute with equal recency."""
        eval_date = date(2026, 10, 6)
        # Request for A+ (group 1)
        req = self._create_temp_request(blood_group_id=1, priority="NORMAL")

        # Donor 1: Exact A+ (group 1), donated 120 days ago
        donor_exact = self._create_temp_donor(blood_group_id=1)
        self._create_temp_donation(donor_exact.donor_id, blood_group_id=1, days_ago=120)

        # Donor 2: Compatible O- (group 8), donated 120 days ago
        donor_sub = self._create_temp_donor(blood_group_id=8)
        self._create_temp_donation(donor_sub.donor_id, blood_group_id=8, days_ago=120)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=2,
            evaluation_date=eval_date,
            donor_ids=[donor_exact.donor_id, donor_sub.donor_id],
        )

        donor_ids = [r.donor_id for r in res.recommendations]
        self.assertIn(donor_exact.donor_id, donor_ids)
        self.assertIn(donor_sub.donor_id, donor_ids)

        # Donor Exact must rank higher than Donor Substitute
        rank_exact = next(r.rank for r in res.recommendations if r.donor_id == donor_exact.donor_id)
        rank_sub = next(r.rank for r in res.recommendations if r.donor_id == donor_sub.donor_id)
        self.assertLess(rank_exact, rank_sub)

    def test_07_incompatible_donor_excluded(self):
        """Test that an incompatible donor is completely excluded from recommendations."""
        eval_date = date(2026, 10, 6)
        # Request for O- (group 8). Only O- is compatible.
        req = self._create_temp_request(blood_group_id=8, priority="NORMAL")

        # Incompatible donor: AB+ (group 5)
        donor_incompat = self._create_temp_donor(blood_group_id=5)
        self._create_temp_donation(donor_incompat.donor_id, blood_group_id=5, days_ago=120)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=10,
            evaluation_date=eval_date,
            donor_ids=[donor_incompat.donor_id],
        )

        donor_ids = [r.donor_id for r in res.recommendations]
        self.assertNotIn(donor_incompat.donor_id, donor_ids)
        self.assertEqual(len(res.recommendations), 0)

    def test_09_recently_donated_donor_excluded_by_hard_filter(self):
        """Test donor who donated too recently (< minimum_days_since_donation) is excluded."""
        eval_date = date(2026, 10, 6)
        req = self._create_temp_request(blood_group_id=1, priority="NORMAL")

        # Donor who donated only 20 days ago (< 56 days)
        donor_recent = self._create_temp_donor(blood_group_id=1)
        self._create_temp_donation(donor_recent.donor_id, blood_group_id=1, days_ago=20)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=10,
            evaluation_date=eval_date,
            minimum_days_since_donation=56,
            donor_ids=[donor_recent.donor_id],
        )

        donor_ids = [r.donor_id for r in res.recommendations]
        self.assertNotIn(donor_recent.donor_id, donor_ids)
        self.assertEqual(len(res.recommendations), 0)

    def test_12_latest_donation_selected_when_donor_has_multiple_donations(self):
        """Test that latest donation is selected when donor has multiple donation records."""
        eval_date = date(2026, 10, 6)
        req = self._create_temp_request(blood_group_id=1, priority="NORMAL")

        donor_multi = self._create_temp_donor(blood_group_id=1)
        # Old donation: 300 days ago
        self._create_temp_donation(donor_multi.donor_id, blood_group_id=1, days_ago=300)
        # Latest donation: 100 days ago
        self._create_temp_donation(donor_multi.donor_id, blood_group_id=1, days_ago=100)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=10,
            evaluation_date=eval_date,
            donor_ids=[donor_multi.donor_id],
        )

        rec = next((r for r in res.recommendations if r.donor_id == donor_multi.donor_id), None)
        self.assertIsNotNone(rec)
        # Must reflect the latest donation (100 days), not 300 days
        self.assertEqual(rec.days_since_last_donation, 100)

    def test_11_first_time_donor_handled_cleanly(self):
        """Test first-time donor with no donation history is ranked with null days and baseline score."""
        eval_date = date(2026, 10, 6)
        req = self._create_temp_request(blood_group_id=1, priority="NORMAL")

        # Donor with NO donations
        donor_first_time = self._create_temp_donor(blood_group_id=1)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=10,
            evaluation_date=eval_date,
            donor_ids=[donor_first_time.donor_id],
        )

        rec = next((r for r in res.recommendations if r.donor_id == donor_first_time.donor_id), None)
        self.assertIsNotNone(rec)
        self.assertIsNone(rec.days_since_last_donation)
        self.assertEqual(rec.recency_score, round(FIRST_TIME_DONOR_READINESS_SCORE * 100.0, 2))
        self.assertIn("first-time", rec.recommendation_reason.lower())

    def test_21_emergency_does_not_override_compatibility_or_eligibility(self):
        """Test that EMERGENCY priority does not permit incompatible or ineligible donors."""
        eval_date = date(2026, 10, 6)
        req = self._create_temp_request(blood_group_id=8, priority="EMERGENCY")

        # Incompatible donor
        donor_incompat = self._create_temp_donor(blood_group_id=1)
        self._create_temp_donation(donor_incompat.donor_id, blood_group_id=1, days_ago=200)

        # Ineligible donor (recently donated)
        donor_recent = self._create_temp_donor(blood_group_id=8)
        self._create_temp_donation(donor_recent.donor_id, blood_group_id=8, days_ago=10)

        res = self.engine.rank_donors(
            request_id=req.request_id,
            top_n=10,
            evaluation_date=eval_date,
            donor_ids=[donor_incompat.donor_id, donor_recent.donor_id],
        )

        donor_ids = [r.donor_id for r in res.recommendations]
        self.assertNotIn(donor_incompat.donor_id, donor_ids)
        self.assertNotIn(donor_recent.donor_id, donor_ids)
        self.assertEqual(len(res.recommendations), 0)


class TestFullEngineRegressionSuite(unittest.TestCase):
    """Ensure all four existing production engines continue to pass regression checks."""

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_regression_allocation_engine(self):
        """Regression test for AllocationEngine."""
        res = AllocationEngine(self.db).find_candidates(request_id=1)
        self.assertIsNotNone(res)
        self.assertEqual(res.request_id, 1)

    def test_regression_expiry_engine(self):
        """Regression test for ExpiryEngine."""
        res = ExpiryEngine(self.db).find_expiring_units(warning_days=3)
        self.assertIsNotNone(res)
        self.assertGreaterEqual(res.counts.total_flagged, 0)

    def test_regression_shortage_surplus_engine(self):
        """Regression test for ShortageSurplusEngine."""
        res = ShortageSurplusEngine(self.db).detect_for_blood_bank(blood_bank_id=1)
        self.assertIsNotNone(res)
        self.assertEqual(res.blood_bank_id, 1)

    def test_regression_redistribution_engine(self):
        """Regression test for RedistributionEngine."""
        res = RedistributionEngine(self.db).preview(destination_blood_bank_id=1, max_transfers=5)
        self.assertIsNotNone(res)
        self.assertGreaterEqual(res.total_transfers_recommended, 0)


if __name__ == "__main__":
    unittest.main()
