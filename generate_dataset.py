
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd


random.seed(42)

transactions = []

BASE_TIME = datetime(
    2024, 1, 1, 9, 0,
    tzinfo=timezone.utc
)

NORMAL_COUNT = 1000
MULE_COUNT = 5
FLOWS_PER_MULE = 6


def add_transaction(
    transaction_id,
    timestamp,
    sender,
    receiver,
    amount,
    channel,
    suspicious,
    pattern
):
    transactions.append({
        "transaction_id": transaction_id,
        "timestamp": timestamp.strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "sender_account": sender,
        "receiver_account": receiver,
        "amount": round(amount, 2),
        "channel": channel,
        "is_synthetic_suspicious": suspicious,
        "pattern_type": pattern
    })


# --------------------------------
# 1. Generate normal transactions
# --------------------------------

normal_accounts = [
    "acct_N{:03d}".format(i)
    for i in range(1, 81)
]

channels = ["UPI", "card", "bank_transfer"]

for i in range(NORMAL_COUNT):

    sender = random.choice(normal_accounts)
    receiver = random.choice(normal_accounts)

    while receiver == sender:
        receiver = random.choice(normal_accounts)

    timestamp = BASE_TIME + timedelta(
        days=random.randint(0, 29),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )

    amount = random.uniform(50, 5000)

    add_transaction(
        "normal_{:04d}".format(i + 1),
        timestamp,
        sender,
        receiver,
        amount,
        random.choice(channels),
        0,
        "normal"
    )



# --------------------------------
# 2. Generate synthetic mule flows
# --------------------------------

suspicious_id = 1

for mule_number in range(1, MULE_COUNT + 1):

    mule_account = "acct_M{:03d}".format(mule_number)

    for flow_number in range(FLOWS_PER_MULE):

        source = "acct_SRC_{:03d}".format(
            (mule_number - 1) * FLOWS_PER_MULE
            + flow_number + 1
        )

        destination = "acct_DST_{:03d}".format(
            (mule_number - 1) * FLOWS_PER_MULE
            + flow_number + 1
        )

        received_amount = random.uniform(1000, 10000)

        # Spread flows across January
        flow_day = (
            (mule_number - 1) * FLOWS_PER_MULE
            + flow_number
        ) * 29 // (MULE_COUNT * FLOWS_PER_MULE - 1)
        print(
            "Mule:", mule_number,
            "Flow:", flow_number,
            "Day:", flow_day
        )
        received_time = BASE_TIME + timedelta(
            days=flow_day,
            hours=random.randint(0, 20),
            minutes=random.randint(0, 59)
        )

        sent_time = received_time + timedelta(minutes=7)

        sent_amount = received_amount * 0.95

        add_transaction(
            "suspicious_{:03d}".format(suspicious_id),
            received_time,
            source,
            mule_account,
            received_amount,
            "UPI",
            1,
            "rapid_pass_through"
        )

        suspicious_id += 1

        add_transaction(
            "suspicious_{:03d}".format(suspicious_id),
            sent_time,
            mule_account,
            destination,
            sent_amount,
            "UPI",
            1,
            "rapid_pass_through"
        )

        suspicious_id += 1



# --------------------------------
# 3. Save dataset
# --------------------------------

df = pd.DataFrame(transactions)

df = df.sort_values(
    "timestamp"
).reset_index(drop=True)

output_directory = Path("data")
output_directory.mkdir(exist_ok=True)

output_path = output_directory / "synthetic_transactions.csv"

df.to_csv(output_path, index=False)

print("\nFRAUDGRAPH AI - SYNTHETIC DATASET")
print("----------------------------------")

print("Total transactions:", len(df))

print(
    "Normal transactions:",
    int((df["is_synthetic_suspicious"] == 0).sum())
)

print(
    "Synthetic suspicious transactions:",
    int((df["is_synthetic_suspicious"] == 1).sum())
)

print(
    "Unique accounts:",
    len(set(df["sender_account"]) |
        set(df["receiver_account"]))
)

print("\nPattern distribution:")
print(df["pattern_type"].value_counts())

print("\nDataset preview:")
print(df.head())

print("\nDataset saved at:", output_path)
print("\nDataset generation completed!")
