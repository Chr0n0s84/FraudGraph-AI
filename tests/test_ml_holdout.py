
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

from fraudgraph.ml_detection import build_ml_features


# 1. Load dataset
dataset_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "synthetic_transactions.csv"
)

transactions = pd.read_csv(dataset_path)

# 2. Sort chronologically
transactions["timestamp"] = pd.to_datetime(
    transactions["timestamp"],
    utc=True,
    errors="coerce"
)

transactions = transactions.sort_values(
    "timestamp"
).reset_index(drop=True)

# 3. Build historical features on the full timeline
all_df, all_X = build_ml_features(transactions)

# 4. Chronological 80/20 split
split_index = int(len(all_X) * 0.80)

X_train = all_X.iloc[:split_index].copy()
X_test = all_X.iloc[split_index:].copy()

y_train = (
    all_df["is_synthetic_suspicious"]
    .iloc[:split_index]
    .astype(int)
)

y_test = (
    all_df["is_synthetic_suspicious"]
    .iloc[split_index:]
    .astype(int)
)

# 5. Train model
model = IsolationForest(
    n_estimators=200,
    contamination="auto",
    random_state=42
)

model.fit(X_train)

# 6. Calibrate threshold using training scores only
train_scores = -model.decision_function(X_train)

expected_fraction = 60 / 1060

threshold = np.quantile(
    train_scores,
    1 - expected_fraction
)

# 7. Score future testing transactions
test_scores = -model.decision_function(X_test)

predictions = (
    test_scores >= threshold
).astype(int)

# 8. Evaluate
print("\nFRAUDGRAPH AI - CHRONOLOGICAL HOLDOUT")
print("--------------------------------------")

print("Training transactions:", len(X_train))
print("Testing transactions:", len(X_test))

print("Training suspicious:", int(y_train.sum()))
print("Testing suspicious:", int(y_test.sum()))

print("Training threshold:", round(threshold, 5))

print("Predicted anomalies:", int(predictions.sum()))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, predictions))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)

print(
    "Accuracy:",
    round(accuracy_score(y_test, predictions), 4)
)

# 9. Save results
test_results = all_df.iloc[split_index:].copy()

test_results["actual_label"] = y_test.to_numpy()
test_results["anomaly_score"] = test_scores
test_results["predicted_anomaly"] = predictions

output_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "chronological_holdout_results.csv"
)

test_results.to_csv(output_path, index=False)

print("\nResults saved at:", output_path)
print("\nChronological evaluation completed!")
