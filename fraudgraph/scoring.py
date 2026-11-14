
import pandas as pd


def calculate_risk_scores(
    features: pd.DataFrame
) -> pd.DataFrame:

    results = []

    for _, row in features.iterrows():

        score = 0
        reasons = []

        # Rule 1: Pass-through activity
        if (
            row["incoming_count"] > 0
            and row["outgoing_count"] > 0
        ):
            score += 30
            reasons.append(
                "Incoming and outgoing activity"
            )

        # Rule 2: Multiple account connections
        if row["unique_connections"] >= 3:
            score += 25
            reasons.append(
                "High number of account connections"
            )

        # Rule 3: High outgoing transaction count
        if row["outgoing_count"] >= 3:
            score += 20
            reasons.append(
                "Frequent outgoing transactions"
            )

        # Rule 4: High transaction throughput
        total_amount = (
            row["incoming_amount"]
            + row["outgoing_amount"]
        )

        if total_amount >= 500:
            score += 15
            reasons.append(
                "High transaction throughput"
            )

        score = min(score, 100)

        if score >= 60:
            risk_level = "HIGH"
        elif score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        results.append({
            "account_id": row["account_id"],
            "risk_score": score,
            "risk_level": risk_level,
            "risk_reasons": (
                "; ".join(reasons)
                if reasons else "No configured rule triggered"
            )
        })

    return pd.DataFrame(results)
