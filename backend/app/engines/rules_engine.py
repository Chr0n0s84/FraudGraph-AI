from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("fraudgraph.engine.rules")

class RulesEngine:
    """
    Expert rule-based fraud detection engine.
    Applies regulatory AML typologies, velocity tests, structuring detection,
    and money mule heuristics.
    """

    def evaluate_transaction(
        self,
        amount: float,
        channel: str,
        source_account: Any,
        target_account: Any,
        source_recent_txs: List[Any],
        target_recent_txs: List[Any],
        graph_patterns: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single transaction against rule sets.
        Returns:
            {
                "triggered_rules": [...],
                "rule_score": float (0-100),
                "is_flagged": bool,
                "reasons": List[str],
                "primary_pattern": str
            }
        """
        triggered = []
        reasons = []
        primary_pattern = "NORMAL"

        # 1. Structuring / Smurfing Detection
        # Digital smurfing: transactions intentionally kept just under regulatory reporting threshold ($10,000)
        if 9000 <= amount <= 9999:
            triggered.append({
                "rule": "STRUCTURING_THRESHOLD",
                "severity": "HIGH",
                "score": 85,
                "reason": f"Amount ${amount:,.2f} is just below the $10,000 regulatory reporting threshold (CTR evasion heuristic)."
            })
            reasons.append("Structuring: Near-threshold transfer ($9,000-$9,999)")
            primary_pattern = "STRUCTURING_SMURFING"

        # Check if source has multiple near-threshold transactions recently
        recent_structuring = [
            tx for tx in source_recent_txs 
            if 8500 <= tx.amount <= 9999
        ]
        if len(recent_structuring) >= 2:
            triggered.append({
                "rule": "REPEATED_SMURFING",
                "severity": "CRITICAL",
                "score": 95,
                "reason": f"Account has executed {len(recent_structuring) + 1} structured transactions just under $10,000 threshold within a short window."
            })
            reasons.append("Repeated smurfing pattern detected")
            primary_pattern = "STRUCTURING_SMURFING"

        # 2. Velocity Anomaly Rule
        # High frequency of outgoing transactions in short duration (e.g. >= 3 txs within 15 minutes)
        now = datetime.utcnow()
        recent_15m = [
            tx for tx in source_recent_txs
            if tx.timestamp and (now - tx.timestamp.replace(tzinfo=None) if hasattr(tx.timestamp, 'tzinfo') else now - tx.timestamp) <= timedelta(minutes=15)
        ]
        if len(recent_15m) >= 3:
            triggered.append({
                "rule": "HIGH_VELOCITY_BURST",
                "severity": "HIGH",
                "score": 80,
                "reason": f"Rapid velocity burst: {len(recent_15m) + 1} transactions from source account in under 15 minutes."
            })
            reasons.append("Rapid transaction velocity burst")
            if primary_pattern == "NORMAL":
                primary_pattern = "RAPID_VELOCITY"

        # 3. Rapid Drain / Pass-Through Mule Behavior
        # Account balance is low, received recent deposit, immediately transferring out > 85%
        if source_account and source_account.balance > 0:
            if amount >= (source_account.balance * 0.85) and amount > 5000:
                triggered.append({
                    "rule": "RAPID_ACCOUNT_DRAIN",
                    "severity": "HIGH",
                    "score": 75,
                    "reason": f"Rapid account balance depletion: Transferring ${amount:,.2f} which represents {round((amount/source_account.balance)*100)}% of total account funds."
                })
                reasons.append("Pass-through / Rapid balance drain")

        # 4. Extreme Amount Outlier Rule
        if amount >= 50000:
            triggered.append({
                "rule": "HIGH_VALUE_TRANSFER",
                "severity": "MEDIUM",
                "score": 60,
                "reason": f"High value single transfer: ${amount:,.2f} exceeds standard retail risk threshold."
            })
            reasons.append("High value wire transfer")

        # 5. Graph Patterns Injected from Graph Engine
        if graph_patterns:
            if graph_patterns.get("is_circular"):
                cycle_nodes = graph_patterns.get("cycle_nodes", [])
                triggered.append({
                    "rule": "CIRCULAR_LAUNDERING_RING",
                    "severity": "CRITICAL",
                    "score": 98,
                    "reason": f"Circular money movement cycle detected across {len(cycle_nodes)} interconnected accounts (Layering ring)."
                })
                reasons.append(f"Circular layering cycle ({len(cycle_nodes)} hops)")
                primary_pattern = "CIRCULAR_FLOW"

            if graph_patterns.get("is_fan_in"):
                triggered.append({
                    "rule": "MULE_FAN_IN_CONVERGENCE",
                    "severity": "CRITICAL",
                    "score": 90,
                    "reason": f"Target account acts as a centralized funnel node receiving converging funds from multiple originators."
                })
                reasons.append("Fan-in mule collector convergence")
                if primary_pattern == "NORMAL":
                    primary_pattern = "FAN_IN"

            if graph_patterns.get("is_fan_out"):
                triggered.append({
                    "rule": "SMURFING_FAN_OUT_DISPERSAL",
                    "severity": "CRITICAL",
                    "score": 90,
                    "reason": f"Source account acts as a disbursement hub rapidly distributing funds to numerous disparate satellite accounts."
                })
                reasons.append("Fan-out smurfing disbursement hub")
                if primary_pattern == "NORMAL":
                    primary_pattern = "FAN_OUT"

        # 6. Counterparty Mule Contagion
        if source_account and source_account.is_mule:
            triggered.append({
                "rule": "CONFIRMED_MULE_SOURCE",
                "severity": "CRITICAL",
                "score": 95,
                "reason": f"Source account is identified as an active mule account in ring {source_account.mule_ring_id or 'MULE-NET'}."
            })
            reasons.append("Source is a known mule account")

        if target_account and target_account.is_mule:
            triggered.append({
                "rule": "CONFIRMED_MULE_TARGET",
                "severity": "CRITICAL",
                "score": 95,
                "reason": f"Target account is identified as an active mule account in ring {target_account.mule_ring_id or 'MULE-NET'}."
            })
            reasons.append("Target is a known mule account")

        # Compute composite rule score
        if not triggered:
            return {
                "triggered_rules": [],
                "rule_score": 10.0,
                "is_flagged": False,
                "reasons": ["Normal transaction activity"],
                "primary_pattern": "NORMAL"
            }

        max_score = max(r["score"] for r in triggered)
        is_flagged = max_score >= 60

        return {
            "triggered_rules": triggered,
            "rule_score": float(max_score),
            "is_flagged": is_flagged,
            "reasons": reasons,
            "primary_pattern": primary_pattern
        }

rules_engine = RulesEngine()
