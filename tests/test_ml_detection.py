
from pathlib import Path

import pandas as pd

from sklearn.metrics import (
    classification_report,
    confusion_matrix
)

from fraudgraph.ml_detection import detect_anomalies


dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "synthetic_transactions.csv"
)

transactions = pd.read_csv(dataset_path)

results, model = detect_anomalies(transactions)

print("\nFRAUDGRAPH AI - ISOLATION FOREST")
print("--------------------------------")

print("Total transactions:", len(results))

print(
    "Predicted anomalies:",
    int(results["anomaly_prediction"].sum())
)

print("\nTop 10 unusual transactions:")

columns = [
    "transaction_id",
    "sender_account",
    "receiver_account",
    "amount",
    "anomaly_score",
    "anomaly_prediction"
]

print(
    results[columns].head(10).to_string(index=False)
)

# Labels are used ONLY for evaluation
actual_labels = results["is_synthetic_suspicious"]
predicted_labels = results["anomaly_prediction"]

print("\nConfusion Matrix:")
print(confusion_matrix(actual_labels, predicted_labels))

print("\nClassification Report:")
print(
    classification_report(
        actual_labels,
        predicted_labels,
        zero_division=0
    )
)

# Save model results
output_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "ml_detection_results.csv"
)

results.to_csv(output_path, index=False)

print("\nResults saved at:", output_path)
print("\nML anomaly detection completed!")
