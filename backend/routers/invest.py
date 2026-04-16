from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.invest import Fund, SIP, VirtualPortfolioHolding, VirtualTransaction
from schemas.invest import (
    FundCreate, FundResponse,
    SIPCreate, SIPResponse, SIPInstalment,
    VirtualTrade, HoldingResponse,
    VirtualPortfolioSummary,
)

router = APIRouter(
    prefix="/invest",
    tags=["Invest"],
)

# Every new user starts with ₹1,00,000 virtual cash
VIRTUAL_STARTING_CASH = 100000.0


# ══════════════════════════════════════════════════════════════════
#  FUNDS
# ══════════════════════════════════════════════════════════════════

@router.post("/funds", response_model=FundResponse)
def create_fund(fund_data: FundCreate, db: Session = Depends(get_db)):
    """Add a new fund to the platform"""
    fund = Fund(
        name=fund_data.name,
        category=fund_data.category,
        risk_level=fund_data.risk_level,
        min_sip_amount=fund_data.min_sip_amount,
        one_year_return=fund_data.one_year_return,
        three_year_return=fund_data.three_year_return,
        nav=fund_data.nav,
        description=fund_data.description,
    )
    db.add(fund)
    db.commit()
    db.refresh(fund)
    return fund


@router.get("/funds", response_model=List[FundResponse])
def get_all_funds(
    category: str = None,
    risk_level: str = None,
    db: Session = Depends(get_db),
):
    """
    Get all funds. Optionally filter by category or risk level.
    Examples:
    /invest/funds?category=etf
    /invest/funds?risk_level=low
    """
    query = db.query(Fund).filter(Fund.is_active == True)
    if category:
        query = query.filter(Fund.category == category)
    if risk_level:
        query = query.filter(Fund.risk_level == risk_level)
    return query.all()


@router.get("/funds/{fund_id}", response_model=FundResponse)
def get_fund(fund_id: int, db: Session = Depends(get_db)):
    """Get a single fund by ID"""
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund


# ══════════════════════════════════════════════════════════════════
#  SIPs
# ══════════════════════════════════════════════════════════════════

@router.post("/sips", response_model=SIPResponse)
def create_sip(sip_data: SIPCreate, db: Session = Depends(get_db)):
    """Start a new SIP for a fund"""
    fund = db.query(Fund).filter(Fund.id == sip_data.fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    if sip_data.monthly_amount < fund.min_sip_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum SIP amount for this fund is ₹{fund.min_sip_amount}"
        )

    sip = SIP(
        fund_id=sip_data.fund_id,
        monthly_amount=sip_data.monthly_amount,
        sip_date=sip_data.sip_date,
        total_invested=0.0,
        current_value=0.0,
        instalments_paid=0,
    )
    db.add(sip)
    db.commit()
    db.refresh(sip)
    return sip


@router.get("/sips", response_model=List[SIPResponse])
def get_all_sips(user_id: int = 1, db: Session = Depends(get_db)):
    """Get all active SIPs for a user"""
    sips = db.query(SIP).filter(
        SIP.user_id == user_id,
        SIP.is_active == True,
    ).all()
    return sips


@router.post("/sips/instalment")
def record_sip_instalment(
    data: SIPInstalment,
    db: Session = Depends(get_db),
):
    """
    Record a monthly SIP instalment payment.
    Updates total invested and current value based on current NAV.
    """
    sip = db.query(SIP).filter(SIP.id == data.sip_id).first()
    if not sip:
        raise HTTPException(status_code=404, detail="SIP not found")

    units_purchased = sip.monthly_amount / data.current_nav
    sip.total_invested += sip.monthly_amount
    sip.current_value = sip.total_invested * (
        1 + sip.fund.one_year_return / 100
    )
    sip.instalments_paid += 1

    db.commit()
    db.refresh(sip)

    return {
        "message": "Instalment recorded",
        "sip_id": sip.id,
        "amount_invested": sip.monthly_amount,
        "units_purchased": round(units_purchased, 4),
        "total_invested": round(sip.total_invested, 2),
        "instalments_paid": sip.instalments_paid,
    }


@router.delete("/sips/{sip_id}")
def cancel_sip(sip_id: int, db: Session = Depends(get_db)):
    """Cancel an active SIP"""
    sip = db.query(SIP).filter(SIP.id == sip_id).first()
    if not sip:
        raise HTTPException(status_code=404, detail="SIP not found")
    sip.is_active = False
    db.commit()
    return {"message": f"SIP #{sip_id} cancelled successfully"}


# ══════════════════════════════════════════════════════════════════
#  VIRTUAL PORTFOLIO
# ══════════════════════════════════════════════════════════════════

@router.post("/virtual/trade")
def make_virtual_trade(
    trade: VirtualTrade,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    """
    Buy or sell in the virtual portfolio.
    Each user starts with ₹1,00,000 virtual cash.
    """
    total_amount = round(trade.units * trade.price_per_unit, 2)

    # ── BUY ───────────────────────────────────────────────────────
    if trade.transaction_type.lower() == "buy":
        existing = db.query(VirtualPortfolioHolding).filter(
            VirtualPortfolioHolding.user_id == user_id,
            VirtualPortfolioHolding.symbol == trade.symbol,
            VirtualPortfolioHolding.is_active == True,
        ).first()

        if existing:
            # Average down the buy price
            total_units = existing.units + trade.units
            total_cost = (
                existing.units * existing.average_buy_price
            ) + total_amount
            existing.average_buy_price = round(total_cost / total_units, 2)
            existing.units = total_units
            existing.current_price = trade.price_per_unit
        else:
            holding = VirtualPortfolioHolding(
                user_id=user_id,
                symbol=trade.symbol,
                name=trade.name,
                holding_type=trade.holding_type,
                units=trade.units,
                average_buy_price=trade.price_per_unit,
                current_price=trade.price_per_unit,
            )
            db.add(holding)

    # ── SELL ──────────────────────────────────────────────────────
    elif trade.transaction_type.lower() == "sell":
        existing = db.query(VirtualPortfolioHolding).filter(
            VirtualPortfolioHolding.user_id == user_id,
            VirtualPortfolioHolding.symbol == trade.symbol,
            VirtualPortfolioHolding.is_active == True,
        ).first()

        if not existing:
            raise HTTPException(
                status_code=400,
                detail="You do not hold this stock in your virtual portfolio"
            )
        if trade.units > existing.units:
            raise HTTPException(
                status_code=400,
                detail=f"You only have {existing.units} units to sell"
            )

        existing.units -= trade.units
        existing.current_price = trade.price_per_unit

        if existing.units == 0:
            existing.is_active = False
    else:
        raise HTTPException(
            status_code=400,
            detail="transaction_type must be 'buy' or 'sell'"
        )

    # Record the transaction
    txn = VirtualTransaction(
        user_id=user_id,
        symbol=trade.symbol,
        name=trade.name,
        transaction_type=trade.transaction_type.lower(),
        units=trade.units,
        price_per_unit=trade.price_per_unit,
        total_amount=total_amount,
    )
    db.add(txn)
    db.commit()

    return {
        "message": f"Virtual {trade.transaction_type} successful",
        "symbol": trade.symbol,
        "units": trade.units,
        "price_per_unit": trade.price_per_unit,
        "total_amount": total_amount,
    }


@router.get("/virtual/portfolio", response_model=VirtualPortfolioSummary)
def get_virtual_portfolio(user_id: int = 1, db: Session = Depends(get_db)):
    """Get a user's virtual portfolio summary"""
    holdings = db.query(VirtualPortfolioHolding).filter(
        VirtualPortfolioHolding.user_id == user_id,
        VirtualPortfolioHolding.is_active == True,
    ).all()

    total_invested = sum(h.total_invested for h in holdings)
    current_value = sum(h.current_value for h in holdings)
    profit_loss = current_value - total_invested
    profit_loss_percent = (
        round((profit_loss / total_invested) * 100, 2)
        if total_invested > 0 else 0
    )
    cash_remaining = VIRTUAL_STARTING_CASH - total_invested

    return VirtualPortfolioSummary(
        user_id=user_id,
        total_invested=round(total_invested, 2),
        current_value=round(current_value, 2),
        total_profit_loss=round(profit_loss, 2),
        total_profit_loss_percent=profit_loss_percent,
        cash_remaining=round(cash_remaining, 2),
        number_of_holdings=len(holdings),
    )


@router.get("/virtual/holdings", response_model=List[HoldingResponse])
def get_virtual_holdings(user_id: int = 1, db: Session = Depends(get_db)):
    """Get all individual holdings in the virtual portfolio"""
    holdings = db.query(VirtualPortfolioHolding).filter(
        VirtualPortfolioHolding.user_id == user_id,
        VirtualPortfolioHolding.is_active == True,
    ).all()
    return [HoldingResponse.from_orm_computed(h) for h in holdings]


@router.get("/virtual/transactions")
def get_virtual_transactions(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    """Get full transaction history for the virtual portfolio"""
    transactions = db.query(VirtualTransaction).filter(
        VirtualTransaction.user_id == user_id,
    ).order_by(VirtualTransaction.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "name": t.name,
            "type": t.transaction_type,
            "units": t.units,
            "price_per_unit": t.price_per_unit,
            "total_amount": t.total_amount,
            "date": t.created_at,
        }
        for t in transactions
    ]