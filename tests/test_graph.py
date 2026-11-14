
from fraudgraph.ingestion import load_transactions
from fraudgraph.graph import (
    build_transaction_graph,
    get_graph_summary
)
from pathlib import Path


dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "demo_transactions.csv"
)

transactions = load_transactions(dataset_path)

graph = build_transaction_graph(transactions)

summary = get_graph_summary(graph)

print("\nFRAUDGRAPH AI - GRAPH NETWORK")
print("--------------------------------")

print("Total Accounts:", summary["total_accounts"])
print("Total Connections:", summary["total_connections"])

print("\nConnected Accounts:")
for connection in summary["connections"]:
    print(connection)

print("\nGraph construction completed!")
