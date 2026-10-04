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
    db: Session = Depends(get_db),
):
    return db.query(Donor).offset(offset).limit(limit).all()