from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.engines.graph_engine import graph_engine
from typing import Dict, Any
import csv
import io

router = APIRouter()

@router.get("/metrics")
def get_analytics_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    clusters = graph_engine.get_mule_clusters()
    cycles = graph_engine.detect_circular_patterns()
    fan_ins = graph_engine.detect_fan_in_nodes()
    fan_outs = graph_engine.detect_fan_out_nodes()

    # Channel risk distribution
    channels = db.query(
        Transaction.channel,
        func.count(Transaction.id),
        func.avg(Transaction.risk_score),
        func.sum(Transaction.amount)
    ).group_by(Transaction.channel).all()

    channel_stats = [
        {
            "channel": c[0],
            "tx_count": c[1],
            "avg_risk": round(float(c[2] or 0), 1),
            "total_volume": round(float(c[3] or 0), 2)
        }
        for c in channels
    ]

    # Mule Ring Deep Dive
    rings_data = []
    rings = db.query(Account.mule_ring_id).filter(Account.mule_ring_id != None).distinct().all()
    for (ring_id,) in rings:
        accs = db.query(Account).filter(Account.mule_ring_id == ring_id).all()
        acc_ids = [a.id for a in accs]
        vol = db.query(func.sum(Transaction.amount)).filter(
            Transaction.source_account_id.in_(acc_ids)
        ).scalar() or 0.0
        
        rings_data.append({
            "ring_id": ring_id,
            "member_count": len(accs),
            "members": [a.account_number for a in accs],
            "total_volume": round(vol, 2),
            "primary_topology": "CIRCULAR" if "CIRC" in ring_id else ("FAN_IN" if "FAN-IN" in ring_id else "SMURF_DISPERSAL"),
            "risk_score": 95.0
        })

    return {
        "mule_rings": rings_data,
        "graph_topology": {
            "detected_clusters_count": len(clusters),
            "circular_cycles_count": len(cycles),
            "fan_in_hubs_count": len(fan_ins),
            "fan_out_hubs_count": len(fan_outs)
        },
        "channel_analytics": channel_stats,
        "summary": {
            "total_mules": db.query(Account).filter(Account.is_mule == True).count(),
            "total_flagged_volume": round(db.query(func.sum(Transaction.amount)).filter(Transaction.is_flagged == True).scalar() or 0.0, 2),
            "high_risk_tx_count": db.query(Transaction).filter(Transaction.risk_level.in_(["HIGH", "CRITICAL"])).count()
        }
    }

@router.get("/export/csv")
def export_flagged_transactions_csv(db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Hash", "Source Account", "Target Account",
        "Amount", "Currency", "Channel", "Status", "Risk Score",
        "Risk Level", "Pattern", "Reasons", "Timestamp"
    ])
    
    flagged_txs = db.query(Transaction).filter(Transaction.is_flagged == True).order_by(Transaction.timestamp.desc()).all()
    for tx in flagged_txs:
        src = db.query(Account).filter(Account.id == tx.source_account_id).first()
        tgt = db.query(Account).filter(Account.id == tx.target_account_id).first()
        writer.writerow([
            tx.id,
            tx.tx_hash,
            src.account_number if src else tx.source_account_id,
            tgt.account_number if tgt else tx.target_account_id,
            tx.amount,
            tx.currency,
            tx.channel,
            tx.status,
            tx.risk_score,
            tx.risk_level,
            tx.pattern_type,
            tx.detection_reasons,
            tx.timestamp.isoformat() if tx.timestamp else ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fraudgraph_suspicious_transactions.csv"}
    )

