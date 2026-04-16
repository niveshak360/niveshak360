# Import all models so SQLAlchemy creates all tables on startup
from models.goal import Goal
from models.learn import Track, Lesson, QuizQuestion, UserProgress
from models.invest import Fund, SIP, VirtualPortfolioHolding, VirtualTransaction