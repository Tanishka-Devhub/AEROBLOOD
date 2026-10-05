from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import BloodGroup, Donor
from schemas import BloodGroupResponse, DonorResponse
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
        return {"error": "Donor not found"}

    return donor

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
        return {"error": "Blood group not found"}

    return blood_group