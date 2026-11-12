import networkx as nx
from typing import List, Dict, Any, Tuple, Set
import logging

logger = logging.getLogger("fraudgraph.engine.graph")

class GraphEngine:
    """
    NetworkX-based graph analysis engine for financial transaction networks.
    Computes graph metrics, detects cycles (circular money laundering),
    fan-in / fan-out topologies, and community clusters.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_graph(self, accounts: List[Any], transactions: List[Any]):
        """Build or rebuild directed graph from accounts and transactions."""
        self.graph.clear()
        
        # Add account nodes with metadata
        for acc in accounts:
            self.graph.add_node(
                acc.id,
                account_number=acc.account_number,
                holder_name=acc.holder_name,
                account_type=acc.account_type,
                balance=acc.balance,
                risk_score=acc.risk_score,
                is_mule=acc.is_mule,
                mule_ring_id=acc.mule_ring_id
            )
            
        # Add transaction edges
        for tx in transactions:
            if self.graph.has_edge(tx.source_account_id, tx.target_account_id):
                # Accumulate volume and tx count
                self.graph[tx.source_account_id][tx.target_account_id]["amount"] += tx.amount
                self.graph[tx.source_account_id][tx.target_account_id]["tx_count"] += 1
                self.graph[tx.source_account_id][tx.target_account_id]["transactions"].append(tx.id)
            else:
                self.graph.add_edge(
                    tx.source_account_id,
                    tx.target_account_id,
                    amount=tx.amount,
                    tx_count=1,
                    channel=tx.channel,
                    risk_score=tx.risk_score,
                    transactions=[tx.id]
                )

    def compute_centrality_metrics(self) -> Dict[int, Dict[str, float]]:
        """Compute in-degree, out-degree, PageRank, and betweenness centrality."""
        if len(self.graph) == 0:
            return {}

        try:
            pagerank = nx.pagerank(self.graph, weight="amount", alpha=0.85, max_iter=200)
        except Exception:
            pagerank = {n: 0.0 for n in self.graph.nodes()}

        try:
            betweenness = nx.betweenness_centrality(self.graph, weight="amount", normalized=True)
        except Exception:
            betweenness = {n: 0.0 for n in self.graph.nodes()}

        metrics = {}
        for node in self.graph.nodes():
            in_deg = self.graph.in_degree(node)
            out_deg = self.graph.out_degree(node)
            metrics[node] = {
                "in_degree": in_deg,
                "out_degree": out_deg,
                "pagerank": round(pagerank.get(node, 0.0) * 100, 4),
                "betweenness": round(betweenness.get(node, 0.0) * 100, 4),
            }
        return metrics

    def detect_circular_patterns(self, min_len: int = 3, max_len: int = 6) -> List[List[int]]:
        """
        Detect directed cycles representing circular money movement / layering.
        e.g., A -> B -> C -> A or A -> B -> C -> D -> A.
        """
        if len(self.graph) == 0:
            return []

        cycles = []
        try:
            # simple_cycles finds elementary circuits
            for cycle in nx.simple_cycles(self.graph):
                if min_len <= len(cycle) <= max_len:
                    cycles.append(cycle)
                if len(cycles) >= 50:  # limit computation
                    break
        except Exception as e:
            logger.warning(f"Error detecting cycles: {e}")
        return cycles

    def detect_fan_in_nodes(self, min_in_degree: int = 4, in_out_ratio: float = 2.5) -> List[Dict[str, Any]]:
        """
        Detect Fan-In topology (Funnel account / Aggregator mule):
        Many different accounts sending funds to one destination node.
        """
        fan_ins = []
        for node in self.graph.nodes():
            in_deg = self.graph.in_degree(node)
            out_deg = self.graph.out_degree(node)
            if in_deg >= min_in_degree and (out_deg == 0 or (in_deg / max(1, out_deg)) >= in_out_ratio):
                total_inflow = sum(
                    data["amount"] for _, _, data in self.graph.in_edges(node, data=True)
                )
                sources = [u for u, _ in self.graph.in_edges(node)]
                fan_ins.append({
                    "account_id": node,
                    "in_degree": in_deg,
                    "out_degree": out_deg,
                    "total_inflow": total_inflow,
                    "sources": sources
                })
        return fan_ins

    def detect_fan_out_nodes(self, min_out_degree: int = 4, out_in_ratio: float = 2.5) -> List[Dict[str, Any]]:
        """
        Detect Fan-Out topology (Smurfing / Cash-out mule):
        One account disbursing money to many different accounts.
        """
        fan_outs = []
        for node in self.graph.nodes():
            in_deg = self.graph.in_degree(node)
            out_deg = self.graph.out_degree(node)
            if out_deg >= min_out_degree and (in_deg == 0 or (out_deg / max(1, in_deg)) >= out_in_ratio):
                total_outflow = sum(
                    data["amount"] for _, _, data in self.graph.out_edges(node, data=True)
                )
                targets = [v for _, v in self.graph.out_edges(node)]
                fan_outs.append({
                    "account_id": node,
                    "in_degree": in_deg,
                    "out_degree": out_deg,
                    "total_outflow": total_outflow,
                    "targets": targets
                })
        return fan_outs

    def get_ego_subgraph(self, account_id: int, hops: int = 2) -> Tuple[List[int], List[Tuple[int, int]]]:
        """Extract k-hop neighborhood around a focal account."""
        if account_id not in self.graph:
            return ([account_id], [])
        
        # Undirected view for neighborhood hops
        undirected = self.graph.to_undirected(as_view=True)
        try:
            subgraph_nodes = set(nx.single_source_shortest_path_length(undirected, account_id, cutoff=hops).keys())
        except Exception:
            subgraph_nodes = {account_id}
            
        subgraph = self.graph.subgraph(subgraph_nodes)
        return (list(subgraph.nodes()), list(subgraph.edges()))

    def get_mule_clusters(self) -> List[Dict[str, Any]]:
        """Identify dense connected components of suspicious/mule activity."""
        if len(self.graph) == 0:
            return []
        
        clusters = []
        # Weakly connected components
        components = list(nx.weakly_connected_components(self.graph))
        cluster_idx = 1
        for comp in components:
            if len(comp) >= 3:
                sub = self.graph.subgraph(comp)
                total_volume = sum(d.get("amount", 0) for _, _, d in sub.edges(data=True))
                # Count flagged or high risk nodes
                suspicious_count = 0
                for n in comp:
                    if sub.nodes[n].get("risk_score", 0) >= 60 or sub.nodes[n].get("is_mule", False):
                        suspicious_count += 1
                        
                if suspicious_count >= 2:
                    clusters.append({
                        "cluster_id": f"RING-CLUSTER-{cluster_idx:02d}",
                        "node_count": len(comp),
                        "nodes": list(comp),
                        "edge_count": sub.number_of_edges(),
                        "total_volume": round(total_volume, 2),
                        "suspicious_nodes": suspicious_count,
                        "risk_level": "CRITICAL" if suspicious_count >= 3 else "HIGH"
                    })
                    cluster_idx += 1
        return clusters

graph_engine = GraphEngine()
