import pandas as pd

from fraudgraph.features import calculate_account_features


def test_account_features_basic():
    transactions = pd.DataFrame({
        "timestamp": [
            "2026-01-01T10:00:00Z",
            "2026-01-01T10:02:00Z",
            "2026-01-01T10:03:00Z",
        ],
        "sender_id": ["A", "B", "A"],
        "receiver_id": ["C", "C", "D"],
        "amount": [100, 200, 50],
    })

    features = calculate_account_features(transactions)

    account_c = features[
        features["account_id"] == "C"
    ].iloc[0]

    assert account_c["incoming_count"] == 2
    assert account_c["incoming_amount"] == 300
    assert account_c["fan_in"] == 2