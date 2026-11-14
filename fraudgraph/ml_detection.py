
from typing import Any, cast

import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest


def build_ml_features(transactions: pd.DataFrame):
    """Create numerical features for transaction anomaly detection."""

    df = transactions.copy()

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        utc=True,
        errors="coerce"
    )

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    required_columns = [
        "timestamp",
        "amount",
        "sender_account",
        "receiver_account",
    ]

    df = df.dropna(subset=required_columns).copy()

    df["_original_order"] = np.arange(len(df))

    df = df.sort_values(["timestamp", "_original_order"], kind="mergesort").copy()

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek

    sender_group_counts = df.groupby("sender_account", sort=False).cumcount()
    receiver_group_counts = df.groupby("receiver_account", sort=False).cumcount()

    sender_cumulative_amount = df.groupby("sender_account", sort=False)["amount"].cumsum()
    receiver_cumulative_amount = df.groupby("receiver_account", sort=False)["amount"].cumsum()

    df["sender_txn_count"] = sender_group_counts
    df["receiver_txn_count"] = receiver_group_counts
    df["sender_cumulative_amount"] = sender_cumulative_amount - df["amount"]
    df["receiver_cumulative_amount"] = receiver_cumulative_amount - df["amount"]

    df["sender_avg_amount"] = (
        df["sender_cumulative_amount"] / df["sender_txn_count"].replace(0, np.nan)
    )
    df["receiver_avg_amount"] = (
        df["receiver_cumulative_amount"] / df["receiver_txn_count"].replace(0, np.nan)
    )

    sender_seen: dict[str, set[str]] = {}
    receiver_seen: dict[str, set[str]] = {}
    sender_unique_receivers: list[int] = []
    receiver_unique_senders: list[int] = []

    for sender, receiver in zip(df["sender_account"], df["receiver_account"]):
        sender_history = sender_seen.setdefault(sender, set())
        receiver_history = receiver_seen.setdefault(receiver, set())

        sender_unique_receivers.append(len(sender_history))
        receiver_unique_senders.append(len(receiver_history))

        sender_history.add(receiver)
        receiver_history.add(sender)

    df["sender_unique_receivers"] = sender_unique_receivers
    df["receiver_unique_senders"] = receiver_unique_senders

    df["sender_amount_ratio"] = (
        df["amount"] / df["sender_avg_amount"].replace(0, np.nan).clip(lower=1)
    )
    df["receiver_amount_ratio"] = (
        df["amount"] / df["receiver_avg_amount"].replace(0, np.nan).clip(lower=1)
    )

    feature_columns = [
        "amount",
        "hour",
        "day_of_week",
        "sender_txn_count",
        "sender_unique_receivers",
        "sender_avg_amount",
        "receiver_txn_count",
        "receiver_unique_senders",
        "receiver_avg_amount",
        "sender_amount_ratio",
        "receiver_amount_ratio",
    ]

    X = df[feature_columns].replace([np.inf, -np.inf], np.nan).fillna(0)

    original_index = df.index.to_numpy()
    df = df.sort_values("_original_order").drop(columns=["_original_order"]).reset_index(drop=True)
    X = X.loc[original_index].reset_index(drop=True)

    return df, X


def detect_anomalies(transactions: pd.DataFrame):

    _, X = build_ml_features(transactions)

    expected_fraction = 60 / 1060

    model = IsolationForest(
        n_estimators=200,
        contamination=cast(Any, expected_fraction),
        random_state=42,
    )

    model.fit(X)

    predictions = model.predict(X)
    anomaly_scores = -model.decision_function(X)

    df = transactions.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["timestamp", "amount", "sender_account", "receiver_account"]).copy()
    df["anomaly_prediction"] = (predictions == -1).astype(int)
    df["anomaly_score"] = anomaly_scores
    df = df.sort_values("anomaly_score", ascending=False)

    return df, model
