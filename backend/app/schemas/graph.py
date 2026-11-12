from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GraphNode(BaseModel):
    id: str  # e.g., "acc_10" or "ACC-83920"
    account_id: int
    account_number: str
    holder_name: str
    account_type: str
    balance: float
    risk_score: float
    risk_level: str
    is_flagged: bool
    is_mule: bool
    mule_ring_id: Optional[str] = None
    in_degree: int
    out_degree: int
    pagerank: float
    betweenness: float

class GraphEdge(BaseModel):
    id: str  # "e_1_2"
    source: str
    target: str
    amount: float
    channel: str
    tx_count: int = 1
    risk_score: float
    is_flagged: bool
    pattern_type: Optional[str] = None

class NetworkGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any]
    detected_patterns: List[Dict[str, Any]] = []

class EgoGraphRequest(BaseModel):
    account_id: int
    hops: int = 2
    min_amount: Optional[float] = 0.0
