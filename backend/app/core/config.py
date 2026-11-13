import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "FraudGraph AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./fraudgraph.db"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Fraud Thresholds Default
    CRITICAL_RISK_THRESHOLD: int = 80
    HIGH_RISK_THRESHOLD: int = 60
    MEDIUM_RISK_THRESHOLD: int = 35
    
    # ML & Heuristic Weights
    WEIGHT_GRAPH_CENTRALITY: float = 0.25
    WEIGHT_VELOCITY: float = 0.20
    WEIGHT_ML_ANOMALY: float = 0.25
    WEIGHT_RULES_HEURISTIC: float = 0.30
    
    # Simulator Settings
    SIMULATOR_SPEED_MS: int = 2000
    AUTO_SIMULATE: bool = False

settings = Settings()

