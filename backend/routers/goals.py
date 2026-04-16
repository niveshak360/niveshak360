from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.goal import Goal
from schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContribution,
    GoalSummary,
)

router = APIRouter(
    prefix="/goals",
    tags=["Goals"],
)


@router.post("/", response_model=GoalResponse)
def create_goal(goal_data: GoalCreate, db: Session = Depends(get_db)):
    new_goal = Goal(
        name=goal_data.name,
        icon=goal_data.icon,
        category=goal_data.category,
        target_amount=goal_data.target_amount,
        monthly_contribution=goal_data.monthly_contribution,
        target_date=goal_data.target_date,
        saved_amount=0.0,
        is_completed=False,
        is_active=True,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return GoalResponse.from_orm_with_computed(new_goal)


@router.get("/stats/summary", response_model=GoalSummary)
def get_goals_summary(db: Session = Depends(get_db)):
    all_goals = db.query(Goal).filter(Goal.is_active == True).all()
    total_saved = sum(g.saved_amount for g in all_goals)
    total_target = sum(g.target_amount for g in all_goals)
    completed = [g for g in all_goals if g.is_completed]
    active = [g for g in all_goals if not g.is_completed]
    overall_progress = (
        round((total_saved / total_target) * 100, 1)
        if total_target > 0 else 0
    )
    return GoalSummary(
        total_goals=len(all_goals),
        active_goals=len(active),
        completed_goals=len(completed),
        total_saved=round(total_saved, 2),
        total_target=round(total_target, 2),
        overall_progress_percent=overall_progress,
    )


@router.get("/", response_model=List[GoalResponse])
def get_all_goals(db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.is_active == True).all()
    return [GoalResponse.from_orm_with_computed(g) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return GoalResponse.from_orm_with_computed(goal)


@router.post("/{goal_id}/contribute", response_model=GoalResponse)
def contribute_to_goal(
    goal_id: int,
    contribution: GoalContribution,
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if contribution.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Contribution amount must be greater than zero"
        )
    goal.saved_amount += contribution.amount
    if goal.saved_amount >= goal.target_amount:
        goal.saved_amount = goal.target_amount
        goal.is_completed = True
    db.commit()
    db.refresh(goal)
    return GoalResponse.from_orm_with_computed(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    updates: GoalUpdate,
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return GoalResponse.from_orm_with_computed(goal)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.is_active = False
    db.commit()
    return {"message": f"Goal '{goal.name}' deleted successfully"}