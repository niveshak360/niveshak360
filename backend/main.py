from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import Base, engine
from models.goal import Goal
from routers import goals as goals_router
from routers import learn as learn_router
from routers import invest as invest_router
from routers import auth as auth_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=os.getenv("APP_NAME", "Niveshak360"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="Niveshak360 — Your financial journey starts here.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://niveshak360.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(goals_router.router)
app.include_router(learn_router.router)
app.include_router(invest_router.router)
app.include_router(auth_router.router)

@app.get("/")
def root():
    return {
        "app": os.getenv("APP_NAME"),
        "version": os.getenv("APP_VERSION"),
        "status": "running",
        "message": "Welcome to Niveshak360 API 🚀",
        "modules": ["auth", "goals", "learn", "invest"],
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/sip-calculator")
def sip_calculator(monthly_amount: float, years: int, annual_return_percent: float):
    r = annual_return_percent / 100 / 12
    n = years * 12
    if r == 0:
        maturity_value = monthly_amount * n
    else:
        maturity_value = monthly_amount * (((1 + r) ** n - 1) / r) * (1 + r)
    total_invested = monthly_amount * n
    total_returns = maturity_value - total_invested
    wealth_gain_percent = (total_returns / total_invested) * 100
    return {
        "monthly_amount": round(monthly_amount, 2),
        "years": years,
        "annual_return_percent": annual_return_percent,
        "total_invested": round(total_invested, 2),
        "maturity_value": round(maturity_value, 2),
        "total_returns": round(total_returns, 2),
        "wealth_gain_percent": round(wealth_gain_percent, 2),
    }

@app.get("/finscore")
def finscore_calculator(lessons_completed: int=0, goals_set: int=0, sip_started: bool=False, streak_days: int=0, kyc_done: bool=False):
    score = 0
    score += min(lessons_completed * 50, 400)
    score += min(goals_set * 75, 225)
    score += 200 if sip_started else 0
    score += min(streak_days * 2, 100)
    score += 100 if kyc_done else 0
    score = min(score, 1000)
    if score < 200: level, level_name = 1, "Curious"
    elif score < 400: level, level_name = 2, "Learner"
    elif score < 600: level, level_name = 3, "Saver"
    elif score < 800: level, level_name = 4, "Investor"
    elif score < 950: level, level_name = 5, "Wealth Builder"
    else: level, level_name = 6, "Niveshak360 Pro"
    return {"finscore": score, "level": level, "level_name": level_name}