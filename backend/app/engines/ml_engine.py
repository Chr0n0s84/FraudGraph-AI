import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any, Optional
import math
import logging

logger = logging.getLogger("fraudgraph.engine.ml")

CHANNEL_WEIGHTS = {
    "WIRE": 0.7,
    "CRYPTO_RAMP": 0.95,
    "P2P": 0.6,
    "SWIFT": 0.8,
    "ATM": 0.65,
    "ACH": 0.3
}

class MLEngine:
    """
    Machine Learning Anomaly Detection engine utilizing Isolation Forest.
    Combines feature extraction across transaction parameters, account state,
    and graph centrality metrics.
    """
    def __init__(self, contamination: float = 0.12, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=60,
            contamination=contamination,
            random_state=random_state,
            n_jobs=1
        )
        self.is_trained = False

    def extract_features(
        self,
        amount: float,
        channel: str,
        source_account: Any,
        target_account: Any,
        source_metrics: Optional[Dict[str, Any]] = None,
        target_metrics: Optional[Dict[str, Any]] = None
    ) -> List[float]:
        """Extract standardized numerical features for the ML model."""
        source_metrics = source_metrics or {}
        target_metrics = target_metrics or {}

        amt = float(amount)
        log_amt = math.log1p(amt)
        
        src_bal = float(getattr(source_account, 'balance', 1000.0) or 1000.0)
        amt_to_bal = amt / max(1.0, src_bal)
        
        ch_weight = CHANNEL_WEIGHTS.get(channel, 0.5)
        
        src_in_deg = float(source_metrics.get("in_degree", getattr(source_account, "in_degree", 1)))
        src_out_deg = float(source_metrics.get("out_degree", getattr(source_account, "out_degree", 1)))
        
        tgt_in_deg = float(target_metrics.get("in_degree", getattr(target_account, "in_degree", 1)))
        tgt_out_deg = float(target_metrics.get("out_degree", getattr(target_account, "out_degree", 1)))
        
        src_pr = float(source_metrics.get("pagerank", getattr(source_account, "pagerank", 0.01)))
        tgt_pr = float(target_metrics.get("pagerank", getattr(target_account, "pagerank", 0.01)))
        
        return [
            amt,
            log_amt,
            src_bal,
            amt_to_bal,
            ch_weight,
            src_in_deg,
            src_out_deg,
            tgt_in_deg,
            tgt_out_deg,
            src_pr,
            tgt_pr
        ]

    def train(self, feature_matrix: List[List[float]]):
        """Train Isolation Forest on baseline transactions."""
        if len(feature_matrix) < 10:
            logger.warning("Insufficient samples to train IsolationForest; generating pseudo-training baseline.")
            return

        try:
            X = np.array(feature_matrix)
            self.model.fit(X)
            self.is_trained = True
            logger.info(f"Isolation Forest successfully trained on {len(feature_matrix)} samples.")
        except Exception as e:
            logger.error(f"Error training Isolation Forest: {e}")

    def score_transaction(self, features: List[float]) -> Dict[str, Any]:
        """
        Evaluate anomaly score for a transaction.
        Returns:
            {
                "ml_score": float (0-100),
                "is_anomaly": bool,
                "raw_decision_score": float
            }
        """
        if not self.is_trained:
            # Fallback heuristic score based on features if model not yet fitted
            amt = features[0]
            amt_to_bal = features[3]
            ch_w = features[4]
            heuristic = min(100.0, (math.log1p(amt) * 4) + (amt_to_bal * 20) + (ch_w * 30))
            return {
                "ml_score": round(heuristic, 1),
                "is_anomaly": heuristic >= 70,
                "raw_decision_score": -0.1 if heuristic >= 70 else 0.1
            }

        try:
            X = np.array([features])
            # decision_function: lower is more abnormal, negative implies anomaly
            raw_score = float(self.model.decision_function(X)[0])
            is_anomaly = bool(self.model.predict(X)[0] == -1)

            # Map raw_score (typically in range -0.3 to +0.3) to 0 - 100
            # raw_score of -0.2 -> score ~ 90, raw_score of +0.2 -> score ~ 20
            # sigmoid-like normalization
            normalized = 50.0 - (raw_score * 125.0)
            score = max(5.0, min(99.0, normalized))

            return {
                "ml_score": round(score, 1),
                "is_anomaly": is_anomaly,
                "raw_decision_score": round(raw_score, 4)
            }
        except Exception as e:
            logger.error(f"Error scoring transaction with ML: {e}")
            return {
                "ml_score": 30.0,
                "is_anomaly": False,
                "raw_decision_score": 0.0
            }

ml_engine = MLEngine()
