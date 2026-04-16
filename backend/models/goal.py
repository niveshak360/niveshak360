from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Goal(Base):
    # This is the name of the table in the database
    __tablename__ = "goals"

    # ── Columns ───────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # Goal details
    name = Column(String, nullable=False)          # e.g. "New Laptop"
    icon = Column(String, default="🎯")            # e.g. "💻"
    category = Column(String, default="general")   # short-term / medium-term / long-term

    # Money
    target_amount = Column(Float, nullable=False)  # e.g. 60000.0
    saved_amount = Column(Float, default=0.0)      # e.g. 38000.0
    monthly_contribution = Column(Float, default=0.0)

    # Timeline
    target_date = Column(String, nullable=True)    # e.g. "2026-12-01"

    # Status
    is_completed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Automatically set when created / updated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Helper properties ─────────────────────────────────────────
    @property
    def progress_percent(self):
        if self.target_amount == 0:
            return 0
        return round((self.saved_amount / self.target_amount) * 100, 1)

    @property
    def remaining_amount(self):
        return round(self.target_amount - self.saved_amount, 2)