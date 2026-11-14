
from pathlib import Path

from fraudgraph.ingestion import load_transactions
from fraudgraph.features import calculate_account_features
from fraudgraph.scoring import calculate_risk_scores


dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "demo_transactions.csv"
)

transactions = load_transactions(dataset_path)

features = calculate_account_features(transactions)

risk_results = calculate_risk_scores(features)

print("\nFRAUDGRAPH AI - RISK SCORING")
print("--------------------------------")

print(risk_results.to_string(index=False))

print("\nRisk scoring completed!")
