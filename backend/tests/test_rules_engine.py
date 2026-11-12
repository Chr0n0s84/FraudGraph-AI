import pytest
from app.engines.rules_engine import rules_engine
from app.models.account import Account
from app.models.transaction import Transaction

def test_structuring_threshold_detection():
    src = Account(id=1, account_number="ACC-1", balance=50000.0, is_mule=False)
    tgt = Account(id=2, account_number="ACC-2", balance=1000.0, is_mule=False)
    
    # 9,800 is just below 10k CTR threshold
    eval_res = rules_engine.evaluate_transaction(
        amount=9800.0,
        channel="WIRE",
        source_account=src,
        target_account=tgt,
        source_recent_txs=[],
        target_recent_txs=[]
    )
    assert eval_res["is_flagged"] is True
    assert eval_res["primary_pattern"] == "STRUCTURING_SMURFING"
    assert any("Structuring" in r for r in eval_res["reasons"])

def test_normal_transaction():
    src = Account(id=1, account_number="ACC-1", balance=50000.0, is_mule=False)
    tgt = Account(id=2, account_number="ACC-2", balance=1000.0, is_mule=False)
    
    eval_res = rules_engine.evaluate_transaction(
        amount=250.0,
        channel="P2P",
        source_account=src,
        target_account=tgt,
        source_recent_txs=[],
        target_recent_txs=[]
    )
    assert eval_res["is_flagged"] is False
    assert eval_res["primary_pattern"] == "NORMAL"
