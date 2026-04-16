from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ── Signup ─────────────────────────────────────────────────────────
class UserSignup(BaseModel):
    full_name: str = Field(..., example="Aryan Sharma")
    email: EmailStr = Field(..., example="aryan@example.com")
    phone: Optional[str] = Field(None, example="9876543210")
    password: str = Field(..., min_length=6, example="mypassword123")
    age_group: Optional[str] = Field("adult", example="college")


# ── Login ──────────────────────────────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="aryan@example.com")
    password: str = Field(..., example="mypassword123")


# ── Update profile ─────────────────────────────────────────────────
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    age_group: Optional[str] = None


# ── What we send back — never include password ─────────────────────
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    age_group: str
    is_verified: bool
    kyc_level: int
    finscore: int
    streak_days: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Token response after login ─────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse