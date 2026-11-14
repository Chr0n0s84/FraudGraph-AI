
from pathlib import Path

from fraudgraph.ingestion import load_transactions
from fraudgraph.features import calculate_account_features


dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "demo_transactions.csv"
)

transactions = load_transactions(dataset_path)

features = calculate_account_features(transactions)

print("\nFRAUDGRAPH AI - ACCOUNT FEATURES")
print("--------------------------------")

print(features.to_string(index=False))

print("\nFeature engineering completed!")
