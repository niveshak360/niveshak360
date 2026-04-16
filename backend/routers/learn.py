from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from database import get_db
from models.learn import Track, Lesson, QuizQuestion, UserProgress
from schemas.learn import (
    TrackCreate, TrackResponse, TrackSummaryResponse,
    LessonCreate, LessonResponse,
    QuizQuestionCreate, QuizQuestionResponse,
    QuizSubmission, QuizResult,
    LessonComplete, ProgressResponse,
)

router = APIRouter(
    prefix="/learn",
    tags=["Learn"],
)


# ══════════════════════════════════════════════════════════════════
#  TRACKS
# ══════════════════════════════════════════════════════════════════

@router.post("/tracks", response_model=TrackResponse)
def create_track(track_data: TrackCreate, db: Session = Depends(get_db)):
    """Create a new course track e.g. Money 101"""
    track = Track(
        title=track_data.title,
        description=track_data.description,
        icon=track_data.icon,
        category=track_data.category,
        difficulty=track_data.difficulty,
        total_xp=0,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


@router.get("/tracks", response_model=List[TrackSummaryResponse])
def get_all_tracks(db: Session = Depends(get_db)):
    """Get all course tracks with lesson count"""
    tracks = db.query(Track).filter(Track.is_active == True).all()
    result = []
    for t in tracks:
        result.append(TrackSummaryResponse(
            id=t.id,
            title=t.title,
            icon=t.icon,
            category=t.category,
            difficulty=t.difficulty,
            total_xp=t.total_xp,
            lesson_count=len(t.lessons),
        ))
    return result


@router.get("/tracks/{track_id}", response_model=TrackResponse)
def get_track(track_id: int, db: Session = Depends(get_db)):
    """Get a single track with all its lessons"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


# ══════════════════════════════════════════════════════════════════
#  LESSONS
# ══════════════════════════════════════════════════════════════════

@router.post("/tracks/{track_id}/lessons", response_model=LessonResponse)
def create_lesson(
    track_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db),
):
    """Add a lesson to a track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    lesson = Lesson(
        track_id=track_id,
        title=lesson_data.title,
        content=lesson_data.content,
        order_number=lesson_data.order_number,
        duration_minutes=lesson_data.duration_minutes,
        xp_reward=lesson_data.xp_reward,
    )
    db.add(lesson)

    # Update total XP for the track
    track.total_xp += lesson_data.xp_reward

    db.commit()
    db.refresh(lesson)
    return lesson


@router.get("/tracks/{track_id}/lessons", response_model=List[LessonResponse])
def get_lessons(track_id: int, db: Session = Depends(get_db)):
    """Get all lessons for a track in order"""
    lessons = (
        db.query(Lesson)
        .filter(Lesson.track_id == track_id, Lesson.is_active == True)
        .order_by(Lesson.order_number)
        .all()
    )
    return lessons


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get a single lesson with its quiz questions"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# ══════════════════════════════════════════════════════════════════
#  QUIZ
# ══════════════════════════════════════════════════════════════════

@router.post("/lessons/{lesson_id}/questions", response_model=QuizQuestionResponse)
def add_quiz_question(
    lesson_id: int,
    question_data: QuizQuestionCreate,
    db: Session = Depends(get_db),
):
    """Add a quiz question to a lesson"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    question = QuizQuestion(
        lesson_id=lesson_id,
        question=question_data.question,
        option_a=question_data.option_a,
        option_b=question_data.option_b,
        option_c=question_data.option_c,
        option_d=question_data.option_d,
        correct_option=question_data.correct_option.lower(),
        explanation=question_data.explanation,
        xp_reward=question_data.xp_reward,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/quiz/submit", response_model=QuizResult)
def submit_quiz_answer(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
):
    """
    Submit an answer to a quiz question.
    Returns whether it was correct, the right answer, and XP earned.
    """
    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == submission.question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = submission.selected_option.lower() == question.correct_option
    xp_earned = question.xp_reward if is_correct else 0

    return QuizResult(
        question_id=question.id,
        is_correct=is_correct,
        correct_option=question.correct_option,
        explanation=question.explanation,
        xp_earned=xp_earned,
    )


# ══════════════════════════════════════════════════════════════════
#  PROGRESS TRACKING
# ══════════════════════════════════════════════════════════════════

@router.post("/lessons/{lesson_id}/complete", response_model=dict)
def complete_lesson(
    lesson_id: int,
    body: LessonComplete,
    db: Session = Depends(get_db),
):
    """Mark a lesson as completed and award XP"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check if already completed
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == body.user_id,
        UserProgress.lesson_id == lesson_id,
    ).first()

    if existing and existing.is_completed:
        return {
            "message": "Lesson already completed",
            "xp_earned": 0,
            "total_xp": existing.xp_earned,
        }

    if existing:
        existing.is_completed = True
        existing.xp_earned = lesson.xp_reward
        existing.completed_at = datetime.now(timezone.utc)
    else:
        progress = UserProgress(
            user_id=body.user_id,
            lesson_id=lesson_id,
            track_id=lesson.track_id,
            is_completed=True,
            xp_earned=lesson.xp_reward,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(progress)

    db.commit()
    return {
        "message": f"Lesson '{lesson.title}' completed!",
        "xp_earned": lesson.xp_reward,
        "lesson_title": lesson.title,
    }


@router.get("/progress/{track_id}", response_model=ProgressResponse)
def get_track_progress(
    track_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    """Get a user's progress through a specific track"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    total_lessons = len(track.lessons)
    completed = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.track_id == track_id,
        UserProgress.is_completed == True,
    ).all()

    lessons_completed = len(completed)
    total_xp = sum(p.xp_earned for p in completed)
    progress_percent = (
        round((lessons_completed / total_lessons) * 100, 1)
        if total_lessons > 0 else 0
    )

    return ProgressResponse(
        user_id=user_id,
        track_id=track_id,
        lessons_completed=lessons_completed,
        total_lessons=total_lessons,
        progress_percent=progress_percent,
        total_xp_earned=total_xp,
    )


@router.get("/progress/summary/{user_id}")
def get_learning_summary(user_id: int = 1, db: Session = Depends(get_db)):
    """Get overall learning summary for a user across all tracks"""
    all_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.is_completed == True,
    ).all()

    total_xp = sum(p.xp_earned for p in all_progress)
    lessons_done = len(all_progress)
    tracks_started = len(set(p.track_id for p in all_progress))

    return {
        "user_id": user_id,
        "lessons_completed": lessons_done,
        "tracks_started": tracks_started,
        "total_xp_earned": total_xp,
        "finscore_from_learning": min(lessons_done * 50, 400),
    }