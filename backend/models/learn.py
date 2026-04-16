from sqlalchemy import (
    Column, Integer, String, Float,
    Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Track(Base):
    """A course track — e.g. Money 101, Mutual Funds & SIPs"""
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, default="📚")
    category = Column(String, default="basics")
    difficulty = Column(String, default="beginner")
    total_xp = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # One track has many lessons
    lessons = relationship("Lesson", back_populates="track")


class Lesson(Base):
    """A single lesson inside a track"""
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order_number = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, default=5)
    xp_reward = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Each lesson belongs to one track
    track = relationship("Track", back_populates="lessons")

    # One lesson has many quiz questions
    questions = relationship("QuizQuestion", back_populates="lesson")


class QuizQuestion(Base):
    """A quiz question attached to a lesson"""
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=True)
    correct_option = Column(String, nullable=False)  # "a", "b", "c" or "d"
    explanation = Column(Text, nullable=True)
    xp_reward = Column(Integer, default=25)

    lesson = relationship("Lesson", back_populates="questions")


class UserProgress(Base):
    """Tracks which lessons a user has completed and their XP"""
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    # We will link to real users in Session 5 (Auth)
    # For now we use a simple user_id integer
    user_id = Column(Integer, default=1)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    xp_earned = Column(Integer, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())