
import pandas as pd


def calculate_account_features(
    transactions: pd.DataFrame
) -> pd.DataFrame:
    """
    Calculate behavioural and velocity features for every account.
    """

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

    df = df.dropna(
        subset=[
            "timestamp",
            "amount",
            "sender_id",
            "receiver_id"
        ]
    ).copy()

    accounts = (
        set(df["sender_id"]) |
        set(df["receiver_id"])
    )

    features = []

    for account in sorted(accounts):

        outgoing = df[df["sender_id"] == account].copy()
        incoming = df[df["receiver_id"] == account].copy()

        outgoing_amount = float(outgoing["amount"].sum())
        incoming_amount = float(incoming["amount"].sum())

        unique_connections = (
            set(outgoing["receiver_id"]) |
            set(incoming["sender_id"])
        )

        # Maximum incoming transactions in any 5-minute window.
        incoming_velocity = (
            incoming.set_index("timestamp")
            .sort_index()
            .resample("5min")
            .size()
            .max()
            if not incoming.empty else 0
        )

        # Maximum outgoing transactions in any 5-minute window.
        outgoing_velocity = (
            outgoing.set_index("timestamp")
            .sort_index()
            .resample("5min")
            .size()
            .max()
            if not outgoing.empty else 0
        )

        features.append({
            "account_id": account,

            "incoming_count": len(incoming),
            "outgoing_count": len(outgoing),

            "incoming_amount": incoming_amount,
            "outgoing_amount": outgoing_amount,

            "unique_connections": len(unique_connections),

            "fan_in": incoming["sender_id"].nunique(),
            "fan_out": outgoing["receiver_id"].nunique(),

            "avg_incoming_amount": (
                incoming_amount / len(incoming)
                if len(incoming) else 0
            ),

            "avg_outgoing_amount": (
                outgoing_amount / len(outgoing)
                if len(outgoing) else 0
            ),

            "max_incoming_velocity_5m": int(incoming_velocity),
            "max_outgoing_velocity_5m": int(outgoing_velocity),

            "net_flow": incoming_amount - outgoing_amount
        })

    return pd.DataFrame(features)
