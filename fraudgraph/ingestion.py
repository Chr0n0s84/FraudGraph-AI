
from pathlib import Path
from typing import Union

import pandas as pd


def load_transactions(
    file_path: Union[str, Path]
) -> pd.DataFrame:

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            "Dataset not found: {}".format(path)
        )

    df = pd.read_csv(path)

    if isinstance(df, pd.Series):
        raise ValueError("Dataset must be a tabular CSV with columns.")

    df = df.copy()

    if df.empty:
        raise ValueError("Dataset is empty.")

    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()

    # Support original and normalized column names
    column_mapping = {
        "sender_account": "sender_id",
        "receiver_account": "receiver_id"
    }

    df = df.rename(columns=column_mapping)

    required_columns = [
        "transaction_id",
        "timestamp",
        "sender_id",
        "receiver_id",
        "amount",
        "channel"
    ]

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing columns: {}".format(missing_columns)
        )

    # Remove duplicate transactions
    df = df.drop_duplicates(
        subset=["transaction_id"]
    )

    # Remove incomplete records
    df = df.dropna(
        subset=required_columns
    )

    # Convert amount to numeric
    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df = df.dropna(subset=["amount"])

    # Remove negative transaction amounts
    df = df[df["amount"] >= 0]

    return pd.DataFrame(df.reset_index(drop=True))


if __name__ == "__main__":

    dataset_path = (
        Path(__file__).resolve().parent.parent
        / "data"
        / "demo_transactions.csv"
    )

    transactions = load_transactions(dataset_path)

    print("\nFRAUDGRAPH AI - DATA INGESTION")
    print("--------------------------------")

    print("Total transactions:", len(transactions))

    print("\nDataset preview:")
    print(transactions.head())

    print("\nData ingestion completed!")
