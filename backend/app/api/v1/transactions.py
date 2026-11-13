from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.core.websocket_manager import ws_manager
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.alert import Alert
from app.schemas.transaction import TransactionResponse, TransactionCreate
from app.engines.rules_engine import rules_engine
from app.engines.ml_engine import ml_engine
from app.engines.risk_engine import risk_engine
from app.services.data_generator import generate_tx_hash
from datetime import datetime

router = APIRouter()

def _populate_tx_response(tx: Transaction, db: Session) -> Dict[str, Any]:
    src = db.query(Account).filter(Account.id == tx.source_account_id).first()
    tgt = db.query(Account).filter(Account.id == tx.target_account_id).first()
    return {
        "id": tx.id,
        "tx_hash": tx.tx_hash,
        "source_account_id": tx.source_account_id,
        "source_account_number": src.account_number if src else "N/A",
        "source_holder_name": src.holder_name if src else "Unknown",
        "target_account_id": tx.target_account_id,
        "target_account_number": tgt.account_number if tgt else "N/A",
        "target_holder_name": tgt.holder_name if tgt else "Unknown",
        "amount": tx.amount,
        "currency": tx.currency,
        "channel": tx.channel,
        "status": tx.status,
        "risk_score": tx.risk_score,
        "risk_level": tx.risk_level,
        "is_flagged": tx.is_flagged,
        "pattern_type": tx.pattern_type,
        "detection_reasons": tx.detection_reasons,
        "timestamp": tx.timestamp
    }

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    risk_level: Optional[str] = None,
    channel: Optional[str] = None,
    is_flagged: Optional[bool] = None,
    account_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if risk_level and risk_level != "ALL":
        query = query.filter(Transaction.risk_level == risk_level)
    if channel and channel != "ALL":
        query = query.filter(Transaction.channel == channel)
    if is_flagged is not None:
        query = query.filter(Transaction.is_flagged == is_flagged)
    if account_id:
        query = query.filter((Transaction.source_account_id == account_id) | (Transaction.target_account_id == account_id))

    txs = query.order_by(Transaction.timestamp.desc()).offset(offset).limit(limit).all()
    return [_populate_tx_response(tx, db) for tx in txs]

@router.get("/{tx_id}")
def get_transaction_detail(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    base_data = _populate_tx_response(tx, db)
    
    # Generate explainability payload
    src = db.query(Account).filter(Account.id == tx.source_account_id).first()
    tgt = db.query(Account).filter(Account.id == tx.target_account_id).first()
    
    src_metrics = {"in_degree": src.in_degree if src else 0, "out_degree": src.out_degree if src else 0, "pagerank": src.pagerank if src else 0, "betweenness": src.betweenness if src else 0}
    feats = ml_engine.extract_features(
        amount=tx.amount,
        channel=tx.channel,
        source_account=src,
        target_account=tgt,
        source_metrics=src_metrics
    )
    ml_eval = ml_engine.score_transaction(feats)
    
    rule_eval = {
        "rule_score": tx.risk_score,
        "reasons": [r.strip() for r in (tx.detection_reasons or "Standard transaction").split(";")]
    }
    risk_breakdown = risk_engine.compute_risk(
        rule_evaluation=rule_eval,
        ml_evaluation=ml_eval,
        graph_metrics=src_metrics,
        velocity_score=80.0 if tx.is_flagged else 10.0
    )

    return {
        **base_data,
        "risk_breakdown": risk_breakdown,
        "raw_features": {
            "amount": tx.amount,
            "channel": tx.channel,
            "source_balance": src.balance if src else 0.0,
            "target_balance": tgt.balance if tgt else 0.0
        }
    }

@router.post("", response_model=TransactionResponse)
async def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    src = db.query(Account).filter(Account.id == data.source_account_id).first()
    tgt = db.query(Account).filter(Account.id == data.target_account_id).first()
    if not src or not tgt:
        raise HTTPException(status_code=400, detail="Invalid source or target account ID")

    # Fetch recent transactions
    src_recent = db.query(Transaction).filter(
        Transaction.source_account_id == src.id
    ).order_by(Transaction.timestamp.desc()).limit(10).all()

    # Rule evaluation
    graph_patterns = {
        "is_circular": (src.mule_ring_id and src.mule_ring_id == tgt.mule_ring_id),
        "is_fan_in": (tgt.in_degree >= 5),
        "is_fan_out": (src.out_degree >= 5)
    }
    rule_eval = rules_engine.evaluate_transaction(
        amount=data.amount,
        channel=data.channel,
        source_account=src,
        target_account=tgt,
        source_recent_txs=src_recent,
        target_recent_txs=[],
        graph_patterns=graph_patterns
    )

    # ML Anomaly evaluation
    src_metrics = {"in_degree": src.in_degree, "out_degree": src.out_degree, "pagerank": src.pagerank, "betweenness": src.betweenness}
    tgt_metrics = {"in_degree": tgt.in_degree, "out_degree": tgt.out_degree, "pagerank": tgt.pagerank, "betweenness": tgt.betweenness}
    feats = ml_engine.extract_features(
        amount=data.amount,
        channel=data.channel,
        source_account=src,
        target_account=tgt,
        source_metrics=src_metrics,
        target_metrics=tgt_metrics
    )
    ml_eval = ml_engine.score_transaction(feats)

    # Risk Scoring
    risk_eval = risk_engine.compute_risk(
        rule_evaluation=rule_eval,
        ml_evaluation=ml_eval,
        graph_metrics=src_metrics,
        velocity_score=85.0 if len(src_recent) >= 4 else 15.0
    )

    status = "COMPLETED"
    if risk_eval["risk_level"] == "CRITICAL":
        status = "BLOCKED" if data.amount > 10000 else "FLAGGED"
    elif risk_eval["risk_level"] == "HIGH":
        status = "FLAGGED"

    now = datetime.utcnow()
    tx = Transaction(
        tx_hash=generate_tx_hash(src.id, tgt.id, data.amount, int(now.timestamp())),
        source_account_id=src.id,
        target_account_id=tgt.id,
        amount=data.amount,
        currency=data.currency,
        channel=data.channel,
        status=status,
        risk_score=risk_eval["final_score"],
        risk_level=risk_eval["risk_level"],
        is_flagged=risk_eval["is_flagged"],
        pattern_type=rule_eval.get("primary_pattern", "NORMAL"),
        detection_reasons="; ".join(rule_eval.get("reasons", [])),
        timestamp=now
    )
    db.add(tx)
    
    src.balance = max(0.0, src.balance - data.amount)
    tgt.balance += data.amount
    src.out_degree = (src.out_degree or 0) + 1
    tgt.in_degree = (tgt.in_degree or 0) + 1

    # Raise alert if high or critical
    new_alert_data = None
    if risk_eval["is_flagged"]:
        alert = Alert(
            alert_type=rule_eval.get("primary_pattern", "ANOMALY"),
            severity=risk_eval["risk_level"],
            title=f"{risk_eval['risk_level']} Alert: ${data.amount:,.2f} via {data.channel}",
            description=risk_eval["explanation_summary"],
            account_id=src.id,
            transaction_id=tx.id,
            risk_score=risk_eval["final_score"],
            status="OPEN",
            created_at=now
        )
        db.add(alert)
        db.flush()
        new_alert_data = {
            "id": alert.id,
            "title": alert.title,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "description": alert.description,
            "account_number": src.account_number,
            "created_at": now.isoformat()
        }

    db.commit()
    db.refresh(tx)

    # Broadcast to live UI
    payload = {
        "event": "NEW_TRANSACTION",
        "transaction": _populate_tx_response(tx, db),
        "alert": new_alert_data
    }
    await ws_manager.broadcast_json(payload)

    return _populate_tx_response(tx, db)
