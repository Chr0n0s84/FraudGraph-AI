from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(64), nullable=False)  # CIRCULAR_LAUNDERING, MULE_FAN_IN, SMURFING_FAN_OUT, VELOCITY_ANOMALY, STRUCTURING
    severity = Column(String(16), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    
    account_id = Column(Integer, ForeignKey("accounts.id"), index=True, nullable=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), index=True, nullable=True)
    
    risk_score = Column(Float, default=75.0)
    status = Column(String(24), default="OPEN")  # OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED, ESCALATED_TO_CASE
    
    metadata_json = Column(Text, nullable=True)  # JSON-encoded extra context
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

