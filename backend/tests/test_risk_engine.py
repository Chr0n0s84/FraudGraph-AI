import pytest
from app.engines.risk_engine import risk_engine

def test_risk_scoring_explanation():
    rule_eval = {
        "rule_score": 90.0,
        "is_flagged": True,
        "reasons": ["Circular money laundering cycle", "Rapid velocity"]
    }
    ml_eval = {
        "ml_score": 85.0,
        "is_anomaly": True
    }
    graph_metrics = {
        "is_circular": True,
        "in_degree": 4,
        "out_degree": 4,
        "betweenness": 15.5
    }
    
    result = risk_engine.compute_risk(
        rule_evaluation=rule_eval,
        ml_evaluation=ml_eval,
        graph_metrics=graph_metrics,
        velocity_score=80.0
    )
    
    assert result["final_score"] >= 80.0
    assert result["risk_level"] == "CRITICAL"
    assert result["is_flagged"] is True
    assert len(result["factors"]) == 4
    assert "CRITICAL" in result["explanation_summary"]
