from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CaseNoteCreate(BaseModel):
    note: str
    author: str = "Lead Investigator"

class CaseNoteResponse(BaseModel):
    id: int
    case_id: int
    author: str
    note: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CaseAuditResponse(BaseModel):
    id: int
    case_id: int
    action: str
    author: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "HIGH"
    assigned_to: str = "Analyst Sarah Jenkins"
    target_account_id: Optional[int] = None
    mule_ring_id: Optional[str] = None
    evidence_summary: Optional[str] = None

class CaseCreate(CaseBase):
    risk_score: float = 80.0

class CaseStatusUpdate(BaseModel):
    status: str
    author: str = "Investigator"
    details: Optional[str] = None

class CaseResponse(CaseBase):
    id: int
    case_number: str
    status: str
    risk_score: float
    created_at: datetime
    updated_at: datetime
    notes: List[CaseNoteResponse] = []
    audit_logs: List[CaseAuditResponse] = []
    
    target_account_number: Optional[str] = None
    target_holder_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
