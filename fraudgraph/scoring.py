import pandas as pd


WEIGHTS = {
    "anomaly_score": 0.25,
    "behaviour_score": 0.20,
    "velocity_score": 0.20,
    "network_score": 0.25,
    "rules_score": 0.10,
}


def calculate_risk_scores(
    features: pd.DataFrame,
    anomaly_scores: pd.DataFrame = None,
) -> pd.DataFrame:
    """Calculate weighted account-level fraud risk scores."""

    df = features.copy()

    # Attach optional account-level anomaly scores.
    if anomaly_scores is not None:
        df = df.merge(
            anomaly_scores[["account_id", "anomaly_score"]],
            on="account_id",
            how="left",
        )
    elif "anomaly_score" not in df.columns:
        df["anomaly_score"] = 0.0

    df["anomaly_score"] = (
        pd.to_numeric(df["anomaly_score"], errors="coerce")
        .fillna(0)
        .clip(0, 100)
    )

    results = []

    for _, row in df.iterrows():
        incoming = float(row.get("incoming_count", 0))
        outgoing = float(row.get("outgoing_count", 0))
        connections = float(row.get("unique_connections", 0))
        fan_in = float(row.get("fan_in", 0))
        fan_out = float(row.get("fan_out", 0))
        total_amount = (
            float(row.get("incoming_amount", 0))
            + float(row.get("outgoing_amount", 0))
        )
        velocity = max(
            float(row.get("max_incoming_velocity_5m", 0)),
            float(row.get("max_outgoing_velocity_5m", 0)),
        )

        reasons = []

        # Behaviour: pass-through activity and transaction volume.
        behaviour = min(
            100,
            (30 if incoming > 0 and outgoing > 0 else 0)
            + min(40, (incoming + outgoing) * 5)
            + (30 if incoming > 0 and outgoing >= incoming else 0),
        )

        if incoming > 0 and outgoing > 0:
            reasons.append("Incoming and outgoing activity")

        # Velocity: transaction bursts within five-minute buckets.
        velocity_score = min(100, velocity * 20)

        if velocity >= 3:
            reasons.append("High transaction velocity")

        # Network: fan-in, fan-out and unique counterparties.
        network = min(
            100,
            min(40, connections * 10)
            + min(30, fan_in * 10)
            + min(30, fan_out * 10),
        )

        if connections >= 3:
            reasons.append("High number of account connections")

        # Rules: preserve existing rule signals.
        rules = 0

        if incoming > 0 and outgoing > 0:
            rules += 30

        if connections >= 3:
            rules += 25

        if outgoing >= 3:
            rules += 20
            reasons.append("Frequent outgoing transactions")

        if total_amount >= 500:
            rules += 15
            reasons.append("High transaction throughput")

        rules = min(100, rules)

        anomaly = float(row["anomaly_score"])

        components = {
            "anomaly_score": anomaly,
            "behaviour_score": behaviour,
            "velocity_score": velocity_score,
            "network_score": network,
            "rules_score": rules,
        }

        available_components = dict(components)
        if anomaly_scores is None and "anomaly_score" not in features.columns:
            available_components.pop("anomaly_score")

        available_weight = sum(WEIGHTS[name] for name in available_components)
        final_score = round(
            sum(
                available_components[name] * WEIGHTS[name]
                for name in available_components
            ) / available_weight
        ) if available_weight else 0
        final_score = max(0, min(100, final_score))

        if final_score >= 70:
            level = "HIGH"
        elif final_score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        if anomaly > 0:
            reasons.append("Machine-learning anomaly signal")

        results.append({
            "account_id": row["account_id"],
            "risk_score": final_score,
            "risk_level": level,
            "risk_reasons": (
                "; ".join(reasons)
                if reasons else "No configured signal triggered"
            ),
            **components,
            "scoring_complete": anomaly_scores is not None
            or "anomaly_score" in features.columns,
        })

    return pd.DataFrame(results)
