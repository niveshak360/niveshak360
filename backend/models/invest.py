from sqlalchemy import (
    Column, Integer, String, Float,
    Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Fund(Base):
    """A mutual fund or ETF available on the platform"""
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # equity / debt / gold / etf
    risk_level = Column(String, default="moderate")  # low / moderate / high
    min_sip_amount = Column(Float, default=100.0)
    one_year_return = Column(Float, default=0.0)
    three_year_return = Column(Float, default=0.0)
    nav = Column(Float, default=0.0)  # Net Asset Value
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # One fund can have many SIPs
    sips = relationship("SIP", back_populates="fund")


class SIP(Base):
    """A Systematic Investment Plan set up by a user"""
    __tablename__ = "sips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    monthly_amount = Column(Float, nullable=False)
    sip_date = Column(Integer, default=5)       # day of month e.g. 5
    total_invested = Column(Float, default=0.0)
    current_value = Column(Float, default=0.0)
    instalments_paid = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fund = relationship("Fund", back_populates="sips")


class VirtualPortfolioHolding(Base):
    """A stock or fund held in a user's virtual portfolio"""
    __tablename__ = "virtual_holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    symbol = Column(String, nullable=False)     # e.g. "NIFTY50", "RELIANCE"
    name = Column(String, nullable=False)
    holding_type = Column(String, default="stock")  # stock / etf / mf
    units = Column(Float, default=0.0)
    average_buy_price = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def total_invested(self):
        return round(self.units * self.average_buy_price, 2)

    @property
    def current_value(self):
        return round(self.units * self.current_price, 2)

    @property
    def profit_loss(self):
        return round(self.current_value - self.total_invested, 2)

    @property
    def profit_loss_percent(self):
        if self.total_invested == 0:
            return 0.0
        return round((self.profit_loss / self.total_invested) * 100, 2)


class VirtualTransaction(Base):
    """A buy or sell transaction in the virtual portfolio"""
    __tablename__ = "virtual_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    symbol = Column(String, nullable=False)
    name = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # buy / sell
    units = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())