from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    account_number: str
    holder_name: str
    account_type: str = "INDIVIDUAL"
    bank_name: str = "Global Apex Bank"
    balance: float = 0.0

class AccountCreate(AccountBase):
    pass

class AccountResponse(AccountBase):
    id: int
    risk_score: float
    risk_level: str
    is_flagged: bool
    flagged_reason: Optional[str] = None
    mule_ring_id: Optional[str] = None
    is_mule: bool
    in_degree: int
    out_degree: int
    pagerank: float
    betweenness: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AccountDetailResponse(AccountResponse):
    total_inflow: float = 0.0
    total_outflow: float = 0.0
    transaction_count: int = 0
    connected_counterparties: int = 0
