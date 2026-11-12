from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.case import Case, CaseAuditLog, CaseNote
from app.models.account import Account
from app.schemas.case import (
    CaseResponse, CaseCreate, CaseStatusUpdate, 
    CaseNoteCreate, CaseNoteResponse, CaseAuditResponse
)
from app.services.case_service import case_service

router = APIRouter()

def _populate_case_response(case: Case, db: Session) -> CaseResponse:
    acc = db.query(Account).filter(Account.id == case.target_account_id).first() if case.target_account_id else None
    notes = db.query(CaseNote).filter(CaseNote.case_id == case.id).order_by(CaseNote.created_at.desc()).all()
    audits = db.query(CaseAuditLog).filter(CaseAuditLog.case_id == case.id).order_by(CaseAuditLog.created_at.desc()).all()

    resp = CaseResponse.model_validate(case)
    resp.target_account_number = acc.account_number if acc else None
    resp.target_holder_name = acc.holder_name if acc else None
    resp.notes = [CaseNoteResponse.model_validate(n) for n in notes]
    resp.audit_logs = [CaseAuditResponse.model_validate(a) for a in audits]
    return resp

@router.get("", response_model=List[CaseResponse])
def list_cases(status: Optional[str] = None, db: Session = Depends(get_db)):
    cases = case_service.list_cases(db, status=status)
    return [_populate_case_response(c, db) for c in cases]

@router.get("/{case_id}", response_model=CaseResponse)
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    case = case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return _populate_case_response(case, db)

@router.post("", response_model=CaseResponse)
def create_case(data: CaseCreate, db: Session = Depends(get_db)):
    new_case = case_service.create_case(db, data)
    return _populate_case_response(new_case, db)

@router.put("/{case_id}/status", response_model=CaseResponse)
def update_case_status(case_id: int, data: CaseStatusUpdate, db: Session = Depends(get_db)):
    case = case_service.update_case_status(db, case_id, data)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return _populate_case_response(case, db)

@router.post("/{case_id}/notes", response_model=CaseNoteResponse)
def add_case_note(case_id: int, data: CaseNoteCreate, db: Session = Depends(get_db)):
    note = case_service.add_note(db, case_id, data)
    if not note:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseNoteResponse.from_orm(note)
