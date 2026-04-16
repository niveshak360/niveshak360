from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """A Niveshak360 user account"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, nullable=True)

    # Password stored as a secure hash — never plain text
    hashed_password = Column(String, nullable=False)

    # Profile
    age_group = Column(String, default="adult")
    # school / college / professional / family

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    kyc_level = Column(Integer, default=0)
    # 0 = none, 1 = basic (PAN), 2 = full (PAN + Aadhaar)

    # FinScore tracking
    finscore = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)