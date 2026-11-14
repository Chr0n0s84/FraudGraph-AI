
from pathlib import Path

from fraudgraph.ingestion import load_transactions
from fraudgraph.features import calculate_account_features
from fraudgraph.scoring import calculate_risk_scores
from fraudgraph.mule_detection import detect_pass_through_accounts
from fraudgraph.graph import build_transaction_graph


PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_PATH = PROJECT_ROOT / "data" / "synthetic_transactions.csv"


def get_transactions():
    """Load the project's transaction dataset."""
    return load_transactions(DATA_PATH)


def score_account(account_id):
    """
    Calculate rule-based risk score for an account.

    Returns account details in CONTRACT.md format.
    """

    transactions = get_transactions()

    features = calculate_account_features(transactions)
    scores = calculate_risk_scores(features)

    account_scores = scores[
        scores["account_id"] == account_id
    ]

    if account_scores.empty:
        raise ValueError(f"Account not found: {account_id}")

    result = account_scores.iloc[0]

    score = int(result["risk_score"])

    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    reasons = []

    if result["risk_reasons"] != "No configured rule triggered":
        reasons.extend(result["risk_reasons"].split("; "))

    mule_results = detect_pass_through_accounts(transactions)

    if not mule_results.empty:
        mule_match = mule_results[
            mule_results["account_id"] == account_id
        ]

        if not mule_match.empty:
            reasons.append(
                "Rapid incoming-to-outgoing transfers within 30 minutes"
            )

    account_features = features[
        features["account_id"] == account_id
    ].iloc[0]

    return {
        "account_id": str(account_id),
        "score": score,
        "level": level,
        "reasons": reasons,
        "age_days": None,
        "counterparties": int(
            account_features["unique_connections"]
        )
    }


def build_graph():
    """
    Build the transaction graph in CONTRACT.md format.
    """

    transactions = get_transactions()

    graph = build_transaction_graph(transactions)

    features = calculate_account_features(transactions)
    scores = calculate_risk_scores(features)

    score_lookup = scores.set_index("account_id").to_dict("index")

    nodes = []

    for account_id in graph.nodes():

        account_score = score_lookup[account_id]["risk_score"]

        if account_score >= 70:
            risk = "high"
        elif account_score >= 40:
            risk = "suspicious"
        else:
            risk = "normal"

        nodes.append({
            "id": str(account_id),
            "risk": risk,
            "score": int(account_score)
        })

    edges = []

    for source, target, data in graph.edges(data=True):

        edges.append({
            "source": str(source),
            "target": str(target),
            "amount": float(data["amount"])
        })

    return {
        "nodes": nodes,
        "edges": edges
    }
