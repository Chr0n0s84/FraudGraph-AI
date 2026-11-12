from typing import Dict, Any, List, Optional
from app.core.config import settings

class RiskScoringEngine:
    """
    Explainable Risk Scoring Engine.
    Fuses outputs from Graph Centrality & Topology, Transaction Velocity,
    Machine Learning Anomaly Detection, and Regulatory Typology Rules.
    """

    def compute_risk(
        self,
        rule_evaluation: Dict[str, Any],
        ml_evaluation: Dict[str, Any],
        graph_metrics: Dict[str, Any],
        velocity_score: float = 10.0,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Compute integrated explainable risk score.
        Returns:
            {
                "final_score": float (0-100),
                "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                "is_flagged": bool,
                "factors": [
                    {"name": str, "score": float, "weight": float, "contribution": float, "details": str}
                ],
                "explanation_summary": str
            }
        """
        w = custom_weights or {
            "graph": settings.WEIGHT_GRAPH_CENTRALITY,
            "velocity": settings.WEIGHT_VELOCITY,
            "ml": settings.WEIGHT_ML_ANOMALY,
            "rules": settings.WEIGHT_RULES_HEURISTIC
        }

        # Normalize weights
        total_w = sum(w.values()) or 1.0
        w_graph = w.get("graph", 0.25) / total_w
        w_velocity = w.get("velocity", 0.20) / total_w
        w_ml = w.get("ml", 0.25) / total_w
        w_rules = w.get("rules", 0.30) / total_w

        # Scores from sub-components
        rules_score = float(rule_evaluation.get("rule_score", 10.0))
        ml_score = float(ml_evaluation.get("ml_score", 10.0))
        
        # Graph score computed from betweenness, in-degree, out-degree, and pattern flags
        raw_graph_score = 15.0
        if graph_metrics.get("is_circular"):
            raw_graph_score = 98.0
        elif graph_metrics.get("is_fan_in") or graph_metrics.get("is_fan_out"):
            raw_graph_score = 88.0
        elif graph_metrics.get("betweenness", 0) > 20.0:
            raw_graph_score = min(95.0, 40.0 + (graph_metrics["betweenness"] * 2))
        elif graph_metrics.get("pagerank", 0) > 10.0:
            raw_graph_score = min(85.0, 30.0 + (graph_metrics["pagerank"] * 3))
        
        graph_score = float(raw_graph_score)

        # Weighted calculation
        c_rules = rules_score * w_rules
        c_ml = ml_score * w_ml
        c_graph = graph_score * w_graph
        c_velocity = velocity_score * w_velocity

        final_score = round(c_rules + c_ml + c_graph + c_velocity, 1)
        final_score = max(1.0, min(99.9, final_score))

        # Assign risk level
        if final_score >= settings.CRITICAL_RISK_THRESHOLD:
            risk_level = "CRITICAL"
            is_flagged = True
        elif final_score >= settings.HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
            is_flagged = True
        elif final_score >= settings.MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
            is_flagged = False
        else:
            risk_level = "LOW"
            is_flagged = False

        # Factors list for explainability
        factors = [
            {
                "name": "AML Typology Rules",
                "score": round(rules_score, 1),
                "weight": round(w_rules * 100, 1),
                "contribution": round(c_rules, 1),
                "details": ", ".join(rule_evaluation.get("reasons", ["Standard compliance"]))
            },
            {
                "name": "Graph Network Topology",
                "score": round(graph_score, 1),
                "weight": round(w_graph * 100, 1),
                "contribution": round(c_graph, 1),
                "details": f"In-deg: {graph_metrics.get('in_degree', 0)}, Out-deg: {graph_metrics.get('out_degree', 0)}, Centrality: {graph_metrics.get('betweenness', 0):.2f}%"
            },
            {
                "name": "ML Isolation Forest Anomaly",
                "score": round(ml_score, 1),
                "weight": round(w_ml * 100, 1),
                "contribution": round(c_ml, 1),
                "details": "Statistical outlier" if ml_evaluation.get("is_anomaly") else "Conforms to peer distribution"
            },
            {
                "name": "Transaction Velocity",
                "score": round(velocity_score, 1),
                "weight": round(w_velocity * 100, 1),
                "contribution": round(c_velocity, 1),
                "details": f"Burst frequency intensity score: {velocity_score:.0f}/100"
            }
        ]

        # Generate human-readable investigative explanation
        reasons_list = rule_evaluation.get("reasons", [])
        if is_flagged:
            primary_reason = reasons_list[0] if reasons_list else "High aggregate risk across indicators"
            explanation_summary = f"Flagged as {risk_level} risk ({final_score}/100) due to {primary_reason.lower()} with {w_ml*100:.0f}% ML outlier reinforcement."
        else:
            explanation_summary = f"Transaction cleared as {risk_level} risk ({final_score}/100). No significant laundering or velocity indicators triggered."

        return {
            "final_score": final_score,
            "risk_level": risk_level,
            "is_flagged": is_flagged,
            "factors": factors,
            "explanation_summary": explanation_summary
        }

risk_engine = RiskScoringEngine()
