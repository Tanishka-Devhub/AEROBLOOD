from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import BloodGroup, BloodUnit, Donor
from schemas import (
    BloodGroupResponse,
    BloodUnitCreate,
    BloodUnitResponse,
    DonorCreate,
    DonorResponse,
    DonorUpdate,
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

    blood_unit = BloodUnit(
        **blood_unit_data.model_dump(),
        created_at=datetime.now(),
    )

    db.add(blood_unit)
    db.commit()
    db.refresh(blood_unit)

    return blood_unit