from pathlib import Path
import pandas as pd

from fraudgraph.ingestion import load_transactions
from fraudgraph.features import calculate_account_features
from fraudgraph.scoring import calculate_risk_scores
from fraudgraph.mule_detection import detect_pass_through_accounts
from fraudgraph.ml_detection import detect_anomalies
from fraudgraph.graph import build_transaction_graph


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "synthetic_transactions.csv"


def get_transactions():
    """Load the project's transaction dataset."""
    return load_transactions(DATA_PATH)


def calculate_account_scores(transactions):
    """Combine transaction-level ML anomalies with account features."""

    features = calculate_account_features(transactions)

    anomaly_transactions, _ = detect_anomalies(transactions)

    sender_scores = anomaly_transactions[
        ["sender_id", "anomaly_score"]
    ].rename(columns={"sender_id": "account_id"})

    receiver_scores = anomaly_transactions[
        ["receiver_id", "anomaly_score"]
    ].rename(columns={"receiver_id": "account_id"})

    account_anomalies = (
        pd.concat([sender_scores, receiver_scores], ignore_index=True)
        .groupby("account_id", as_index=False)["anomaly_score"]
        .mean()
    )

    scores = calculate_risk_scores(
        features,
        anomaly_scores=account_anomalies,
    )

    return features, scores


def score_account(account_id):
    """Return weighted account risk details."""

    transactions = get_transactions()
    features, scores = calculate_account_scores(transactions)

    account_scores = scores[
        scores["account_id"].astype(str) == str(account_id)
    ]

    if account_scores.empty:
        raise ValueError(f"Account not found: {account_id}")

    result = account_scores.iloc[0]

    reasons = []
    if result["risk_reasons"] != "No configured signal triggered":
        reasons.extend(result["risk_reasons"].split("; "))

    mule_results = detect_pass_through_accounts(transactions)

    if not mule_results.empty:
        mule_match = mule_results[
            mule_results["account_id"].astype(str) == str(account_id)
        ]
        if not mule_match.empty:
            reasons.append(
                "Rapid incoming-to-outgoing transfers within 30 minutes"
            )

    account_features = features[
        features["account_id"].astype(str) == str(account_id)
    ].iloc[0]

    return {
        "account_id": str(account_id),
        "score": int(result["risk_score"]),
        "level": result["risk_level"],
        "reasons": reasons,
        "age_days": None,
        "counterparties": int(account_features["unique_connections"]),
    }


def build_graph():
    """Build the transaction graph in CONTRACT.md format."""

    transactions = get_transactions()
    graph = build_transaction_graph(transactions)

    _, scores = calculate_account_scores(transactions)
    score_lookup = scores.set_index("account_id").to_dict("index")

    nodes = []

    for account_id in graph.nodes():
        account_score = int(score_lookup[account_id]["risk_score"])

        if account_score >= 70:
            risk = "high"
        elif account_score >= 40:
            risk = "suspicious"
        else:
            risk = "normal"

        nodes.append({
            "id": str(account_id),
            "risk": risk,
            "score": account_score,
        })

    edges = []

    for source, target, data in graph.edges(data=True):
        edges.append({
            "source": str(source),
            "target": str(target),
            "amount": float(data["total_amount"]),
        })

    return {"nodes": nodes, "edges": edges}
