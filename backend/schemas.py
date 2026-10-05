from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, field_validator

class BloodGroupResponse(BaseModel):
    blood_group_id: int
    group_name: str


class DonorResponse(BaseModel):
    donor_id: int
    full_name: str
    date_of_birth: date
    gender: str
    blood_group_id: int
    phone: str
    email: str | None = None
    address: str | None = None
    registration_date: date
    status: str
    blood_group: BloodGroupResponse

class DonorCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    blood_group_id: int
    phone: str
    email: str | None = None
    address: str | None = None
    registration_date: date
    status: str

class DonorUpdate(BaseModel):
    full_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    blood_group_id: int | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    registration_date: date | None = None
    status: str | None = None

class BloodUnitStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    ALLOCATED = "ALLOCATED"
    USED = "USED"
    EXPIRED = "EXPIRED"
    DISCARDED = "DISCARDED"

class BloodUnitResponse(BaseModel):
    unit_id: int
    donation_id: int
    blood_bank_id: int
    collection_date: date
    expiry_date: date
    status: BloodUnitStatus

class BloodUnitCreate(BaseModel):
    donation_id: int
    blood_bank_id: int
    collection_date: date
    expiry_date: date
    status: BloodUnitStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | BloodUnitStatus) -> str | BloodUnitStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v

class BloodUnitStatusUpdate(BaseModel):
    status: BloodUnitStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | BloodUnitStatus) -> str | BloodUnitStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class DonationEligibilityStatus(StrEnum):
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"


class DonationScreeningStatus(StrEnum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"


class DonationResponse(BaseModel):
    donation_id: int
    donor_id: int
    blood_bank_id: int
    blood_group_id: int
    donation_date: date
    eligibility_status: DonationEligibilityStatus
    screening_status: DonationScreeningStatus
    remarks: str | None = None


class DonationCreate(BaseModel):
    donor_id: int
    blood_bank_id: int
    blood_group_id: int
    donation_date: date
    eligibility_status: DonationEligibilityStatus = DonationEligibilityStatus.ELIGIBLE
    screening_status: DonationScreeningStatus = DonationScreeningStatus.PENDING
    remarks: str | None = None

    @field_validator("eligibility_status", mode="before")
    @classmethod
    def normalize_eligibility_status(cls, v: str | DonationEligibilityStatus) -> str | DonationEligibilityStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("screening_status", mode="before")
    @classmethod
    def normalize_screening_status(cls, v: str | DonationScreeningStatus) -> str | DonationScreeningStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class DonationUpdate(BaseModel):
    donor_id: int | None = None
    blood_bank_id: int | None = None
    blood_group_id: int | None = None
    donation_date: date | None = None
    eligibility_status: DonationEligibilityStatus | None = None
    screening_status: DonationScreeningStatus | None = None
    remarks: str | None = None

    @field_validator("eligibility_status", mode="before")
    @classmethod
    def normalize_eligibility_status(cls, v: str | DonationEligibilityStatus | None) -> str | DonationEligibilityStatus | None:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("screening_status", mode="before")
    @classmethod
    def normalize_screening_status(cls, v: str | DonationScreeningStatus | None) -> str | DonationScreeningStatus | None:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class BloodBankStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class BloodBankResponse(BaseModel):
    blood_bank_id: int
    name: str
    address: str
    city: str
    phone: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: BloodBankStatus


class BloodBankCreate(BaseModel):
    name: str
    address: str
    city: str
    phone: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: BloodBankStatus = BloodBankStatus.ACTIVE

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | BloodBankStatus) -> str | BloodBankStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class HospitalStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class HospitalResponse(BaseModel):
    hospital_id: int
    name: str
    address: str
    city: str
    phone: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: HospitalStatus


class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str
    phone: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: HospitalStatus = HospitalStatus.ACTIVE

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | HospitalStatus) -> str | HospitalStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class StaffRole(StrEnum):
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    COORDINATOR = "COORDINATOR"
    LAB_STAFF = "LAB_STAFF"
    BLOOD_BANK_STAFF = "BLOOD_BANK_STAFF"
    ADMIN = "ADMIN"


class StaffStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class HospitalStaffResponse(BaseModel):
    staff_id: int
    hospital_id: int
    full_name: str
    role: StaffRole
    license_or_employee_id: str
    phone: str
    email: str | None = None
    status: StaffStatus


class HospitalStaffCreate(BaseModel):
    hospital_id: int
    full_name: str
    role: StaffRole
    license_or_employee_id: str
    phone: str
    email: str | None = None
    status: StaffStatus = StaffStatus.ACTIVE

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v: str | StaffRole) -> str | StaffRole:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | StaffStatus) -> str | StaffStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class DoctorApprovalStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class BloodRequestPriority(StrEnum):
    NORMAL = "NORMAL"
    URGENT = "URGENT"
    EMERGENCY = "EMERGENCY"


class BloodRequestStatus(StrEnum):
    PENDING = "PENDING"
    PARTIALLY_ALLOCATED = "PARTIALLY_ALLOCATED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class BloodRequestResponse(BaseModel):
    request_id: int
    hospital_id: int
    patient_reference: str
    blood_group_id: int
    quantity_required: int
    requested_by_staff_id: int
    attending_doctor_id: int
    doctor_approval_status: DoctorApprovalStatus
    doctor_approved_at: datetime | None = None
    request_date: datetime
    required_by: datetime
    priority: BloodRequestPriority
    status: BloodRequestStatus


class BloodRequestCreate(BaseModel):
    hospital_id: int
    patient_reference: str
    blood_group_id: int
    quantity_required: int
    requested_by_staff_id: int
    attending_doctor_id: int
    doctor_approval_status: DoctorApprovalStatus = DoctorApprovalStatus.PENDING
    doctor_approved_at: datetime | None = None
    required_by: datetime
    priority: BloodRequestPriority = BloodRequestPriority.NORMAL
    status: BloodRequestStatus = BloodRequestStatus.PENDING

    @field_validator("quantity_required")
    @classmethod
    def validate_quantity_required(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity_required must be greater than 0")
        return v

    @field_validator("patient_reference")
    @classmethod
    def validate_patient_reference(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("patient_reference must not be blank")
        return v.strip()

    @field_validator("doctor_approval_status", mode="before")
    @classmethod
    def normalize_doctor_approval_status(
        cls, v: str | DoctorApprovalStatus
    ) -> str | DoctorApprovalStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(
        cls, v: str | BloodRequestPriority
    ) -> str | BloodRequestPriority:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(
        cls, v: str | BloodRequestStatus
    ) -> str | BloodRequestStatus:
        if isinstance(v, str):
            return v.strip().upper()
        return v
