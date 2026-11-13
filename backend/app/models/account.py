from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(64), unique=True, index=True, nullable=False)
    holder_name = Column(String(128), nullable=False)
    account_type = Column(String(32), default="INDIVIDUAL")  # INDIVIDUAL, CORPORATE, CRYPTO_GATEWAY, MERCHANT
    bank_name = Column(String(64), default="Global Apex Bank")
    balance = Column(Float, default=0.0)
    
    # Risk Metrics
    risk_score = Column(Float, default=10.0)  # 0 to 100
    risk_level = Column(String(16), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    is_flagged = Column(Boolean, default=False)
    flagged_reason = Column(String(255), nullable=True)
    mule_ring_id = Column(String(64), nullable=True)  # Ring identifier if identified as mule
    is_mule = Column(Boolean, default=False)
    
    # Network Metrics (cached/updated by graph engine)
    in_degree = Column(Integer, default=0)
    out_degree = Column(Integer, default=0)
    pagerank = Column(Float, default=0.0)
    betweenness = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

