from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.graph import NetworkGraphResponse
from app.services.graph_service import graph_service

router = APIRouter()

@router.get("/network", response_model=NetworkGraphResponse)
def get_network_graph(
    limit_nodes: int = 80,
    risk_level: Optional[str] = None,
    only_flagged: bool = False,
    db: Session = Depends(get_db)
):
    return graph_service.get_full_network(
        db=db,
        limit_nodes=limit_nodes,
        filter_risk_level=risk_level,
        only_flagged=only_flagged
    )

@router.get("/ego/{account_id}")
def get_ego_graph(
    account_id: int,
    hops: int = Query(2, ge=1, le=4),
    db: Session = Depends(get_db)
):
    return graph_service.get_ego_graph(
        db=db,
        account_id=account_id,
        hops=hops
    )
