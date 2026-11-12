from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardSummaryResponse(BaseModel):
    total_transactions: int
    total_volume: float
    total_accounts: int
    flagged_accounts: int
    mule_accounts: int
    active_mule_rings: int
    critical_alerts: int
    blocked_transactions: int
    avg_risk_score: float
    fraud_prevention_rate: float
    
    # Chart series
    risk_distribution: Dict[str, int]  # {"LOW": 120, "MEDIUM": 45, "HIGH": 18, "CRITICAL": 8}
    hourly_trend: List[Dict[str, Any]]
    pattern_breakdown: Dict[str, int]
    top_suspicious_accounts: List[Dict[str, Any]]
