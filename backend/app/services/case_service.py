from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.case import Case, CaseAuditLog, CaseNote
from app.models.account import Account
from app.schemas.case import CaseCreate, CaseStatusUpdate, CaseNoteCreate
from datetime import datetime

class CaseService:
    def list_cases(self, db: Session, status: Optional[str] = None) -> List[Case]:
        q = db.query(Case)
        if status and status != "ALL":
            q = q.filter(Case.status == status)
        return q.order_by(Case.created_at.desc()).all()

    def get_case(self, db: Session, case_id: int) -> Optional[Case]:
        return db.query(Case).filter(Case.id == case_id).first()

    def create_case(self, db: Session, data: CaseCreate) -> Case:
        # Generate unique case number
        count = db.query(Case).count() + 1
        case_num = f"CASE-{datetime.utcnow().year}-{count:04d}"
        
        new_case = Case(
            case_number=case_num,
            title=data.title,
            description=data.description,
            priority=data.priority,
            assigned_to=data.assigned_to,
            risk_score=data.risk_score,
            target_account_id=data.target_account_id,
            mule_ring_id=data.mule_ring_id,
            evidence_summary=data.evidence_summary,
            status="OPEN"
        )
        db.add(new_case)
        db.flush()

        audit = CaseAuditLog(
            case_id=new_case.id,
            action="CREATED",
            author="Investigator",
            details=f"Case opened manually or escalated with initial risk score {data.risk_score}."
        )
        db.add(audit)
        db.commit()
        db.refresh(new_case)
        return new_case

    def update_case_status(self, db: Session, case_id: int, data: CaseStatusUpdate) -> Optional[Case]:
        case = self.get_case(db, case_id)
        if not case:
            return None
        
        old_status = case.status
        case.status = data.status
        case.updated_at = datetime.utcnow()

        audit = CaseAuditLog(
            case_id=case.id,
            action="STATUS_CHANGED",
            author=data.author,
            details=f"Status transitioned from {old_status} to {data.status}. Note: {data.details or 'N/A'}"
        )
        db.add(audit)
        db.commit()
        db.refresh(case)
        return case

    def add_note(self, db: Session, case_id: int, data: CaseNoteCreate) -> Optional[CaseNote]:
        case = self.get_case(db, case_id)
        if not case:
            return None
        
        note = CaseNote(
            case_id=case_id,
            author=data.author,
            note=data.note
        )
        db.add(note)
        
        audit = CaseAuditLog(
            case_id=case_id,
            action="NOTE_ADDED",
            author=data.author,
            details=f"Investigator note recorded."
        )
        db.add(audit)
        db.commit()
        db.refresh(note)
        return note

case_service = CaseService()
