
from datetime import datetime, timezone

import pandas as pd

from app.core.database import SessionLocal
from app.models.account import Account
from app.models.transaction import Transaction

from fraudgraph.features import calculate_account_features
from fraudgraph.scoring import calculate_risk_scores
from fraudgraph.mule_detection import detect_pass_through_accounts
from fraudgraph.ml_detection import detect_anomalies
from fraudgraph.graph import build_transaction_graph


def get_transactions():
    """Load M1 SQL transactions into the M2 feature-engineering format."""

    db = SessionLocal()

    try:
        rows = db.query(Transaction).order_by(Transaction.timestamp).all()

        transactions = [
            {
                "transaction_id": str(tx.id),
                "timestamp": tx.timestamp,
                "sender_id": str(tx.source_account_id),
                "receiver_id": str(tx.target_account_id),
                "amount": float(tx.amount),
                "channel": tx.channel or "UNKNOWN",
            }
            for tx in rows
        ]

    finally:
        db.close()

    columns = [
        "transaction_id",
        "timestamp",
        "sender_id",
        "receiver_id",
        "amount",
        "channel",
    ]

    return pd.DataFrame(transactions, columns=columns)


def get_account_age_days(account_id):
    """Calculate account age using the M1 account creation timestamp."""

    db = SessionLocal()

    try:
        account = db.query(Account).filter(
            Account.id == int(account_id)
        ).first()

        if not account or not account.created_at:
            return None

        created_at = account.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return max(
            0,
            (datetime.now(timezone.utc) - created_at).days
        )

    finally:
        db.close()


def get_all_account_ids():
    """Return all M1 account IDs, including accounts without transactions."""

    db = SessionLocal()

    try:
        return [
            str(account_id)
            for (account_id,) in db.query(Account.id).all()
        ]

    finally:
        db.close()


def calculate_account_scores(transactions):
    """Combine transaction anomalies with account-level risk features."""

    features = calculate_account_features(transactions)

    if transactions.empty:
        return features, pd.DataFrame()

    anomaly_transactions, _ = detect_anomalies(transactions)

    sender_scores = anomaly_transactions[
        ["sender_id", "anomaly_score"]
    ].rename(columns={"sender_id": "account_id"})

    receiver_scores = anomaly_transactions[
        ["receiver_id", "anomaly_score"]
    ].rename(columns={"receiver_id": "account_id"})

    account_anomalies = (
        pd.concat(
            [sender_scores, receiver_scores],
            ignore_index=True
        )
        .groupby("account_id", as_index=False)["anomaly_score"]
        .mean()
    )

    scores = calculate_risk_scores(
        features,
        anomaly_scores=account_anomalies,
    )

    return features, scores


def score_account(account_id):
    """Return weighted risk details for an M1 account."""

    transactions = get_transactions()

    features, scores = calculate_account_scores(transactions)

    account_scores = scores[
        scores["account_id"].astype(str) == str(account_id)
    ]

    if account_scores.empty:
        if str(account_id) not in get_all_account_ids():
            raise ValueError(f"Account not found: {account_id}")

        return {
            "account_id": str(account_id),
            "score": 0,
            "level": "LOW",
            "reasons": [],
            "age_days": get_account_age_days(account_id),
            "counterparties": 0,
        }

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
        "age_days": get_account_age_days(account_id),
        "counterparties": int(account_features["unique_connections"]),
    }


def build_graph():
    """Build the M2 graph using M1 SQL transactions and accounts."""

    transactions = get_transactions()

    graph = build_transaction_graph(transactions)

    _, scores = calculate_account_scores(transactions)

    score_lookup = (
        scores.set_index("account_id").to_dict("index")
        if not scores.empty
        else {}
    )

    nodes = []

    for account_id in get_all_account_ids():

        account_score = int(
            score_lookup.get(account_id, {}).get("risk_score", 0)
        )

        if account_score >= 70:
            risk = "high"
        elif account_score >= 40:
            risk = "suspicious"
        else:
            risk = "normal"

        # Include every M1 account, even without transactions.
        graph.add_node(account_id)

        nodes.append({
            "id": account_id,
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

    return {
        "nodes": nodes,
        "edges": edges,
    }
