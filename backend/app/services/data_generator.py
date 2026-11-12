import random
from datetime import datetime, timedelta
import hashlib
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.models.case import Case, CaseAuditLog, CaseNote
from app.models.setting import SystemSetting
from app.engines.graph_engine import graph_engine
from app.engines.rules_engine import rules_engine
from app.engines.ml_engine import ml_engine
from app.engines.risk_engine import risk_engine
import logging

logger = logging.getLogger("fraudgraph.data_generator")

NAMES_POOL = [
    "Alexander Wright", "Elena Rostova", "Marcus Chen", "Sophia Al-Mansoor",
    "David K. Miller", "Amara Okafor", "Lucas Vance", "Chloe Dupont",
    "Vikram Patel", "Sarah Jenkins", "Tariq Sterling", "Isabella Rossi",
    "Liam O'Connor", "Mei Ling Zhang", "Nikolai Volkov", "Grace Hopper",
    "Jonah Hex", "Zane Robertson", "Maya Lin", "Julian Drake",
    "Apex Global Logistics", "Horizon Digital Media", "Nexus Cloud Corp",
    "Vanguard Asset Partners", "Titanium Holdings LLC", "Starlight Merchant Hub",
    "Silverline Payments Ltd", "Quantum Retailers Group", "Nordic Freight AS"
]

BANK_NAMES = [
    "Global Apex Bank", "Metropolitan Trust", "First Pacific Capital",
    "Nordic Union Bank", "Vanguard Financial", "Zurich Horizon Reserve",
    "Starlight NeoBank", "CryptoBridge Gateway"
]

def generate_tx_hash(src_id: int, tgt_id: int, amount: float, idx: int) -> str:
    raw = f"TX-{src_id}-{tgt_id}-{amount}-{idx}-{datetime.utcnow().timestamp()}"
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()[:24].upper()

def seed_synthetic_database(db: Session, seed: int = 42):
    """Seed the database with rich, deterministic synthetic fraud and legitimate scenarios."""
    random.seed(seed)
    
    # Check if data already exists
    if db.query(Account).count() > 0:
        logger.info("Database already seeded. Skipping initial seed.")
        return

    logger.info("Seeding deterministic synthetic financial ecosystem...")
    
    accounts: List[Account] = []
    account_lookup = {}
    
    # 1. Create Legitimate Baseline Accounts (Accounts 1 to 50)
    for i in range(1, 51):
        is_corp = i > 40
        name = NAMES_POOL[(i - 1) % len(NAMES_POOL)]
        if is_corp:
            acc_type = "CORPORATE"
            bal = random.uniform(50000.0, 350000.0)
        else:
            acc_type = "INDIVIDUAL"
            bal = random.uniform(2500.0, 45000.0)
            
        acc = Account(
            id=i,
            account_number=f"ACC-{10000 + i}",
            holder_name=name,
            account_type=acc_type,
            bank_name=BANK_NAMES[i % len(BANK_NAMES)],
            balance=round(bal, 2),
            risk_score=round(random.uniform(5.0, 25.0), 1),
            risk_level="LOW",
            is_flagged=False,
            is_mule=False
        )
        accounts.append(acc)
        account_lookup[i] = acc
        db.add(acc)

    # 2. FRAUD RING 1: Circular Money Laundering Ring (Accounts 51 to 55)
    # 5 nodes transferring in a closed circle to obscure source of funds
    ring1_names = ["Klaus Becker", "Dmitri Orlov", "Svetlana Petrova", "Chen Wei", "Victor Vance"]
    ring1_accs = []
    for idx, name in enumerate(ring1_names):
        acc_id = 51 + idx
        acc = Account(
            id=acc_id,
            account_number=f"MULE-CIRC-{idx+1:02d}",
            holder_name=f"{name} (Mule)",
            account_type="INDIVIDUAL",
            bank_name="CryptoBridge Gateway" if idx == 0 else "Starlight NeoBank",
            balance=round(random.uniform(42000.0, 58000.0), 2),
            risk_score=94.5,
            risk_level="CRITICAL",
            is_flagged=True,
            flagged_reason="Circular money laundering layering cycle participant",
            mule_ring_id="RING-01-CIRCULAR",
            is_mule=True
        )
        accounts.append(acc)
        account_lookup[acc_id] = acc
        ring1_accs.append(acc)
        db.add(acc)

    # 3. FRAUD RING 2: Fan-In Funnel Mule Ring (Accounts 56 to 64)
    # 8 feeder accounts (56-63) funneling funds into 1 central collector mule (64)
    collector_acc = Account(
        id=64,
        account_number="MULE-COLLECTOR-01",
        holder_name="Central Collector Mule (Tariq Sterling)",
        account_type="MERCHANT",
        bank_name="Metropolitan Trust",
        balance=148500.00,
        risk_score=96.0,
        risk_level="CRITICAL",
        is_flagged=True,
        flagged_reason="Central convergence node in 8-feeder Fan-In money mule network",
        mule_ring_id="RING-02-FAN-IN",
        is_mule=True
    )
    accounts.append(collector_acc)
    account_lookup[64] = collector_acc
    db.add(collector_acc)

    ring2_feeders = []
    for idx in range(8):
        acc_id = 56 + idx
        acc = Account(
            id=acc_id,
            account_number=f"MULE-FEEDER-{idx+1:02d}",
            holder_name=f"Compromised Feeder #{idx+1}",
            account_type="INDIVIDUAL",
            bank_name=BANK_NAMES[idx % len(BANK_NAMES)],
            balance=round(random.uniform(1200.0, 4500.0), 2),
            risk_score=78.0,
            risk_level="HIGH",
            is_flagged=True,
            flagged_reason="Feeder account pushing stolen funds to collector",
            mule_ring_id="RING-02-FAN-IN",
            is_mule=True
        )
        accounts.append(acc)
        account_lookup[acc_id] = acc
        ring2_feeders.append(acc)
        db.add(acc)

    # 4. FRAUD RING 3: Fan-Out Smurfing Dispersal Ring (Accounts 65 to 73)
    # 1 dirty money source account (65) dispersing micro-amounts just below $10,000 to 8 satellite mules (66-73)
    smurf_source = Account(
        id=65,
        account_number="SMURF-ORIGIN-01",
        holder_name="Shell Corp Capital (Darknet Inflow)",
        account_type="CORPORATE",
        bank_name="CryptoBridge Gateway",
        balance=280000.00,
        risk_score=97.5,
        risk_level="CRITICAL",
        is_flagged=True,
        flagged_reason="High-volume smurfing distribution source bypassing CTR limits",
        mule_ring_id="RING-03-SMURF-FAN-OUT",
        is_mule=True
    )
    accounts.append(smurf_source)
    account_lookup[65] = smurf_source
    db.add(smurf_source)

    ring3_satellites = []
    for idx in range(8):
        acc_id = 66 + idx
        acc = Account(
            id=acc_id,
            account_number=f"SMURF-DROP-{idx+1:02d}",
            holder_name=f"Mule Drop #{idx+1} ({NAMES_POOL[(idx+5)%len(NAMES_POOL)]})",
            account_type="INDIVIDUAL",
            bank_name=BANK_NAMES[(idx+2) % len(BANK_NAMES)],
            balance=round(random.uniform(9200.0, 9900.0), 2),
            risk_score=86.0,
            risk_level="CRITICAL",
            is_flagged=True,
            flagged_reason="Structured placement smurfing destination node",
            mule_ring_id="RING-03-SMURF-FAN-OUT",
            is_mule=True
        )
        accounts.append(acc)
        account_lookup[acc_id] = acc
        ring3_satellites.append(acc)
        db.add(acc)

    # 5. FRAUD RING 4: High-Velocity Rapid Drain Mule (Account 74 and targets 75-77)
    drain_mule = Account(
        id=74,
        account_number="MULE-RAPID-DRAIN",
        holder_name="Dormant Infiltrated Account (Lucas Vance)",
        account_type="INDIVIDUAL",
        bank_name="Global Apex Bank",
        balance=450.00,
        risk_score=91.0,
        risk_level="CRITICAL",
        is_flagged=True,
        flagged_reason="Reactivated dormant account with immediate multi-channel fund drain",
        mule_ring_id="RING-04-RAPID-DRAIN",
        is_mule=True
    )
    accounts.append(drain_mule)
    account_lookup[74] = drain_mule
    db.add(drain_mule)

    for idx in range(3):
        acc_id = 75 + idx
        acc = Account(
            id=acc_id,
            account_number=f"CASHOUT-ATM-{idx+1:02d}",
            holder_name=f"Crypto Cashout Target #{idx+1}",
            account_type="CRYPTO_GATEWAY",
            bank_name="CryptoBridge Gateway",
            balance=round(random.uniform(15000.0, 30000.0), 2),
            risk_score=82.0,
            risk_level="HIGH",
            is_flagged=True,
            flagged_reason="Rapid cash-out endpoint",
            mule_ring_id="RING-04-RAPID-DRAIN",
            is_mule=True
        )
        accounts.append(acc)
        account_lookup[acc_id] = acc
        db.add(acc)

    db.flush()

    # Now Generate Transactions
    transactions: List[Transaction] = []
    base_time = datetime.utcnow() - timedelta(days=2)
    tx_counter = 1

    # A. Legitimate Transactions between Accounts 1 to 50 (~140 normal transactions)
    for _ in range(140):
        src_id = random.randint(1, 50)
        tgt_id = random.randint(1, 50)
        while tgt_id == src_id:
            tgt_id = random.randint(1, 50)
            
        amt = round(random.uniform(45.0, 3500.0), 2)
        channel = random.choice(["P2P", "WIRE", "ACH"])
        timestamp = base_time + timedelta(minutes=random.randint(10, 2800))
        
        tx = Transaction(
            id=tx_counter,
            tx_hash=generate_tx_hash(src_id, tgt_id, amt, tx_counter),
            source_account_id=src_id,
            target_account_id=tgt_id,
            amount=amt,
            currency="USD",
            channel=channel,
            status="COMPLETED",
            risk_score=round(random.uniform(4.0, 22.0), 1),
            risk_level="LOW",
            is_flagged=False,
            pattern_type="NORMAL",
            detection_reasons="Normal commercial payment activity",
            timestamp=timestamp
        )
        transactions.append(tx)
        db.add(tx)
        tx_counter += 1

    # B. Ring 1 Transactions: Circular Loop (51 -> 52 -> 53 -> 54 -> 55 -> 51)
    # Repeated 3 times with slightly decaying amount (layering fee attrition)
    ring1_cycle = [51, 52, 53, 54, 55, 51]
    cycle_time = base_time + timedelta(hours=30)
    for cycle_round in range(2):
        curr_amt = 48500.0 - (cycle_round * 1200.0)
        for i in range(len(ring1_cycle) - 1):
            src_id = ring1_cycle[i]
            tgt_id = ring1_cycle[i+1]
            cycle_time += timedelta(minutes=18)
            tx = Transaction(
                id=tx_counter,
                tx_hash=generate_tx_hash(src_id, tgt_id, curr_amt, tx_counter),
                source_account_id=src_id,
                target_account_id=tgt_id,
                amount=round(curr_amt, 2),
                currency="USD",
                channel="WIRE",
                status="FLAGGED",
                risk_score=96.5,
                risk_level="CRITICAL",
                is_flagged=True,
                pattern_type="CIRCULAR_FLOW",
                detection_reasons="Circular layering cycle: Multi-hop fund routing detected back to original syndicate node",
                timestamp=cycle_time
            )
            transactions.append(tx)
            db.add(tx)
            tx_counter += 1
            curr_amt -= 350.0  # slight fee deduction

    # C. Ring 2 Transactions: Fan-In Funnel into Account 64
    fan_in_time = base_time + timedelta(hours=38)
    for feeder_id in range(56, 64):
        fan_in_time += timedelta(minutes=7)
        amt = round(random.uniform(14200.0, 18500.0), 2)
        tx = Transaction(
            id=tx_counter,
            tx_hash=generate_tx_hash(feeder_id, 64, amt, tx_counter),
            source_account_id=feeder_id,
            target_account_id=64,
            amount=amt,
            currency="USD",
            channel="WIRE",
            status="FLAGGED",
            risk_score=92.0,
            risk_level="CRITICAL",
            is_flagged=True,
            pattern_type="FAN_IN",
            detection_reasons="Fan-in convergence: 8 distinct sources pooling large funds into single collector account in <1 hr",
            timestamp=fan_in_time
        )
        transactions.append(tx)
        db.add(tx)
        tx_counter += 1

    # D. Ring 3 Transactions: Fan-Out Smurfing Dispersal from Account 65
    smurf_time = base_time + timedelta(hours=42)
    for sat_id in range(66, 74):
        smurf_time += timedelta(minutes=4)
        amt = round(random.uniform(9200.0, 9850.0), 2)  # Just under 10k!
        tx = Transaction(
            id=tx_counter,
            tx_hash=generate_tx_hash(65, sat_id, amt, tx_counter),
            source_account_id=65,
            target_account_id=sat_id,
            amount=amt,
            currency="USD",
            channel="P2P",
            status="BLOCKED" if sat_id > 71 else "FLAGGED",
            risk_score=95.0,
            risk_level="CRITICAL",
            is_flagged=True,
            pattern_type="STRUCTURING_SMURFING",
            detection_reasons="Fan-out smurfing: Near-threshold payment ($9,000-$9,999) engineered to evade CTR threshold",
            timestamp=smurf_time
        )
        transactions.append(tx)
        db.add(tx)
        tx_counter += 1

    # E. Ring 4 Transactions: Rapid Velocity Drain from Account 74
    drain_time = base_time + timedelta(hours=45)
    # First, large incoming transfer from outside
    tx_in = Transaction(
        id=tx_counter,
        tx_hash=generate_tx_hash(22, 74, 45000.0, tx_counter),
        source_account_id=22,
        target_account_id=74,
        amount=45000.0,
        currency="USD",
        channel="WIRE",
        status="FLAGGED",
        risk_score=79.0,
        risk_level="HIGH",
        is_flagged=True,
        pattern_type="RAPID_VELOCITY",
        detection_reasons="High value deposit into previously dormant personal account",
        timestamp=drain_time
    )
    transactions.append(tx_in)
    db.add(tx_in)
    tx_counter += 1

    # Immediate rapid drain to cashout accounts
    for idx in range(3):
        drain_time += timedelta(minutes=3)
        tx_out = Transaction(
            id=tx_counter,
            tx_hash=generate_tx_hash(74, 75 + idx, 14800.0, tx_counter),
            source_account_id=74,
            target_account_id=75 + idx,
            amount=14800.0,
            currency="USD",
            channel="CRYPTO_RAMP",
            status="BLOCKED",
            risk_score=94.0,
            risk_level="CRITICAL",
            is_flagged=True,
            pattern_type="RAPID_VELOCITY",
            detection_reasons="Rapid account drain: 98% of deposited funds drained to external crypto endpoints within 10 minutes",
            timestamp=drain_time
        )
        transactions.append(tx_out)
        db.add(tx_out)
        tx_counter += 1

    db.flush()

    # Build NetworkX graph & compute centrality
    graph_engine.build_graph(accounts, transactions)
    centrality = graph_engine.compute_centrality_metrics()
    for acc in accounts:
        if acc.id in centrality:
            acc.in_degree = centrality[acc.id]["in_degree"]
            acc.out_degree = centrality[acc.id]["out_degree"]
            acc.pagerank = centrality[acc.id]["pagerank"]
            acc.betweenness = centrality[acc.id]["betweenness"]
            db.add(acc)

    # Train ML Isolation Forest
    feature_matrix = []
    for tx in transactions:
        src = account_lookup.get(tx.source_account_id)
        tgt = account_lookup.get(tx.target_account_id)
        feats = ml_engine.extract_features(
            amount=tx.amount,
            channel=tx.channel,
            source_account=src,
            target_account=tgt,
            source_metrics=centrality.get(tx.source_account_id),
            target_metrics=centrality.get(tx.target_account_id)
        )
        feature_matrix.append(feats)

    ml_engine.train(feature_matrix)

    # 6. Generate Alerts
    alerts = [
        Alert(
            alert_type="CIRCULAR_LAUNDERING",
            severity="CRITICAL",
            title="Circular Money Laundering Ring Detected",
            description="5-node closed loop transaction cycle detected moving $48,500 through accounts MULE-CIRC-01 to MULE-CIRC-05.",
            account_id=51,
            transaction_id=141,
            risk_score=98.5,
            status="OPEN",
            metadata_json='{"ring_id": "RING-01-CIRCULAR", "cycle_length": 5, "total_cycled_volume": 95200.00}'
        ),
        Alert(
            alert_type="MULE_FAN_IN",
            severity="CRITICAL",
            title="Fan-In Mule Collector Funnel Activity",
            description="Collector account MULE-COLLECTOR-01 received 8 concurrent incoming transfers totalling $128,400 within 56 minutes.",
            account_id=64,
            transaction_id=152,
            risk_score=94.0,
            status="OPEN",
            metadata_json='{"ring_id": "RING-02-FAN-IN", "collector_account": 64, "feeder_count": 8}'
        ),
        Alert(
            alert_type="STRUCTURING_SMURFING",
            severity="CRITICAL",
            title="Systematic Structuring / Smurfing Fan-Out",
            description="Shell Corp Capital initiated 8 consecutive outgoing transfers between $9,200 and $9,850 to disparate accounts to circumvent CTR reporting.",
            account_id=65,
            transaction_id=160,
            risk_score=95.0,
            status="ACKNOWLEDGED",
            metadata_json='{"ring_id": "RING-03-SMURF-FAN-OUT", "structured_tx_count": 8}'
        ),
        Alert(
            alert_type="VELOCITY_ANOMALY",
            severity="HIGH",
            title="Rapid Account Depletion / Pass-Through Mule",
            description="Account ACC-74 depleted 98% of newly received wire funds into crypto gateways within 10 minutes of credit.",
            account_id=74,
            transaction_id=170,
            risk_score=89.0,
            status="OPEN",
            metadata_json='{"ring_id": "RING-04-RAPID-DRAIN", "drain_percentage": 98.2}'
        ),
        Alert(
            alert_type="STRUCTURING_THRESHOLD",
            severity="HIGH",
            title="Near-Threshold Wire Placement",
            description="Transfer of $9,820.00 flagged by heuristic rule (within 2% of $10,000 threshold).",
            account_id=66,
            transaction_id=161,
            risk_score=84.0,
            status="OPEN",
            metadata_json='{"threshold_evasion": true}'
        )
    ]
    for a in alerts:
        db.add(a)

    # 7. Generate Initial Cases for Investigator Workspace
    case1 = Case(
        case_number="CASE-2026-0819",
        title="Syndicate Alpha: 5-Node Circular Layering Ring",
        description="Complex multi-hop layering ring moving illicit wire transfers across 5 neo-bank accounts to obfuscate source of funds.",
        status="INVESTIGATING",
        priority="CRITICAL",
        assigned_to="Lead Analyst Sarah Jenkins",
        risk_score=98.5,
        target_account_id=51,
        mule_ring_id="RING-01-CIRCULAR",
        evidence_summary="Graph cycle analysis confirmed directed cycle (51 -> 52 -> 53 -> 54 -> 55 -> 51). Fund attrition of 0.7% per hop matches professional money laundering commission structure."
    )
    db.add(case1)
    db.flush()

    # Case 1 audit log & notes
    db.add(CaseAuditLog(
        case_id=case1.id,
        action="CREATED",
        author="FraudGraph Automated Engine",
        details="Automated case created following CRITICAL circular laundering alert."
    ))
    db.add(CaseAuditLog(
        case_id=case1.id,
        action="ASSIGNED",
        author="Supervisor Marcus Chen",
        details="Assigned to Lead Analyst Sarah Jenkins for expedited FIU review."
    ))
    db.add(CaseNote(
        case_id=case1.id,
        author="Sarah Jenkins",
        note="Initial graph topology confirms synthetic identities used to open accounts MULE-CIRC-02 and MULE-CIRC-04. Recommend immediate temporary debit freeze."
    ))

    case2 = Case(
        case_number="CASE-2026-0820",
        title="Smurfing Operation: Shell Corp Structured Dispersal",
        description="Investigation into Shell Corp Capital dispersing $76,000 via 8 transactions just under $10,000 CTR limit.",
        status="OPEN",
        priority="HIGH",
        assigned_to="Analyst David Miller",
        risk_score=92.0,
        target_account_id=65,
        mule_ring_id="RING-03-SMURF-FAN-OUT",
        evidence_summary="8 transactions between $9,200 and $9,850 completed within 32 minutes across multiple banking rails."
    )
    db.add(case2)
    db.flush()

    db.add(CaseAuditLog(
        case_id=case2.id,
        action="CREATED",
        author="FraudGraph Automated Engine",
        details="Case generated from high-confidence structuring heuristic."
    ))
    db.add(CaseNote(
        case_id=case2.id,
        author="David Miller",
        note="Requested SAR (Suspicious Activity Report) draft. Counterparty IP addresses correlate with proxy VPN exit nodes."
    ))

    # 8. Initial System Settings
    settings_list = [
        SystemSetting(key="critical_threshold", value="80", description="Threshold score for CRITICAL risk categorization"),
        SystemSetting(key="high_threshold", value="60", description="Threshold score for HIGH risk categorization"),
        SystemSetting(key="medium_threshold", value="35", description="Threshold score for MEDIUM risk categorization"),
        SystemSetting(key="weight_graph", value="0.25", description="Weight of Graph Centrality & Ring Topology in risk formula"),
        SystemSetting(key="weight_velocity", value="0.20", description="Weight of Transaction Velocity in risk formula"),
        SystemSetting(key="weight_ml", value="0.25", description="Weight of Isolation Forest Anomaly in risk formula"),
        SystemSetting(key="weight_rules", value="0.30", description="Weight of Expert AML Typologies in risk formula"),
        SystemSetting(key="enable_circular_rule", value="true", description="Enable circular layering graph detection"),
        SystemSetting(key="enable_fan_in_rule", value="true", description="Enable fan-in mule funnel detection"),
        SystemSetting(key="enable_fan_out_rule", value="true", description="Enable fan-out smurfing detection"),
        SystemSetting(key="enable_velocity_rule", value="true", description="Enable rapid velocity burst detection"),
        SystemSetting(key="enable_structuring_rule", value="true", description="Enable CTR evasion structuring detection"),
        SystemSetting(key="simulator_speed_ms", value="2000", description="Simulation generation interval in milliseconds")
    ]
    for s in settings_list:
        db.add(s)

    db.commit()
    logger.info(f"Synthetic financial ecosystem seeded successfully: {len(accounts)} accounts, {len(transactions)} transactions, {len(alerts)} alerts, {2} cases.")
