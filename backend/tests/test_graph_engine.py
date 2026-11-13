import pytest
from app.engines.graph_engine import GraphEngine
from app.models.account import Account
from app.models.transaction import Transaction

def test_circular_cycle_detection():
    engine = GraphEngine()
    accounts = [
        Account(id=1, account_number="A1", holder_name="A", account_type="IND", balance=1000, risk_score=50, is_mule=True, mule_ring_id="RING1"),
        Account(id=2, account_number="A2", holder_name="B", account_type="IND", balance=1000, risk_score=50, is_mule=True, mule_ring_id="RING1"),
        Account(id=3, account_number="A3", holder_name="C", account_type="IND", balance=1000, risk_score=50, is_mule=True, mule_ring_id="RING1")
    ]
    # Cycle: 1 -> 2 -> 3 -> 1
    txs = [
        Transaction(id=1, source_account_id=1, target_account_id=2, amount=5000, channel="WIRE", risk_score=80),
        Transaction(id=2, source_account_id=2, target_account_id=3, amount=4900, channel="WIRE", risk_score=80),
        Transaction(id=3, source_account_id=3, target_account_id=1, amount=4800, channel="WIRE", risk_score=80),
    ]
    engine.build_graph(accounts, txs)
    cycles = engine.detect_circular_patterns(min_len=3, max_len=4)
    assert len(cycles) >= 1
    cycle_nodes = set(cycles[0])
    assert cycle_nodes == {1, 2, 3}

def test_fan_in_detection():
    engine = GraphEngine()
    accounts = [
        Account(id=i, account_number=f"A{i}", holder_name=f"User {i}", account_type="IND", balance=1000, risk_score=20, is_mule=False, mule_ring_id=None)
        for i in range(1, 7)
    ]
    # 5 accounts send to node 6
    txs = [
        Transaction(id=i, source_account_id=i, target_account_id=6, amount=2000, channel="WIRE", risk_score=30)
        for i in range(1, 6)
    ]
    engine.build_graph(accounts, txs)
    fan_ins = engine.detect_fan_in_nodes(min_in_degree=4)
    assert len(fan_ins) == 1
    assert fan_ins[0]["account_id"] == 6
    assert fan_ins[0]["in_degree"] == 5

