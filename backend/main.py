from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from database import get_db
from models import Donor

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


@app.get("/donors")
def get_donors(
    limit: int = 50,
    offset: int = 0,
    blood_group_id: int | None = None,
    status: str | None = None,
    name: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Donor)

    if blood_group_id is not None:
        query = query.filter(Donor.blood_group_id == blood_group_id)

    if status is not None:
        query = query.filter(Donor.status == status)

    if name is not None:
        query = query.filter(Donor.full_name.ilike(f"%{name}%"))

    return query.offset(offset).limit(limit).all()