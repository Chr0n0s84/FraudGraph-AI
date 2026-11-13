from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.engines.graph_engine import graph_engine
import networkx as nx

class GraphService:
    """Service to fetch and format graph network data for the UI."""

    def get_full_network(
        self,
        db: Session,
        limit_nodes: int = 100,
        filter_risk_level: Optional[str] = None,
        only_flagged: bool = False
    ) -> Dict[str, Any]:
        query = db.query(Account)
        if filter_risk_level and filter_risk_level != "ALL":
            query = query.filter(Account.risk_level == filter_risk_level)
        if only_flagged:
            query = query.filter(Account.is_flagged == True)

        accounts = query.limit(limit_nodes).all()
        account_ids = {a.id for a in accounts}

        # Fetch transactions connecting these accounts
        transactions = db.query(Transaction).filter(
            Transaction.source_account_id.in_(account_ids),
            Transaction.target_account_id.in_(account_ids)
        ).order_by(Transaction.timestamp.desc()).limit(300).all()

        nodes = []
        for acc in accounts:
            nodes.append({
                "id": f"acc_{acc.id}",
                "account_id": acc.id,
                "account_number": acc.account_number,
                "holder_name": acc.holder_name,
                "account_type": acc.account_type,
                "balance": acc.balance,
                "risk_score": acc.risk_score,
                "risk_level": acc.risk_level,
                "is_flagged": acc.is_flagged,
                "is_mule": acc.is_mule,
                "mule_ring_id": acc.mule_ring_id,
                "in_degree": acc.in_degree,
                "out_degree": acc.out_degree,
                "pagerank": acc.pagerank,
                "betweenness": acc.betweenness
            })

        # Consolidate directed edges
        edge_map = {}
        for tx in transactions:
            key = f"{tx.source_account_id}->{tx.target_account_id}"
            if key not in edge_map:
                edge_map[key] = {
                    "id": f"e_{tx.source_account_id}_{tx.target_account_id}",
                    "source": f"acc_{tx.source_account_id}",
                    "target": f"acc_{tx.target_account_id}",
                    "amount": tx.amount,
                    "channel": tx.channel,
                    "tx_count": 1,
                    "risk_score": tx.risk_score,
                    "is_flagged": tx.is_flagged,
                    "pattern_type": tx.pattern_type
                }
            else:
                edge_map[key]["amount"] += tx.amount
                edge_map[key]["tx_count"] += 1
                if tx.risk_score > edge_map[key]["risk_score"]:
                    edge_map[key]["risk_score"] = tx.risk_score
                if tx.is_flagged:
                    edge_map[key]["is_flagged"] = True
                if tx.pattern_type and tx.pattern_type != "NORMAL":
                    edge_map[key]["pattern_type"] = tx.pattern_type

        edges = list(edge_map.values())

        # Patterns detected by graph engine
        clusters = graph_engine.get_mule_clusters()
        cycles = graph_engine.detect_circular_patterns()
        fan_ins = graph_engine.detect_fan_in_nodes()
        fan_outs = graph_engine.detect_fan_out_nodes()

        detected_patterns = []
        for c in clusters:
            detected_patterns.append({
                "type": "MULE_CLUSTER",
                "label": f"Mule Ring: {c['cluster_id']}",
                "node_count": c["node_count"],
                "total_volume": c["total_volume"],
                "nodes": [f"acc_{n}" for n in c["nodes"]]
            })
        for cyc in cycles:
            detected_patterns.append({
                "type": "CIRCULAR_FLOW",
                "label": f"Circular Cycle ({len(cyc)} Hops)",
                "node_count": len(cyc),
                "nodes": [f"acc_{n}" for n in cyc]
            })

        stats = {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "flagged_nodes": sum(1 for n in nodes if n["is_flagged"]),
            "mule_clusters_found": len(clusters),
            "cycles_found": len(cycles),
            "fan_in_nodes": len(fan_ins),
            "fan_out_nodes": len(fan_outs)
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "detected_patterns": detected_patterns
        }

    def get_ego_graph(self, db: Session, account_id: int, hops: int = 2) -> Dict[str, Any]:
        """Extract k-hop ego network around a specific account."""
        target = db.query(Account).filter(Account.id == account_id).first()
        if not target:
            return {"nodes": [], "edges": [], "stats": {}, "detected_patterns": []}

        # If graph engine is loaded, use it; else fallback
        ego_node_ids, _ = graph_engine.get_ego_subgraph(account_id, hops=hops)
        if not ego_node_ids:
            ego_node_ids = [account_id]

        accounts = db.query(Account).filter(Account.id.in_(ego_node_ids)).all()
        transactions = db.query(Transaction).filter(
            Transaction.source_account_id.in_(ego_node_ids),
            Transaction.target_account_id.in_(ego_node_ids)
        ).all()

        nodes = []
        for acc in accounts:
            nodes.append({
                "id": f"acc_{acc.id}",
                "account_id": acc.id,
                "account_number": acc.account_number,
                "holder_name": acc.holder_name,
                "account_type": acc.account_type,
                "balance": acc.balance,
                "risk_score": acc.risk_score,
                "risk_level": acc.risk_level,
                "is_flagged": acc.is_flagged,
                "is_mule": acc.is_mule,
                "mule_ring_id": acc.mule_ring_id,
                "in_degree": acc.in_degree,
                "out_degree": acc.out_degree,
                "pagerank": acc.pagerank,
                "betweenness": acc.betweenness,
                "is_focus": acc.id == account_id
            })

        edges = []
        for tx in transactions:
            edges.append({
                "id": f"e_tx_{tx.id}",
                "source": f"acc_{tx.source_account_id}",
                "target": f"acc_{tx.target_account_id}",
                "amount": tx.amount,
                "channel": tx.channel,
                "tx_count": 1,
                "risk_score": tx.risk_score,
                "is_flagged": tx.is_flagged,
                "pattern_type": tx.pattern_type
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "focus_account": target.account_number,
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "max_hops": hops
            },
            "detected_patterns": []
        }

graph_service = GraphService()

