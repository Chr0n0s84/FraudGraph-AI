from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    source_account_id: int
    target_account_id: int
    amount: float
    currency: str = "USD"
    channel: str = "WIRE"

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    tx_hash: str
    status: str
    risk_score: float
    risk_level: str
    is_flagged: bool
    pattern_type: Optional[str] = None
    detection_reasons: Optional[str] = None
    timestamp: datetime
    
    source_account_number: Optional[str] = None
    source_holder_name: Optional[str] = None
    target_account_number: Optional[str] = None
    target_holder_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TransactionFilter(BaseModel):
    risk_level: Optional[str] = None
    channel: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    is_flagged: Optional[bool] = None
    account_id: Optional[int] = None
    limit: int = 50
    offset: int = 0
