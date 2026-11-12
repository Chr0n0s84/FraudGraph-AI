from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.schemas.account import AccountResponse, AccountDetailResponse, AccountCreate

router = APIRouter()

@router.get("", response_model=List[AccountResponse])
def list_accounts(
    risk_level: Optional[str] = None,
    is_flagged: Optional[bool] = None,
    is_mule: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Account)
    if risk_level and risk_level != "ALL":
        query = query.filter(Account.risk_level == risk_level)
    if is_flagged is not None:
        query = query.filter(Account.is_flagged == is_flagged)
    if is_mule is not None:
        query = query.filter(Account.is_mule == is_mule)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Account.holder_name.ilike(s), Account.account_number.ilike(s)))

    return query.order_by(Account.risk_score.desc()).offset(offset).limit(limit).all()

@router.get("/{account_id}", response_model=AccountDetailResponse)
def get_account_detail(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    inflow = db.query(func.sum(Transaction.amount)).filter(Transaction.target_account_id == account_id).scalar() or 0.0
    outflow = db.query(func.sum(Transaction.amount)).filter(Transaction.source_account_id == account_id).scalar() or 0.0
    tx_count = db.query(Transaction).filter(
        or_(Transaction.source_account_id == account_id, Transaction.target_account_id == account_id)
    ).count()

    # Counterparties
    sources = db.query(Transaction.source_account_id).filter(Transaction.target_account_id == account_id).distinct().all()
    targets = db.query(Transaction.target_account_id).filter(Transaction.source_account_id == account_id).distinct().all()
    unique_counterparties = len(set([s[0] for s in sources] + [t[0] for t in targets]))

    resp = AccountDetailResponse.model_validate(acc)
    resp.total_inflow = round(inflow, 2)
    resp.total_outflow = round(outflow, 2)
    resp.transaction_count = tx_count
    resp.connected_counterparties = unique_counterparties
    return resp

@router.post("/{account_id}/toggle-flag")
def toggle_account_flag(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    acc.is_flagged = not acc.is_flagged
    if acc.is_flagged:
        acc.flagged_reason = "Manually flagged by investigator"
        if acc.risk_score < 70.0:
            acc.risk_score = 75.0
            acc.risk_level = "HIGH"
    else:
        acc.flagged_reason = None
        
    db.commit()
    db.refresh(acc)
    return {"id": acc.id, "is_flagged": acc.is_flagged, "risk_level": acc.risk_level}

@router.post("", response_model=AccountResponse)
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    existing = db.query(Account).filter(Account.account_number == data.account_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account number already exists")
        
    acc = Account(
        account_number=data.account_number,
        holder_name=data.holder_name,
        account_type=data.account_type,
        bank_name=data.bank_name,
        balance=data.balance,
        risk_score=10.0,
        risk_level="LOW",
        is_flagged=False,
        is_mule=False
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc
