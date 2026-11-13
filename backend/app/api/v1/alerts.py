from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.alert import Alert
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.alert import AlertResponse, AlertStatusUpdate
from app.schemas.case import CaseCreate
from app.services.case_service import case_service

router = APIRouter()

def _populate_alert(a: Alert, db: Session):
    acc = db.query(Account).filter(Account.id == a.account_id).first() if a.account_id else None
    tx = db.query(Transaction).filter(Transaction.id == a.transaction_id).first() if a.transaction_id else None
    return {
        "id": a.id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "title": a.title,
        "description": a.description,
        "account_id": a.account_id,
        "transaction_id": a.transaction_id,
        "risk_score": a.risk_score,
        "status": a.status,
        "metadata_json": a.metadata_json,
        "created_at": a.created_at,
        "account_number": acc.account_number if acc else None,
        "holder_name": acc.holder_name if acc else None,
        "tx_hash": tx.tx_hash if tx else None,
        "amount": tx.amount if tx else None
    }

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()
    return [_populate_alert(a, db) for a in alerts]

@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(alert_id: int, data: AlertStatusUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = data.status
    db.commit()
    db.refresh(alert)
    return _populate_alert(alert, db)

@router.post("/{alert_id}/escalate-to-case")
def escalate_alert_to_case(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Create Case
    acc = db.query(Account).filter(Account.id == alert.account_id).first() if alert.account_id else None
    case_in = CaseCreate(
        title=f"Escalated: {alert.title}",
        description=alert.description,
        priority=alert.severity if alert.severity in ["HIGH", "CRITICAL"] else "HIGH",
        assigned_to="Senior Fraud Analyst",
        risk_score=alert.risk_score,
        target_account_id=alert.account_id,
        mule_ring_id=acc.mule_ring_id if acc else None,
        evidence_summary=f"Escalated from Alert #{alert.id} ({alert.alert_type}). Metadata: {alert.metadata_json or 'None'}"
    )
    new_case = case_service.create_case(db, case_in)
    
    # Mark alert as escalated
    alert.status = "ESCALATED_TO_CASE"
    db.commit()

    return {
        "success": True,
        "case_id": new_case.id,
        "case_number": new_case.case_number,
        "alert_id": alert.id
    }
