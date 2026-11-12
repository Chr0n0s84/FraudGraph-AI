import asyncio
import random
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.websocket_manager import ws_manager
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.engines.rules_engine import rules_engine
from app.engines.ml_engine import ml_engine
from app.engines.risk_engine import risk_engine
from app.engines.graph_engine import graph_engine
from app.services.data_generator import generate_tx_hash
import logging

logger = logging.getLogger("fraudgraph.simulator")

class SimulatorService:
    def __init__(self):
        self.is_running = False
        self.speed_ms = 2000
        self.task: Optional[asyncio.Task] = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop())
        logger.info("Simulator loop started.")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None
        logger.info("Simulator loop stopped.")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.generate_single_transaction()
                await asyncio.sleep(self.speed_ms / 1000.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulator loop: {e}")
                await asyncio.sleep(2.0)

    async def generate_single_transaction(self) -> Optional[Dict[str, Any]]:
        """Simulate a single live incoming transaction, score it, persist it, and broadcast."""
        db: Session = SessionLocal()
        try:
            accounts = db.query(Account).all()
            if len(accounts) < 10:
                return None

            # 75% chance normal, 25% chance suspicious pattern
            is_suspicious_sim = random.random() < 0.25

            if is_suspicious_sim:
                scenario = random.choice(["CIRCULAR", "SMURFING", "RAPID_DRAIN", "FAN_IN"])
                if scenario == "CIRCULAR":
                    # Ring 1 nodes (51 to 55)
                    ring1 = [a for a in accounts if a.mule_ring_id == "RING-01-CIRCULAR"]
                    if len(ring1) >= 2:
                        src = random.choice(ring1)
                        # Pick next in cycle
                        idx = ring1.index(src)
                        tgt = ring1[(idx + 1) % len(ring1)]
                        amt = round(random.uniform(35000.0, 52000.0), 2)
                        channel = "WIRE"
                    else:
                        src, tgt = random.sample(accounts, 2)
                        amt = round(random.uniform(100.0, 2000.0), 2)
                        channel = "P2P"
                elif scenario == "SMURFING":
                    # Just under 10k threshold
                    src = random.choice(accounts)
                    tgt = random.choice(accounts)
                    while tgt.id == src.id:
                        tgt = random.choice(accounts)
                    amt = round(random.uniform(9100.0, 9950.0), 2)
                    channel = "P2P"
                elif scenario == "RAPID_DRAIN":
                    src = random.choice(accounts)
                    tgt = random.choice(accounts)
                    while tgt.id == src.id:
                        tgt = random.choice(accounts)
                    amt = round(min(src.balance * 0.9, 25000.0), 2)
                    channel = "CRYPTO_RAMP"
                else:  # FAN_IN
                    collector = db.query(Account).filter(Account.id == 64).first() or random.choice(accounts)
                    src = random.choice(accounts)
                    while src.id == collector.id:
                        src = random.choice(accounts)
                    tgt = collector
                    amt = round(random.uniform(11000.0, 19000.0), 2)
                    channel = "WIRE"
            else:
                # Normal transaction between retail accounts
                normal_accs = [a for a in accounts if not a.is_mule] or accounts
                src = random.choice(normal_accs)
                tgt = random.choice(normal_accs)
                while tgt.id == src.id:
                    tgt = random.choice(normal_accs)
                amt = round(random.uniform(25.0, 2200.0), 2)
                channel = random.choice(["P2P", "WIRE", "ACH"])

            # Recent transactions for velocity check
            src_recent = db.query(Transaction).filter(
                Transaction.source_account_id == src.id
            ).order_by(Transaction.timestamp.desc()).limit(10).all()

            tgt_recent = db.query(Transaction).filter(
                Transaction.target_account_id == tgt.id
            ).order_by(Transaction.timestamp.desc()).limit(10).all()

            # Rule evaluation
            graph_patterns = {
                "is_circular": (src.mule_ring_id == "RING-01-CIRCULAR" and tgt.mule_ring_id == "RING-01-CIRCULAR"),
                "is_fan_in": (tgt.id == 64),
                "is_fan_out": (src.id == 65)
            }
            rule_eval = rules_engine.evaluate_transaction(
                amount=amt,
                channel=channel,
                source_account=src,
                target_account=tgt,
                source_recent_txs=src_recent,
                target_recent_txs=tgt_recent,
                graph_patterns=graph_patterns
            )

            # ML evaluation
            src_metrics = {"in_degree": src.in_degree, "out_degree": src.out_degree, "pagerank": src.pagerank, "betweenness": src.betweenness}
            tgt_metrics = {"in_degree": tgt.in_degree, "out_degree": tgt.out_degree, "pagerank": tgt.pagerank, "betweenness": tgt.betweenness}
            feats = ml_engine.extract_features(
                amount=amt,
                channel=channel,
                source_account=src,
                target_account=tgt,
                source_metrics=src_metrics,
                target_metrics=tgt_metrics
            )
            ml_eval = ml_engine.score_transaction(feats)

            # Combined Explainable Risk Score
            risk_eval = risk_engine.compute_risk(
                rule_evaluation=rule_eval,
                ml_evaluation=ml_eval,
                graph_metrics=src_metrics,
                velocity_score=85.0 if len(src_recent) >= 4 else 15.0
            )

            status = "COMPLETED"
            if risk_eval["risk_level"] == "CRITICAL":
                status = "BLOCKED" if amt > 10000 else "FLAGGED"
            elif risk_eval["risk_level"] == "HIGH":
                status = "FLAGGED"

            now = datetime.utcnow()
            tx = Transaction(
                tx_hash=generate_tx_hash(src.id, tgt.id, amt, int(now.timestamp())),
                source_account_id=src.id,
                target_account_id=tgt.id,
                amount=amt,
                currency="USD",
                channel=channel,
                status=status,
                risk_score=risk_eval["final_score"],
                risk_level=risk_eval["risk_level"],
                is_flagged=risk_eval["is_flagged"],
                pattern_type=rule_eval.get("primary_pattern", "NORMAL"),
                detection_reasons="; ".join(rule_eval.get("reasons", [])),
                timestamp=now
            )
            db.add(tx)

            # Adjust balances
            src.balance = max(0.0, src.balance - amt)
            tgt.balance += amt
            src.out_degree = (src.out_degree or 0) + 1
            tgt.in_degree = (tgt.in_degree or 0) + 1

            new_alert_data = None
            if risk_eval["is_flagged"]:
                # Also raise alert
                alert = Alert(
                    alert_type=rule_eval.get("primary_pattern", "ANOMALY"),
                    severity=risk_eval["risk_level"],
                    title=f"{risk_eval['risk_level']} Risk Alert: ${amt:,.2f} via {channel}",
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

            # Broadcast via WebSocket to UI
            payload = {
                "event": "NEW_TRANSACTION",
                "transaction": {
                    "id": tx.id,
                    "tx_hash": tx.tx_hash,
                    "source_account_id": tx.source_account_id,
                    "source_account_number": src.account_number,
                    "source_holder_name": src.holder_name,
                    "target_account_id": tx.target_account_id,
                    "target_account_number": tgt.account_number,
                    "target_holder_name": tgt.holder_name,
                    "amount": tx.amount,
                    "currency": tx.currency,
                    "channel": tx.channel,
                    "status": tx.status,
                    "risk_score": tx.risk_score,
                    "risk_level": tx.risk_level,
                    "is_flagged": tx.is_flagged,
                    "pattern_type": tx.pattern_type,
                    "detection_reasons": tx.detection_reasons,
                    "timestamp": tx.timestamp.isoformat()
                },
                "alert": new_alert_data
            }
            await ws_manager.broadcast_json(payload)
            return payload

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to generate simulated transaction: {e}")
            return None
        finally:
            db.close()

simulator_service = SimulatorService()
