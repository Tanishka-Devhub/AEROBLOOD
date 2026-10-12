"""Comprehensive test suite for the AERO-BLOOD Redistribution / Inter-Bank Transfer Recommendation Engine."""

import math
from datetime import date, datetime, timedelta
import unittest

from fastapi import HTTPException
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
from schemas import (
    InventoryStatus,
    RedistributionPreviewRequest,
    RedistributionReason,
)
from services.allocation_engine import AllocationEngine
from services.expiry_engine import ExpiryEngine
from services.redistribution_engine import (
    DEFAULT_EXPIRY_MARGIN_DAYS,
    DEFAULT_EXPIRY_WARNING_DAYS,
    DEFAULT_SPEED_KMPH,
    EARTH_RADIUS_KM,
    RedistributionEngine,
    calculate_haversine_distance,
)
from services.shortage_surplus_engine import ShortageSurplusEngine


class TestRedistributionEngineMathAndCompatibility(unittest.TestCase):
    """Test mathematical formulas and authoritative compatibility ordering."""

    def setUp(self):
        self.db = SessionLocal()
        self.engine = RedistributionEngine(self.db)

    def tearDown(self):
        self.db.close()

    def test_18_haversine_distance_calculation(self):
        """Test Haversine distance matches true great-circle distance."""
        # Same point -> 0.0 km
        dist_zero = calculate_haversine_distance(11.675442, 92.747338, 11.675442, 92.747338)
        self.assertEqual(dist_zero, 0.0)

        # Distance between Bank 1 (Port Blair) and Bank 2 (Port Blair)
        # Bank 1: 11.675442, 92.747338
        # Bank 2: 11.649693, 92.717418
        dist = calculate_haversine_distance(11.675442, 92.747338, 11.649693, 92.717418)
        self.assertAlmostEqual(dist, 4.3375, places=2)

    def test_07_08_donor_versatility_and_compatibility_ordering(self):
        """Test donor versatility and compatibility ordering from authoritative DB."""
        versatility = self.engine._get_donor_versatility()
        # Verify from live database:
        # AB+ can donate to 1 recipient (AB+ only)
        # A+, B+, AB- can donate to 2 recipients
        # A-, B-, O+ can donate to 4 recipients
        # O- can donate to 8 recipients (universal donor)
        groups = {g.blood_group_id: g.group_name for g in self.db.query(BloodGroup).all()}
        group_by_name = {g.group_name: g.blood_group_id for g in self.db.query(BloodGroup).all()}

        self.assertEqual(versatility[group_by_name["AB+"]], 1)
        self.assertEqual(versatility[group_by_name["A+"]], 2)
        self.assertEqual(versatility[group_by_name["B+"]], 2)
        self.assertEqual(versatility[group_by_name["AB-"]], 2)
        self.assertEqual(versatility[group_by_name["A-"]], 4)
        self.assertEqual(versatility[group_by_name["B-"]], 4)
        self.assertEqual(versatility[group_by_name["O+"]], 4)
        self.assertEqual(versatility[group_by_name["O-"]], 8)

        # Test compatibility ordering for A+ recipient:
        # 1. Exact A+
        # 2. A- (versatility 4, id 2)
        # 3. O+ (versatility 4, id 7)
        # 4. O- (versatility 8, id 8, universal donor preserved last)
        a_plus_id = group_by_name["A+"]
        order = self.engine._get_compatible_donor_order(a_plus_id, versatility)
        order_names = [groups[gid] for gid in order]
        self.assertEqual(order_names[0], "A+")  # Exact first
        self.assertEqual(order_names[-1], "O-")  # O- strictly last resort
        self.assertEqual(order_names, ["A+", "A-", "O+", "O-"])

        # Test compatibility ordering for AB+ recipient (universal recipient):
        # Exact AB+ first, then substitutes by ascending versatility, O- last
        ab_plus_id = group_by_name["AB+"]
        ab_order = self.engine._get_compatible_donor_order(ab_plus_id, versatility)
        ab_order_names = [groups[gid] for gid in ab_order]
        self.assertEqual(ab_order_names[0], "AB+")
        self.assertEqual(ab_order_names[-1], "O-")

        # Test for all non-O- recipients, O- is always strictly last resort
        for r_name in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+"]:
            r_id = group_by_name[r_name]
            r_order = self.engine._get_compatible_donor_order(r_id, versatility)
            self.assertEqual(groups[r_order[-1]], "O-")

        # For O- recipient, only O- is compatible
        o_minus_id = group_by_name["O-"]
        o_minus_order = self.engine._get_compatible_donor_order(o_minus_id, versatility)
        self.assertEqual([groups[gid] for gid in o_minus_order], ["O-"])


class TestRedistributionEngineLiveEndpoints(unittest.TestCase):
    """Test preview endpoints against live database with read-only validation."""

    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        self.engine = RedistributionEngine(self.db)

    def tearDown(self):
        self.db.close()

    def test_01_existing_destination_bank_succeeds(self):
        """Test that preview succeeds on an existing blood bank."""
        response = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "max_transfers": 10},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_transfers_recommended", data)
        self.assertIn("total_units_transferred", data)
        self.assertIn("unmet_shortages_count", data)
        self.assertIn("transfers", data)
        self.assertIn("unmet_shortages", data)

    def test_02_nonexistent_destination_bank_returns_404(self):
        """Test that preview returns 404 for nonexistent destination blood bank."""
        response = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 9999999},
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_03_nonexistent_source_bank_returns_404(self):
        """Test that preview returns 404 for nonexistent source blood bank."""
        response = self.client.post(
            "/redistribution-engine/preview",
            json={
                "destination_blood_bank_id": 1,
                "source_blood_bank_id": 9999999,
            },
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("source blood bank not found", response.json()["detail"].lower())

    def test_same_source_and_destination_bank_returns_422(self):
        """Test that request fails validation when source equals destination."""
        response = self.client.post(
            "/redistribution-engine/preview",
            json={
                "destination_blood_bank_id": 1,
                "source_blood_bank_id": 1,
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_destination_bank_with_no_shortage_returns_empty_plan(self):
        """Test that a blood bank with no active shortages produces empty transfers and unmet."""
        # Bank 3 was verified to have balanced/surplus stock for all 8 blood groups
        response = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 3},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_transfers_recommended"], 0)
        self.assertEqual(data["total_units_transferred"], 0)
        self.assertEqual(data["unmet_shortages_count"], 0)
        self.assertEqual(data["transfers"], [])
        self.assertEqual(data["unmet_shortages"], [])

    def test_validation_ranges(self):
        """Test public API enforces max_transfers, speed, and expiry_margin ranges."""
        # max_transfers < 1
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "max_transfers": 0},
        )
        self.assertEqual(res.status_code, 422)

        # max_transfers > 200
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "max_transfers": 201},
        )
        self.assertEqual(res.status_code, 422)

        # speed < 5
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "speed_kmph": 4.0},
        )
        self.assertEqual(res.status_code, 422)

        # speed > 150
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "speed_kmph": 151.0},
        )
        self.assertEqual(res.status_code, 422)

        # expiry_margin < 0
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "expiry_margin_days": -1},
        )
        self.assertEqual(res.status_code, 422)

        # expiry_margin > 14
        res = self.client.post(
            "/redistribution-engine/preview",
            json={"destination_blood_bank_id": 1, "expiry_margin_days": 15},
        )
        self.assertEqual(res.status_code, 422)


class TestRedistributionEngineControlledScenarios(unittest.TestCase):
    """Controlled scenario tests with temporary records and verified cleanup."""

    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.engine = RedistributionEngine(cls.db)

        # Record baseline DB counts before creating test fixtures
        cls.tables = [
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
        cls.baseline_counts = {
            t.__tablename__: cls.db.query(func.count()).select_from(t).scalar()
            for t in cls.tables
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        self.db = SessionLocal()
        self.engine = RedistributionEngine(self.db)
        self.created_units: list[int] = []
        self.created_donations: list[int] = []
        self.created_donors: list[int] = []
        self.created_banks: list[int] = []

    def tearDown(self):
        # Strictly clean up all temporary test records
        if self.created_units:
            self.db.query(BloodUnit).filter(
                BloodUnit.unit_id.in_(self.created_units)
            ).delete(synchronize_session=False)
        if self.created_donations:
            self.db.query(Donation).filter(
                Donation.donation_id.in_(self.created_donations)
            ).delete(synchronize_session=False)
        if self.created_donors:
            self.db.query(Donor).filter(
                Donor.donor_id.in_(self.created_donors)
            ).delete(synchronize_session=False)
        if self.created_banks:
            self.db.query(BloodBank).filter(
                BloodBank.blood_bank_id.in_(self.created_banks)
            ).delete(synchronize_session=False)
        self.db.commit()
        self.db.close()

    def _create_temp_bank(
        self,
        name: str,
        lat: float | None = 12.0,
        lon: float | None = 77.0,
        city: str = "TestCity",
    ) -> BloodBank:
        bank = BloodBank(
            name=name,
            address="123 Test Street",
            city=city,
            latitude=lat,
            longitude=lon,
            status="ACTIVE",
        )
        self.db.add(bank)
        self.db.commit()
        self.db.refresh(bank)
        self.created_banks.append(bank.blood_bank_id)
        return bank

    def _create_temp_donor(self, blood_group_id: int) -> Donor:
        unique_phone = f"+999{len(self.created_donors):07d}"
        donor = Donor(
            full_name=f"Test Donor {len(self.created_donors)}",
            date_of_birth=date(1990, 1, 1),
            gender="MALE",
            blood_group_id=blood_group_id,
            phone=unique_phone,
            registration_date=date(2026, 1, 1),
            status="ACTIVE",
        )
        self.db.add(donor)
        self.db.commit()
        self.db.refresh(donor)
        self.created_donors.append(donor.donor_id)
        return donor

    def _create_temp_units(
        self,
        bank_id: int,
        blood_group_id: int,
        count: int,
        days_to_expiry: int = 15,
        status: str = "AVAILABLE",
    ) -> list[BloodUnit]:
        donor = self._create_temp_donor(blood_group_id)
        units = []
        today = date(2026, 10, 6)
        for i in range(count):
            donation = Donation(
                donor_id=donor.donor_id,
                blood_bank_id=bank_id,
                blood_group_id=blood_group_id,
                donation_date=today - timedelta(days=5),
                eligibility_status="ELIGIBLE",
                screening_status="PASSED",
            )
            self.db.add(donation)
            self.db.commit()
            self.db.refresh(donation)
            self.created_donations.append(donation.donation_id)

            unit = BloodUnit(
                donation_id=donation.donation_id,
                blood_bank_id=bank_id,
                collection_date=today - timedelta(days=5),
                expiry_date=today + timedelta(days=days_to_expiry),
                status=status,
                created_at=datetime(2026, 10, 1, 12, 0, 0),
            )
            self.db.add(unit)
            self.db.commit()
            self.db.refresh(unit)
            self.created_units.append(unit.unit_id)
            units.append(unit)
        return units

    def _populate_non_a_plus_stock(self, bank_id: int):
        """Populate baseline stock for blood groups 2..8 so only group 1 (A+) is in shortage."""
        for gid in range(2, 9):
            min_req = 8 if gid in (7, 8) else 5
            self._create_temp_units(bank_id, blood_group_id=gid, count=min_req, days_to_expiry=30)

    def test_09_11_12_source_surplus_and_budget_preservation(self):
        """Test source bank never drops below min_threshold and budget decrements in memory."""
        eval_date = date(2026, 10, 6)
        # Blood group 1 is A+ (min_threshold = 5)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        # Dest bank has 0 units of A+ (shortfall = 5)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.05, lon=77.05)
        # Source bank has 7 units of A+. min_threshold is 5, so transfer budget is 7 - 5 = 2.
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=7, days_to_expiry=20)

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )

        # Source can donate at most 2 units (7 - 5 = 2)
        self.assertEqual(res.total_transfers_recommended, 2)
        self.assertEqual(len(res.transfers), 2)
        # Remaining shortfall for Dest is 5 - 2 = 3
        self.assertEqual(res.unmet_shortages_count, 1)
        self.assertEqual(res.unmet_shortages[0].remaining_shortfall, 3)

    def test_10_source_in_shortage_cannot_donate(self):
        """Test source bank that is itself in shortage cannot donate that blood group."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.05, lon=77.05)
        # Source bank has only 3 units of A+ (min is 5, so status is SHORTAGE, budget is 0)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=3, days_to_expiry=20)

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )

        self.assertEqual(res.total_transfers_recommended, 0)
        self.assertEqual(res.transfers, [])
        self.assertEqual(res.unmet_shortages_count, 1)
        self.assertEqual(res.unmet_shortages[0].remaining_shortfall, 5)

    def test_05_06_exact_preferred_over_substitute_and_versatility(self):
        """Test exact donor blood group is preferred over compatible substitute."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.05, lon=77.05)

        # Dest needs A+ (group 1, min 5).
        # Src has:
        # - 6 units of A+ (exact, budget = 6 - 5 = 1)
        # - 10 units of O- (universal donor, min 8, budget = 10 - 8 = 2)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=6, days_to_expiry=20)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=8, count=10, days_to_expiry=20)

        # We request 2 transfers
        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            max_transfers=2,
            evaluation_date=eval_date,
        )

        self.assertEqual(res.total_transfers_recommended, 2)
        # Unit 1 must be exact match (A+)
        self.assertEqual(res.transfers[0].donor_blood_group, "A+")
        # Unit 2 is substitute (O-) only after exact match budget (1 unit) was exhausted
        self.assertEqual(res.transfers[1].donor_blood_group, "O-")

    def test_14_15_non_available_and_expired_units_excluded(self):
        """Test EXPIRED, RESERVED, or non-AVAILABLE units are excluded from candidates."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.05, lon=77.05)

        # Create expired AVAILABLE unit (expiry_date < today)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=2, days_to_expiry=-2, status="AVAILABLE")
        # Create unexpired RESERVED unit
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=2, days_to_expiry=10, status="RESERVED")
        # Create unexpired EXPIRED-status unit
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=2, days_to_expiry=10, status="EXPIRED")

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )
        # None of the non-available or expired units should be usable
        self.assertEqual(res.total_transfers_recommended, 0)

    def test_16_expiry_arrival_margin_enforced(self):
        """Test candidate unit failing arrival expiry margin is rejected."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        # Place source bank far away: lat=35.0, distance ~2557 km
        # Travel time: 2557 / 40 = ~64 hours -> arrival_date = eval_date + 2 days
        src_bank = self._create_temp_bank("Temp Far Src Bank", lat=35.0, lon=77.0)
        # Unit expires in exactly 1 day (on arrival date it is expired, days_left = -1 < 1 margin)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=7, days_to_expiry=1)

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            expiry_margin_days=1,
            evaluation_date=eval_date,
        )
        self.assertEqual(res.total_transfers_recommended, 0)

    def test_17_expiring_soon_prioritized(self):
        """Test units close to expiry (<= 3 days) are prioritized over longer shelf-life units."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.01, lon=77.01)

        # 6 units expiring in 25 days
        long_units = self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=6, days_to_expiry=25)
        # 1 unit expiring in 2 days (expiring soon)
        expiring_unit = self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=1, days_to_expiry=2)[0]

        # Total 7 units, min is 5, budget is 2. Shortfall is 5.
        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )

        self.assertEqual(res.total_transfers_recommended, 2)
        # First recommended transfer must be the expiring unit!
        self.assertEqual(res.transfers[0].unit_id, expiring_unit.unit_id)
        self.assertEqual(res.transfers[0].reason, RedistributionReason.EXPIRING_SOON.value)
        # Second recommended transfer is a surplus unit
        self.assertEqual(res.transfers[1].reason, RedistributionReason.SURPLUS.value)

    def test_19_20_missing_coordinates_unroutable_no_fake_fallback(self):
        """Test missing coordinates render route unroutable and no fake 15km fallback is used."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        self._populate_non_a_plus_stock(dest_bank.blood_bank_id)
        # Source bank with NULL coordinates
        src_bank = self._create_temp_bank("Temp Null Coords Src", lat=None, lon=None)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=10, days_to_expiry=20)

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )
        self.assertEqual(res.total_transfers_recommended, 0)
        self.assertEqual(res.unmet_shortages_count, 1)


    def test_13_no_unit_id_duplicated(self):
        """Test that no unit_id is ever proposed twice in the same plan."""
        eval_date = date(2026, 10, 6)
        dest_bank = self._create_temp_bank("Temp Dest Bank", lat=12.0, lon=77.0)
        src_bank = self._create_temp_bank("Temp Src Bank", lat=12.01, lon=77.01)
        self._create_temp_units(src_bank.blood_bank_id, blood_group_id=1, count=10, days_to_expiry=20)

        res = self.engine.preview(
            destination_blood_bank_id=dest_bank.blood_bank_id,
            source_blood_bank_id=src_bank.blood_bank_id,
            evaluation_date=eval_date,
        )
        unit_ids = [t.unit_id for t in res.transfers]
        self.assertEqual(len(unit_ids), len(set(unit_ids)))

    def test_27_28_29_30_read_only_guarantee_no_db_mutation(self):
        """Test preview does not insert BloodTransfer or mutate BloodUnit/Allocation."""
        # Baseline counts before running preview
        counts_before = {
            t.__tablename__: self.db.query(func.count()).select_from(t).scalar()
            for t in self.tables
        }

        # Run preview on Bank 1
        res = self.engine.preview(destination_blood_bank_id=1, max_transfers=10)
        self.assertGreaterEqual(res.total_transfers_recommended, 0)

        # Baseline counts after running preview
        counts_after = {
            t.__tablename__: self.db.query(func.count()).select_from(t).scalar()
            for t in self.tables
        }

        # Every table count must match exactly
        self.assertEqual(counts_before, counts_after)


class TestOtherEnginesRegression(unittest.TestCase):
    """Ensure existing engines (Allocation, Expiry, ShortageSurplus) suffer zero regression."""

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_35_allocation_engine_regression(self):
        """Test AllocationEngine still works as expected."""
        alloc_engine = AllocationEngine(self.db)
        # Request 1 in DB
        res = alloc_engine.find_candidates(request_id=1)
        self.assertIsNotNone(res)
        self.assertEqual(res.request_id, 1)

    def test_36_expiry_engine_regression(self):
        """Test ExpiryEngine monitoring works as expected."""
        expiry_engine = ExpiryEngine(self.db)
        res = expiry_engine.find_expiring_units(warning_days=3, critical_days=1)
        self.assertIsNotNone(res)
        self.assertGreaterEqual(res.counts.total_flagged, 0)

    def test_37_shortage_surplus_engine_regression(self):
        """Test ShortageSurplusEngine works as expected."""
        shortage_engine = ShortageSurplusEngine(self.db)
        res = shortage_engine.detect_for_blood_bank(blood_bank_id=1)
        self.assertIsNotNone(res)
        self.assertEqual(res.blood_bank_id, 1)
        self.assertEqual(len(res.stock_by_group), 8)


if __name__ == "__main__":
    unittest.main()
