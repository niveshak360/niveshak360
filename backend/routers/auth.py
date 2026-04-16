from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import get_db
from models.user import User
from schemas.user import UserSignup, UserLogin, UserUpdate, UserResponse, TokenResponse
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ── SIGNUP ─────────────────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    Create a new Niveshak360 account.
    Returns a token immediately — user is logged in right away.
    """
    # Check email is not already registered
    existing_email = db.query(User).filter(
        User.email == user_data.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists"
        )

    # Check phone is not already registered
    if user_data.phone:
        existing_phone = db.query(User).filter(
            User.phone == user_data.phone
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="An account with this phone number already exists"
            )

    # Hash the password before saving
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hash_password(user_data.password),
        age_group=user_data.age_group,
        finscore=0,
        streak_days=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create JWT token
    token = create_access_token({"user_id": new_user.id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


# ── LOGIN ──────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Log in with email and password.
    Returns a JWT token to use for all future requests.
    """
    user = db.query(User).filter(
        User.email == credentials.email
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Update last login time
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"user_id": user.id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ── GET MY PROFILE ─────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get the currently logged in user's profile.
    Requires a valid JWT token — protected endpoint.
    """
    return current_user


# ── UPDATE PROFILE ─────────────────────────────────────────────────
@router.patch("/me", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update your profile details"""
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# ── UPDATE FINSCORE ────────────────────────────────────────────────
@router.patch("/me/finscore")
def update_finscore(
    points: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add XP points to a user's FinScore"""
    current_user.finscore = min(current_user.finscore + points, 1000)
    db.commit()
    return {
        "message": f"+{points} XP added",
        "new_finscore": current_user.finscore,
    }


# ── UPDATE STREAK ──────────────────────────────────────────────────
@router.patch("/me/streak")
def update_streak(
    days: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a user's login streak"""
    current_user.streak_days = days
    db.commit()
    return {
        "message": "Streak updated",
        "streak_days": current_user.streak_days,
    }


# ── ALL USERS (admin/testing only) ────────────────────────────────
@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Get all registered users — for testing only"""
    return db.query(User).filter(User.is_active == True).all()