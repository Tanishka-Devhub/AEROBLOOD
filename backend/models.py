from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class Donor(Base):
    __tablename__ = "donor"

    donor_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    blood_group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("bloodgroup.blood_group_id"),
        nullable=False,
    )
    blood_group: Mapped["BloodGroup"] = relationship(
        "BloodGroup",
        back_populates="donors",
    )
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(String(150), unique=True)
    address: Mapped[str | None] = mapped_column(String(255))
    registration_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)


class BloodGroup(Base):
    __tablename__ = "bloodgroup"

    blood_group_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    group_name: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        unique=True,
    )

    donors: Mapped[list["Donor"]] = relationship(
        "Donor",
        back_populates="blood_group",
    )

class Donation(Base):
    __tablename__ = "donation"

    donation_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    donor_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("donor.donor_id"),
        nullable=False,
    )

    blood_bank_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("bloodbank.blood_bank_id"),
        nullable=False,
    )

    blood_group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("bloodgroup.blood_group_id"),
        nullable=False,
    )

    donation_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    eligibility_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    screening_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    donor: Mapped["Donor"] = relationship(
        "Donor",
        foreign_keys=[donor_id],
    )

    blood_group: Mapped["BloodGroup"] = relationship(
        "BloodGroup",
        foreign_keys=[blood_group_id],
    )


class BloodBank(Base):
    __tablename__ = "bloodbank"

    blood_bank_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

class BloodUnit(Base):
    __tablename__ = "bloodunit"

    unit_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    donation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("donation.donation_id"),
        nullable=False,
    )

    blood_bank_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("bloodbank.blood_bank_id"),
        nullable=False,
    )

    collection_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    expiry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
    )


class Hospital(Base):
    __tablename__ = "hospital"

    hospital_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        unique=True,
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )