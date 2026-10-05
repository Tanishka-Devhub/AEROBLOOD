from datetime import date
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