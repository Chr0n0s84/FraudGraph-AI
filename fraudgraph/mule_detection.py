
import pandas as pd


def detect_pass_through_accounts(
    transactions: pd.DataFrame,
    time_window_minutes: int = 30
) -> pd.DataFrame:

    df = transactions.copy()

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        utc=True,
        errors="coerce"
    )

    df = df.dropna(subset=["timestamp"])

    results = []

    accounts = set(df["sender_id"]) | set(df["receiver_id"])

    for account in sorted(accounts):

        incoming = df[
            df["receiver_id"] == account
        ]

        outgoing = df[
            df["sender_id"] == account
        ]

        matched_flows = []

        for _, received in incoming.iterrows():

            for _, sent in outgoing.iterrows():

                time_difference = (
                    sent["timestamp"] - received["timestamp"]
                ).total_seconds() / 60

                if 0 <= time_difference <= time_window_minutes:

                    matched_flows.append({
                        "incoming_transaction": received["transaction_id"],
                        "outgoing_transaction": sent["transaction_id"],
                        "minutes_between": round(time_difference, 2)
                    })

        if matched_flows:

            results.append({
                "account_id": account,
                "matched_flows": len(matched_flows),
                "flow_details": matched_flows,
                "investigation_flag": True
            })

    return pd.DataFrame(results)
