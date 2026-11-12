from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(64), unique=True, index=True, nullable=False)
    
    source_account_id = Column(Integer, ForeignKey("accounts.id"), index=True, nullable=False)
    target_account_id = Column(Integer, ForeignKey("accounts.id"), index=True, nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="USD")
    channel = Column(String(32), default="WIRE")  # WIRE, ACH, P2P, SWIFT, ATM, CRYPTO_RAMP
    
    status = Column(String(24), default="COMPLETED")  # COMPLETED, BLOCKED, FLAGGED, UNDER_REVIEW
    
    # Risk Assessment
    risk_score = Column(Float, default=5.0)  # 0 - 100
    risk_level = Column(String(16), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    is_flagged = Column(Boolean, default=False)
    
    # Detected Pattern
    pattern_type = Column(String(64), nullable=True)  # NORMAL, CIRCULAR_FLOW, FAN_IN, FAN_OUT, RAPID_VELOCITY, STRUCTURING_SMURFING
    detection_reasons = Column(Text, nullable=True)  # JSON or comma-separated explanation
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
