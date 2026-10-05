from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    Allocation,
    BloodBank,
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
    AllocationCreate,
    AllocationResponse,
    BloodBankCreate,
    BloodBankResponse,
    BloodGroupResponse,
    BloodRequestCreate,
    BloodRequestResponse,
    BloodTransferCreate,
    BloodTransferResponse,
    BloodUnitCreate,
    BloodUnitResponse,
    BloodUnitStatusUpdate,
    DonationCreate,
    DonationResponse,
    DonationUpdate,
    DonorCreate,
    DonorResponse,
    DonorUpdate,
    HospitalCreate,
    HospitalResponse,
    HospitalStaffCreate,
    HospitalStaffResponse,
)

app = FastAPI(title="AERO-BLOOD API")


@app.get("/")
def root():
    return {
        "message": "AERO-BLOOD API is running"
    }


@app.get("/db-test")
def database_test():
    db = next(get_db())
    try:
        result = db.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {
            "database": "connected",
            "result": result.scalar(),
        }
    finally:
        db.close()

@app.get("/donors", response_model=list[DonorResponse])
def get_donors(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    blood_group_id: int | None = None,
    status: str | None = None,
    name: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Donor).options(joinedload(Donor.blood_group))

    if blood_group_id is not None:
        query = query.filter(Donor.blood_group_id == blood_group_id)

    if status is not None:
        query = query.filter(Donor.status == status)

    if name is not None:
        query = query.filter(Donor.full_name.ilike(f"%{name}%"))

    return query.offset(offset).limit(limit).all()

@app.get("/donors/{donor_id}", response_model=DonorResponse)
def get_donor(donor_id: int, db: Session = Depends(get_db)):
    donor = (
        db.query(Donor)
        .options(joinedload(Donor.blood_group))
        .filter(Donor.donor_id == donor_id)
        .first()
    )

    if donor is None:
        raise HTTPException(status_code=404, detail="Donor not found")

    return donor

@app.post("/donors", response_model=DonorResponse, status_code=201)
def create_donor(
    donor_data: DonorCreate,
    db: Session = Depends(get_db),
):
    blood_group = (
        db.query(BloodGroup)
        .filter(BloodGroup.blood_group_id == donor_data.blood_group_id)
        .first()
    )

    if blood_group is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid blood group ID",
        )

    existing_phone = (
        db.query(Donor)
        .filter(Donor.phone == donor_data.phone)
        .first()
    )

    if existing_phone is not None:
        raise HTTPException(
            status_code=409,
            detail="Phone number already exists",
        )

    if donor_data.email is not None:
        existing_email = (
            db.query(Donor)
            .filter(Donor.email == donor_data.email)
            .first()
        )

        if existing_email is not None:
            raise HTTPException(
                status_code=409,
                detail="Email already exists",
            )

    donor = Donor(**donor_data.model_dump())

    db.add(donor)
    db.commit()
    db.refresh(donor)

    donor = (
        db.query(Donor)
        .options(joinedload(Donor.blood_group))
        .filter(Donor.donor_id == donor.donor_id)
        .first()
    )

    return donor

@app.put("/donors/{donor_id}", response_model=DonorResponse)
def update_donor(
    donor_id: int,
    donor_data: DonorUpdate,
    db: Session = Depends(get_db),
):
    donor = (
        db.query(Donor)
        .filter(Donor.donor_id == donor_id)
        .first()
    )

    if donor is None:
        raise HTTPException(
            status_code=404,
            detail="Donor not found",
        )

    if donor_data.blood_group_id is not None:
        blood_group = (
            db.query(BloodGroup)
            .filter(BloodGroup.blood_group_id == donor_data.blood_group_id)
            .first()
        )

        if blood_group is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid blood group ID",
            )

    if donor_data.phone is not None and donor_data.phone != donor.phone:
        existing_phone = (
            db.query(Donor)
            .filter(
                Donor.phone == donor_data.phone,
                Donor.donor_id != donor_id,
            )
            .first()
        )

        if existing_phone is not None:
            raise HTTPException(
                status_code=409,
                detail="Phone number already exists",
            )

    if donor_data.email is not None and donor_data.email != donor.email:
        existing_email = (
            db.query(Donor)
            .filter(
                Donor.email == donor_data.email,
                Donor.donor_id != donor_id,
            )
            .first()
        )

        if existing_email is not None:
            raise HTTPException(
                status_code=409,
                detail="Email already exists",
            )

    update_data = donor_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(donor, field, value)

    db.commit()
    db.refresh(donor)

    donor = (
        db.query(Donor)
        .options(joinedload(Donor.blood_group))
        .filter(Donor.donor_id == donor_id)
        .first()
    )

    return donor

@app.delete("/donors/{donor_id}")
def delete_donor(
    donor_id: int,
    db: Session = Depends(get_db),
):
    donor = (
        db.query(Donor)
        .filter(Donor.donor_id == donor_id)
        .first()
    )

    if donor is None:
        raise HTTPException(status_code=404, detail="Donor not found")

    db.delete(donor)
    db.commit()

    return {
        "message": "Donor deleted successfully",
        "donor_id": donor_id,
    }

@app.get("/blood-groups", response_model=list[BloodGroupResponse])
def get_blood_groups(db: Session = Depends(get_db)):
    return db.query(BloodGroup).order_by(BloodGroup.blood_group_id).all()

@app.get("/blood-groups/{blood_group_id}", response_model=BloodGroupResponse)
def get_blood_group(blood_group_id: int, db: Session = Depends(get_db)):
    blood_group = (
        db.query(BloodGroup)
        .filter(BloodGroup.blood_group_id == blood_group_id)
        .first()
    )

    if blood_group is None:
        raise HTTPException(status_code=404, detail="Blood group not found")

    return blood_group

@app.get("/blood-groups/name/{group_name}")
def get_blood_group_by_name(group_name: str, db: Session = Depends(get_db)):
    blood_group = (
        db.query(BloodGroup)
        .filter(BloodGroup.group_name.ilike(group_name))
        .first()
    )

    if blood_group is None:
        raise HTTPException(status_code=404, detail="Blood group not found")

    return blood_group

@app.get("/blood-units", response_model=list[BloodUnitResponse])
def get_blood_units(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str | None = None,
    blood_bank_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(BloodUnit)

    if status is not None:
        query = query.filter(BloodUnit.status == status)

    if blood_bank_id is not None:
        query = query.filter(BloodUnit.blood_bank_id == blood_bank_id)

    return (
        query
        .order_by(BloodUnit.unit_id)
        .offset(offset)
        .limit(limit)
        .all()
    )

@app.get("/blood-units/{unit_id}", response_model=BloodUnitResponse)
def get_blood_unit(
    unit_id: int,
    db: Session = Depends(get_db),
):
    blood_unit = (
        db.query(BloodUnit)
        .filter(BloodUnit.unit_id == unit_id)
        .first()
    )

    if blood_unit is None:
        raise HTTPException(
            status_code=404,
            detail="Blood unit not found",
        )

    return blood_unit

@app.post("/blood-units", response_model=BloodUnitResponse, status_code=201)
def create_blood_unit(
    blood_unit_data: BloodUnitCreate,
    db: Session = Depends(get_db),
):
    donation_exists = (
        db.execute(
            __import__("sqlalchemy").text(
                "SELECT 1 FROM donation WHERE donation_id = :donation_id"
            ),
            {"donation_id": blood_unit_data.donation_id},
        ).scalar()
        is not None
    )

    if not donation_exists:
        raise HTTPException(
            status_code=400,
            detail="Invalid donation ID",
        )

    blood_bank_exists = (
        db.execute(
            __import__("sqlalchemy").text(
                "SELECT 1 FROM bloodbank WHERE blood_bank_id = :blood_bank_id"
            ),
            {"blood_bank_id": blood_unit_data.blood_bank_id},
        ).scalar()
        is not None
    )

    if not blood_bank_exists:
        raise HTTPException(
            status_code=400,
            detail="Invalid blood bank ID",
        )

    if blood_unit_data.expiry_date < blood_unit_data.collection_date:
        raise HTTPException(
            status_code=400,
            detail="Expiry date cannot be before collection date",
        )

    unit_data = blood_unit_data.model_dump()
    unit_data["status"] = blood_unit_data.status.value

    blood_unit = BloodUnit(
        **unit_data,
        created_at=datetime.now(),
    )

    db.add(blood_unit)
    db.commit()
    db.refresh(blood_unit)

    return blood_unit

@app.patch("/blood-units/{unit_id}/status", response_model=BloodUnitResponse)
def update_blood_unit_status(
    unit_id: int,
    status_data: BloodUnitStatusUpdate,
    db: Session = Depends(get_db),
):
    blood_unit = (
        db.query(BloodUnit)
        .filter(BloodUnit.unit_id == unit_id)
        .first()
    )

    if blood_unit is None:
        raise HTTPException(
            status_code=404,
            detail="Blood unit not found",
        )

    blood_unit.status = status_data.status.value

    db.commit()
    db.refresh(blood_unit)

    return blood_unit


@app.get("/donations", response_model=list[DonationResponse])
def get_donations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    donor_id: int | None = None,
    blood_bank_id: int | None = None,
    blood_group_id: int | None = None,
    eligibility_status: str | None = None,
    screening_status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Donation)

    if donor_id is not None:
        query = query.filter(Donation.donor_id == donor_id)

    if blood_bank_id is not None:
        query = query.filter(Donation.blood_bank_id == blood_bank_id)

    if blood_group_id is not None:
        query = query.filter(Donation.blood_group_id == blood_group_id)

    if eligibility_status is not None:
        query = query.filter(
            Donation.eligibility_status == eligibility_status.strip().upper()
        )

    if screening_status is not None:
        query = query.filter(
            Donation.screening_status == screening_status.strip().upper()
        )

    return (
        query
        .order_by(Donation.donation_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/donations/{donation_id}", response_model=DonationResponse)
def get_donation(
    donation_id: int,
    db: Session = Depends(get_db),
):
    donation = (
        db.query(Donation)
        .filter(Donation.donation_id == donation_id)
        .first()
    )

    if donation is None:
        raise HTTPException(
            status_code=404,
            detail="Donation not found",
        )

    return donation


@app.post("/donations", response_model=DonationResponse, status_code=201)
def create_donation(
    donation_data: DonationCreate,
    db: Session = Depends(get_db),
):
    donor = (
        db.query(Donor)
        .filter(Donor.donor_id == donation_data.donor_id)
        .first()
    )
    if donor is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid donor ID",
        )

    blood_bank_exists = (
        db.query(BloodBank)
        .filter(BloodBank.blood_bank_id == donation_data.blood_bank_id)
        .first()
        is not None
    )
    if not blood_bank_exists:
        raise HTTPException(
            status_code=400,
            detail="Invalid blood bank ID",
        )

    blood_group = (
        db.query(BloodGroup)
        .filter(BloodGroup.blood_group_id == donation_data.blood_group_id)
        .first()
    )
    if blood_group is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid blood group ID",
        )

    donation_dict = donation_data.model_dump()
    donation_dict["eligibility_status"] = donation_data.eligibility_status.value
    donation_dict["screening_status"] = donation_data.screening_status.value

    donation = Donation(**donation_dict)

    db.add(donation)
    db.commit()
    db.refresh(donation)

    return donation


@app.get("/blood-banks", response_model=list[BloodBankResponse])
def get_blood_banks(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    city: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(BloodBank)

    if city is not None:
        query = query.filter(BloodBank.city.ilike(f"%{city}%"))

    if status is not None:
        query = query.filter(
            BloodBank.status == status.strip().upper()
        )

    return (
        query
        .order_by(BloodBank.blood_bank_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/blood-banks/{blood_bank_id}", response_model=BloodBankResponse)
def get_blood_bank(
    blood_bank_id: int,
    db: Session = Depends(get_db),
):
    blood_bank = (
        db.query(BloodBank)
        .filter(BloodBank.blood_bank_id == blood_bank_id)
        .first()
    )

    if blood_bank is None:
        raise HTTPException(
            status_code=404,
            detail="Blood bank not found",
        )

    return blood_bank


@app.post("/blood-banks", response_model=BloodBankResponse, status_code=201)
def create_blood_bank(
    blood_bank_data: BloodBankCreate,
    db: Session = Depends(get_db),
):
    bank_dict = blood_bank_data.model_dump()
    bank_dict["status"] = blood_bank_data.status.value

    blood_bank = BloodBank(**bank_dict)

    db.add(blood_bank)
    db.commit()
    db.refresh(blood_bank)

    return blood_bank


@app.get("/hospitals", response_model=list[HospitalResponse])
def get_hospitals(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    city: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Hospital)

    if city is not None:
        query = query.filter(Hospital.city.ilike(f"%{city}%"))

    if status is not None:
        query = query.filter(
            Hospital.status == status.strip().upper()
        )

    return (
        query
        .order_by(Hospital.hospital_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/hospitals/{hospital_id}", response_model=HospitalResponse)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
):
    hospital = (
        db.query(Hospital)
        .filter(Hospital.hospital_id == hospital_id)
        .first()
    )

    if hospital is None:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found",
        )

    return hospital


@app.post("/hospitals", response_model=HospitalResponse, status_code=201)
def create_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
):
    if hospital_data.phone is not None:
        existing_phone = (
            db.query(Hospital)
            .filter(Hospital.phone == hospital_data.phone)
            .first()
        )
        if existing_phone is not None:
            raise HTTPException(
                status_code=409,
                detail="Hospital with this phone already exists",
            )

    hospital_dict = hospital_data.model_dump()
    hospital_dict["status"] = hospital_data.status.value

    hospital = Hospital(**hospital_dict)

    db.add(hospital)
    db.commit()
    db.refresh(hospital)

    return hospital


@app.get("/hospital-staff", response_model=list[HospitalStaffResponse])
def get_hospital_staff(
    hospital_id: int | None = None,
    role: str | None = None,
    status: str | None = None,
    name: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(HospitalStaff)

    if hospital_id is not None:
        query = query.filter(HospitalStaff.hospital_id == hospital_id)

    if role is not None:
        query = query.filter(
            HospitalStaff.role == role.strip().upper()
        )

    if status is not None:
        query = query.filter(
            HospitalStaff.status == status.strip().upper()
        )

    if name is not None:
        query = query.filter(HospitalStaff.full_name.ilike(f"%{name}%"))

    return (
        query
        .order_by(HospitalStaff.staff_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/hospital-staff/{staff_id}", response_model=HospitalStaffResponse)
def get_single_hospital_staff(
    staff_id: int,
    db: Session = Depends(get_db),
):
    staff = (
        db.query(HospitalStaff)
        .filter(HospitalStaff.staff_id == staff_id)
        .first()
    )

    if staff is None:
        raise HTTPException(
            status_code=404,
            detail="Hospital staff not found",
        )

    return staff


@app.post("/hospital-staff", response_model=HospitalStaffResponse, status_code=201)
def create_hospital_staff(
    staff_data: HospitalStaffCreate,
    db: Session = Depends(get_db),
):
    hospital = (
        db.query(Hospital)
        .filter(Hospital.hospital_id == staff_data.hospital_id)
        .first()
    )
    if hospital is None:
        raise HTTPException(
            status_code=400,
            detail="Hospital not found",
        )

    existing_license = (
        db.query(HospitalStaff)
        .filter(HospitalStaff.license_or_employee_id == staff_data.license_or_employee_id)
        .first()
    )
    if existing_license is not None:
        raise HTTPException(
            status_code=409,
            detail="Hospital staff with this license or employee ID already exists",
        )

    if staff_data.email is not None:
        existing_email = (
            db.query(HospitalStaff)
            .filter(HospitalStaff.email == staff_data.email)
            .first()
        )
        if existing_email is not None:
            raise HTTPException(
                status_code=409,
                detail="Hospital staff with this email already exists",
            )

    staff_dict = staff_data.model_dump()
    staff_dict["role"] = staff_data.role.value
    staff_dict["status"] = staff_data.status.value

    staff = HospitalStaff(**staff_dict)

    db.add(staff)
    db.commit()
    db.refresh(staff)

    return staff


@app.get("/blood-requests", response_model=list[BloodRequestResponse])
def get_blood_requests(
    hospital_id: int | None = None,
    blood_group_id: int | None = None,
    requested_by_staff_id: int | None = None,
    attending_doctor_id: int | None = None,
    doctor_approval_status: str | None = None,
    priority: str | None = None,
    status: str | None = None,
    patient_reference: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(BloodRequest)

    if hospital_id is not None:
        query = query.filter(BloodRequest.hospital_id == hospital_id)

    if blood_group_id is not None:
        query = query.filter(BloodRequest.blood_group_id == blood_group_id)

    if requested_by_staff_id is not None:
        query = query.filter(
            BloodRequest.requested_by_staff_id == requested_by_staff_id
        )

    if attending_doctor_id is not None:
        query = query.filter(
            BloodRequest.attending_doctor_id == attending_doctor_id
        )

    if doctor_approval_status is not None:
        query = query.filter(
            BloodRequest.doctor_approval_status
            == doctor_approval_status.strip().upper()
        )

    if priority is not None:
        query = query.filter(
            BloodRequest.priority == priority.strip().upper()
        )

    if status is not None:
        query = query.filter(
            BloodRequest.status == status.strip().upper()
        )

    if patient_reference is not None:
        query = query.filter(
            BloodRequest.patient_reference.ilike(f"%{patient_reference}%")
        )

    return (
        query
        .order_by(BloodRequest.request_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/blood-requests/{request_id}", response_model=BloodRequestResponse)
def get_blood_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    blood_request = (
        db.query(BloodRequest)
        .filter(BloodRequest.request_id == request_id)
        .first()
    )

    if blood_request is None:
        raise HTTPException(
            status_code=404,
            detail="Blood request not found",
        )

    return blood_request


@app.post("/blood-requests", response_model=BloodRequestResponse, status_code=201)
def create_blood_request(
    request_data: BloodRequestCreate,
    db: Session = Depends(get_db),
):
    hospital = (
        db.query(Hospital)
        .filter(Hospital.hospital_id == request_data.hospital_id)
        .first()
    )
    if hospital is None:
        raise HTTPException(
            status_code=400,
            detail="Hospital not found",
        )

    blood_group = (
        db.query(BloodGroup)
        .filter(BloodGroup.blood_group_id == request_data.blood_group_id)
        .first()
    )
    if blood_group is None:
        raise HTTPException(
            status_code=400,
            detail="Blood group not found",
        )

    requested_by_staff = (
        db.query(HospitalStaff)
        .filter(HospitalStaff.staff_id == request_data.requested_by_staff_id)
        .first()
    )
    if requested_by_staff is None:
        raise HTTPException(
            status_code=400,
            detail="Requesting hospital staff not found",
        )

    attending_doctor = (
        db.query(HospitalStaff)
        .filter(HospitalStaff.staff_id == request_data.attending_doctor_id)
        .first()
    )
    if attending_doctor is None:
        raise HTTPException(
            status_code=400,
            detail="Attending doctor not found",
        )

    request_dict = request_data.model_dump()
    request_dict["doctor_approval_status"] = request_data.doctor_approval_status.value
    request_dict["priority"] = request_data.priority.value
    request_dict["status"] = request_data.status.value

    blood_request = BloodRequest(**request_dict)

    db.add(blood_request)
    db.commit()
    db.refresh(blood_request)

    return blood_request


@app.get("/allocations", response_model=list[AllocationResponse])
def get_allocations(
    request_id: int | None = None,
    unit_id: int | None = None,
    source_blood_bank_id: int | None = None,
    allocated_by_staff_id: int | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Allocation)

    if request_id is not None:
        query = query.filter(Allocation.request_id == request_id)

    if unit_id is not None:
        query = query.filter(Allocation.unit_id == unit_id)

    if source_blood_bank_id is not None:
        query = query.filter(
            Allocation.source_blood_bank_id == source_blood_bank_id
        )

    if allocated_by_staff_id is not None:
        query = query.filter(
            Allocation.allocated_by_staff_id == allocated_by_staff_id
        )

    if status is not None:
        query = query.filter(
            Allocation.status == status.strip().upper()
        )

    return (
        query
        .order_by(Allocation.allocation_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/allocations/{allocation_id}", response_model=AllocationResponse)
def get_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
):
    allocation = (
        db.query(Allocation)
        .filter(Allocation.allocation_id == allocation_id)
        .first()
    )

    if allocation is None:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found",
        )

    return allocation


@app.post("/allocations", response_model=AllocationResponse, status_code=201)
def create_allocation(
    allocation_data: AllocationCreate,
    db: Session = Depends(get_db),
):
    blood_request = (
        db.query(BloodRequest)
        .filter(BloodRequest.request_id == allocation_data.request_id)
        .first()
    )
    if blood_request is None:
        raise HTTPException(
            status_code=400,
            detail="Blood request not found",
        )

    blood_unit = (
        db.query(BloodUnit)
        .filter(BloodUnit.unit_id == allocation_data.unit_id)
        .first()
    )
    if blood_unit is None:
        raise HTTPException(
            status_code=400,
            detail="Blood unit not found",
        )

    blood_bank = (
        db.query(BloodBank)
        .filter(BloodBank.blood_bank_id == allocation_data.source_blood_bank_id)
        .first()
    )
    if blood_bank is None:
        raise HTTPException(
            status_code=400,
            detail="Blood bank not found",
        )

    staff = (
        db.query(HospitalStaff)
        .filter(HospitalStaff.staff_id == allocation_data.allocated_by_staff_id)
        .first()
    )
    if staff is None:
        raise HTTPException(
            status_code=400,
            detail="Hospital staff not found",
        )

    allocation_dict = allocation_data.model_dump()
    allocation_dict["status"] = allocation_data.status.value

    allocation = Allocation(**allocation_dict)

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return allocation


@app.get("/blood-transfers", response_model=list[BloodTransferResponse])
def get_blood_transfers(
    unit_id: int | None = None,
    source_blood_bank_id: int | None = None,
    destination_blood_bank_id: int | None = None,
    approved_by_staff_id: int | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(BloodTransfer)

    if unit_id is not None:
        query = query.filter(BloodTransfer.unit_id == unit_id)

    if source_blood_bank_id is not None:
        query = query.filter(
            BloodTransfer.source_blood_bank_id == source_blood_bank_id
        )

    if destination_blood_bank_id is not None:
        query = query.filter(
            BloodTransfer.destination_blood_bank_id == destination_blood_bank_id
        )

    if approved_by_staff_id is not None:
        query = query.filter(
            BloodTransfer.approved_by_staff_id == approved_by_staff_id
        )

    if status is not None:
        query = query.filter(
            BloodTransfer.status == status.strip().upper()
        )

    return (
        query
        .order_by(BloodTransfer.transfer_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/blood-transfers/{transfer_id}", response_model=BloodTransferResponse)
def get_blood_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
):
    transfer = (
        db.query(BloodTransfer)
        .filter(BloodTransfer.transfer_id == transfer_id)
        .first()
    )

    if transfer is None:
        raise HTTPException(
            status_code=404,
            detail="Blood transfer not found",
        )

    return transfer


@app.post("/blood-transfers", response_model=BloodTransferResponse, status_code=201)
def create_blood_transfer(
    transfer_data: BloodTransferCreate,
    db: Session = Depends(get_db),
):
    blood_unit = (
        db.query(BloodUnit)
        .filter(BloodUnit.unit_id == transfer_data.unit_id)
        .first()
    )
    if blood_unit is None:
        raise HTTPException(
            status_code=400,
            detail="Blood unit not found",
        )

    source_bank = (
        db.query(BloodBank)
        .filter(BloodBank.blood_bank_id == transfer_data.source_blood_bank_id)
        .first()
    )
    if source_bank is None:
        raise HTTPException(
            status_code=400,
            detail="Source blood bank not found",
        )

    dest_bank = (
        db.query(BloodBank)
        .filter(BloodBank.blood_bank_id == transfer_data.destination_blood_bank_id)
        .first()
    )
    if dest_bank is None:
        raise HTTPException(
            status_code=400,
            detail="Destination blood bank not found",
        )

    if transfer_data.approved_by_staff_id is not None:
        staff = (
            db.query(HospitalStaff)
            .filter(HospitalStaff.staff_id == transfer_data.approved_by_staff_id)
            .first()
        )
        if staff is None:
            raise HTTPException(
                status_code=400,
                detail="Hospital staff not found",
            )

    transfer_dict = transfer_data.model_dump()
    transfer_dict["status"] = transfer_data.status.value

    transfer = BloodTransfer(**transfer_dict)

    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    return transfer
