import pandas as pd

from fraudgraph.graph import build_transaction_graph


def test_repeated_transactions_are_aggregated():
    transactions = pd.DataFrame([
        {
            "transaction_id": "tx1",
            "sender_id": "A",
            "receiver_id": "B",
            "amount": 100.0,
            "channel": "UPI",
            "timestamp": "2026-01-01T10:00:00Z",
        },
        {
            "transaction_id": "tx2",
            "sender_id": "A",
            "receiver_id": "B",
            "amount": 250.0,
            "channel": "card",
            "timestamp": "2026-01-01T10:02:00Z",
        },
    ])

    graph = build_transaction_graph(transactions)

    edge = graph["A"]["B"]

    assert graph.number_of_edges() == 1
    assert edge["transaction_count"] == 2
    assert edge["total_amount"] == 350.0
    assert edge["amount"] == 350.0
    assert len(edge["transactions"]) == 2
