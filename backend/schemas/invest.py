from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Fund schemas ───────────────────────────────────────────────────
class FundCreate(BaseModel):
    name: str = Field(..., example="Nifty 50 ETF")
    category: str = Field(..., example="etf")
    risk_level: Optional[str] = Field("low", example="low")
    min_sip_amount: Optional[float] = Field(100.0, example=100.0)
    one_year_return: Optional[float] = Field(0.0, example=14.2)
    three_year_return: Optional[float] = Field(0.0, example=12.1)
    nav: Optional[float] = Field(0.0, example=213.45)
    description: Optional[str] = None


class FundResponse(BaseModel):
    id: int
    name: str
    category: str
    risk_level: str
    min_sip_amount: float
    one_year_return: float
    three_year_return: float
    nav: float
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ── SIP schemas ────────────────────────────────────────────────────
class SIPCreate(BaseModel):
    fund_id: int = Field(..., example=1)
    monthly_amount: float = Field(..., example=1000.0)
    sip_date: Optional[int] = Field(5, example=5)


class SIPResponse(BaseModel):
    id: int
    user_id: int
    fund_id: int
    monthly_amount: float
    sip_date: int
    total_invested: float
    current_value: float
    instalments_paid: int
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class SIPInstalment(BaseModel):
    """Record a monthly SIP payment"""
    sip_id: int
    current_nav: float = Field(..., example=213.45)


# ── Virtual Portfolio schemas ──────────────────────────────────────
class VirtualTrade(BaseModel):
    symbol: str = Field(..., example="NIFTY50")
    name: str = Field(..., example="Nifty 50 ETF")
    holding_type: Optional[str] = Field("etf", example="etf")
    transaction_type: str = Field(..., example="buy")
    units: float = Field(..., example=10.0)
    price_per_unit: float = Field(..., example=213.45)


class HoldingResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    name: str
    holding_type: str
    units: float
    average_buy_price: float
    current_price: float
    total_invested: float
    current_value: float
    profit_loss: float
    profit_loss_percent: float

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_computed(cls, h):
        return cls(
            id=h.id,
            user_id=h.user_id,
            symbol=h.symbol,
            name=h.name,
            holding_type=h.holding_type,
            units=h.units,
            average_buy_price=h.average_buy_price,
            current_price=h.current_price,
            total_invested=h.total_invested,
            current_value=h.current_value,
            profit_loss=h.profit_loss,
            profit_loss_percent=h.profit_loss_percent,
        )


class VirtualPortfolioSummary(BaseModel):
    user_id: int
    total_invested: float
    current_value: float
    total_profit_loss: float
    total_profit_loss_percent: float
    cash_remaining: float
    number_of_holdings: int