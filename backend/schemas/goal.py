from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Used when CREATING a new goal ─────────────────────────────────
# These are the fields the user must / can send
class GoalCreate(BaseModel):
    name: str = Field(..., example="New Laptop")
    icon: Optional[str] = Field("🎯", example="💻")
    category: Optional[str] = Field("short-term", example="short-term")
    target_amount: float = Field(..., example=60000.0)
    monthly_contribution: Optional[float] = Field(0.0, example=2200.0)
    target_date: Optional[str] = Field(None, example="2026-12-01")


# ── Used when UPDATING an existing goal ───────────────────────────
# All fields are optional — you only send what you want to change
class GoalUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
    monthly_contribution: Optional[float] = None
    target_date: Optional[str] = None
    is_completed: Optional[bool] = None
    is_active: Optional[bool] = None


# ── Used when ADDING money to a goal ──────────────────────────────
class GoalContribution(BaseModel):
    amount: float = Field(..., example=2200.0)


# ── Used when RETURNING a goal to the user ────────────────────────
# This is what the API sends back — includes computed fields
class GoalResponse(BaseModel):
    id: int
    name: str
    icon: str
    category: str
    target_amount: float
    saved_amount: float
    monthly_contribution: float
    target_date: Optional[str]
    is_completed: bool
    is_active: bool
    progress_percent: float
    remaining_amount: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

    # Manually compute derived fields since they are @property on the model
    @classmethod
    def from_orm_with_computed(cls, goal):
        return cls(
            id=goal.id,
            name=goal.name,
            icon=goal.icon,
            category=goal.category,
            target_amount=goal.target_amount,
            saved_amount=goal.saved_amount,
            monthly_contribution=goal.monthly_contribution,
            target_date=goal.target_date,
            is_completed=goal.is_completed,
            is_active=goal.is_active,
            progress_percent=goal.progress_percent,
            remaining_amount=goal.remaining_amount,
            created_at=goal.created_at,
        )


# ── Summary stats across all goals ────────────────────────────────
class GoalSummary(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    total_saved: float
    total_target: float
    overall_progress_percent: float