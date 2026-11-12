from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    description: str
    account_id: Optional[int] = None
    transaction_id: Optional[int] = None
    risk_score: float
    status: str
    metadata_json: Optional[str] = None
    created_at: datetime
    
    account_number: Optional[str] = None
    holder_name: Optional[str] = None
    tx_hash: Optional[str] = None
    amount: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class AlertStatusUpdate(BaseModel):
    status: str
