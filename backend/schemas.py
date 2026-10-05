from datetime import date

from pydantic import BaseModel

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