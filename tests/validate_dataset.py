
import pandas as pd
from pathlib import Path

path = Path("data/synthetic_transactions.csv")

df = pd.read_csv(path)

print("\nFRAUDGRAPH AI - DATASET VALIDATION")
print("----------------------------------")

print("Total rows:", len(df))

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate transaction IDs:")
print(df["transaction_id"].duplicated().sum())

print("\nLabel distribution:")
print(df["is_synthetic_suspicious"].value_counts())

print("\nUnique accounts:")

accounts = (
    set(df["sender_account"])
    | set(df["receiver_account"])
)

print(len(accounts))

print("\nAmount validation:")
print("Negative amounts:", (df["amount"] < 0).sum())

print("\nDataset validation completed!")
