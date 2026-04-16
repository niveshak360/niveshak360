from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Quiz Question schemas ──────────────────────────────────────────
class QuizQuestionCreate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: Optional[str] = None
    correct_option: str = Field(..., example="a")
    explanation: Optional[str] = None
    xp_reward: Optional[int] = 25


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: Optional[str]
    xp_reward: int

    class Config:
        from_attributes = True


# ── Lesson schemas ─────────────────────────────────────────────────
class LessonCreate(BaseModel):
    title: str = Field(..., example="What is compound interest?")
    content: Optional[str] = Field(None, example="Compound interest is...")
    order_number: int = Field(..., example=1)
    duration_minutes: Optional[int] = 5
    xp_reward: Optional[int] = 50


class LessonResponse(BaseModel):
    id: int
    track_id: int
    title: str
    content: Optional[str]
    order_number: int
    duration_minutes: int
    xp_reward: int
    is_active: bool
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True


# ── Track schemas ──────────────────────────────────────────────────
class TrackCreate(BaseModel):
    title: str = Field(..., example="Money 101")
    description: Optional[str] = None
    icon: Optional[str] = "📚"
    category: Optional[str] = "basics"
    difficulty: Optional[str] = "beginner"


class TrackResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    icon: str
    category: str
    difficulty: str
    total_xp: int
    is_active: bool
    lessons: List[LessonResponse] = []
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class TrackSummaryResponse(BaseModel):
    id: int
    title: str
    icon: str
    category: str
    difficulty: str
    total_xp: int
    lesson_count: int

    class Config:
        from_attributes = True


# ── Progress schemas ───────────────────────────────────────────────
class QuizSubmission(BaseModel):
    question_id: int
    selected_option: str = Field(..., example="a")


class QuizResult(BaseModel):
    question_id: int
    is_correct: bool
    correct_option: str
    explanation: Optional[str]
    xp_earned: int


class LessonComplete(BaseModel):
    user_id: Optional[int] = 1


class ProgressResponse(BaseModel):
    user_id: int
    track_id: int
    lessons_completed: int
    total_lessons: int
    progress_percent: float
    total_xp_earned: int

    class Config:
        from_attributes = True