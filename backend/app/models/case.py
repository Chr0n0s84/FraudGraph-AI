from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(String(32), default="INVESTIGATING")  # OPEN, INVESTIGATING, ESCALATED, CLOSED_CONFIRMED_FRAUD, CLOSED_FALSE_POSITIVE
    priority = Column(String(16), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    assigned_to = Column(String(64), default="Analyst Sarah Jenkins")
    
    risk_score = Column(Float, default=85.0)
    target_account_id = Column(Integer, ForeignKey("accounts.id"), index=True, nullable=True)
    mule_ring_id = Column(String(64), nullable=True)
    
    evidence_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class CaseAuditLog(Base):
    __tablename__ = "case_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), index=True, nullable=False)
    action = Column(String(64), nullable=False)  # CREATED, STATUS_CHANGED, ASSIGNED, NOTE_ADDED, EVIDENCE_ATTACHED
    author = Column(String(64), default="System")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), index=True, nullable=False)
    author = Column(String(64), default="Analyst")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
