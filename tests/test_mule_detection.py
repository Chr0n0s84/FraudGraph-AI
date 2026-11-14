
from pathlib import Path

from fraudgraph.ingestion import load_transactions
from fraudgraph.mule_detection import detect_pass_through_accounts


dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "demo_transactions.csv"
)

transactions = load_transactions(dataset_path)

results = detect_pass_through_accounts(
    transactions,
    time_window_minutes=30
)

print("\nFRAUDGRAPH AI - MULE ACCOUNT ANALYSIS")
print("--------------------------------------")

if results.empty:
    print("No pass-through patterns detected.")

else:
    print(results.to_string(index=False))

print("\nMule pattern analysis completed!")
