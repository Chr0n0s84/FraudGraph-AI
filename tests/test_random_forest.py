
from pathlib import Path

import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    average_precision_score,
    roc_auc_score
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

# 3. Build historical features
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

# 5. Create Random Forest model
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

# Check account overlap between training and testing

train_accounts = set(
    all_df.iloc[:split_index]["sender_account"]
) | set(
    all_df.iloc[:split_index]["receiver_account"]
)

test_accounts = set(
    all_df.iloc[split_index:]["sender_account"]
) | set(
    all_df.iloc[split_index:]["receiver_account"]
)

print(
    "Accounts appearing in both periods:",
    len(train_accounts.intersection(test_accounts))
)

# 6. Train model
train_accounts = set(
    X_train.index
)

test_accounts = set(
    X_test.index
)

print("Train/test index overlap:", len(
    train_accounts.intersection(test_accounts)
))
model.fit(X_train, y_train)

# 7. Predict on unseen test transactions
predictions = model.predict(X_test)

probabilities = model.predict_proba(X_test)[:, 1]

# 8. Evaluate
print("\nFRAUDGRAPH AI - RANDOM FOREST")
print("--------------------------------")

print("Training transactions:", len(X_train))
print("Testing transactions:", len(X_test))

print("Training suspicious:", int(y_train.sum()))
print("Testing suspicious:", int(y_test.sum()))

print("Predicted suspicious:", int(predictions.sum()))

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

print(
    "Average Precision:",
    round(average_precision_score(y_test, probabilities), 4)
)

if y_test.nunique() == 2:
    print(
        "ROC-AUC:",
        round(roc_auc_score(y_test, probabilities), 4)
    )

# 9. Display important features
importance = pd.DataFrame({
    "feature": X_train.columns,
    "importance": model.feature_importances_
}).sort_values(
    "importance",
    ascending=False
)

print("\nTop 10 Important Features:")
print(importance.head(10).to_string(index=False))

# 10. Save predictions
results = all_df.iloc[split_index:].copy()

results["actual_label"] = y_test.to_numpy()
results["predicted_label"] = predictions
results["fraud_probability"] = probabilities

output_path = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "random_forest_results.csv"
)

results.to_csv(output_path, index=False)

print("\nResults saved at:", output_path)
print("\nRandom Forest evaluation completed!")
