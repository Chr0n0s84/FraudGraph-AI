import pytest
from app.core.database import SessionLocal, Base, engine
from app.services.data_generator import seed_synthetic_database
from app.api.v1.dashboard import get_dashboard_summary
from app.api.v1.accounts import list_accounts, get_account_detail
from app.api.v1.transactions import list_transactions, get_transaction_detail
from app.api.v1.graph import get_network_graph, get_ego_graph
from app.api.v1.alerts import list_alerts
from app.api.v1.cases import list_cases

@pytest.fixture(scope="session", autouse=True)
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_synthetic_database(db)
    db.close()

def test_dashboard_summary_endpoint():
    db = SessionLocal()
    try:
        summary = get_dashboard_summary(db=db)
        assert summary.total_transactions > 0
        assert summary.total_accounts > 0
        assert summary.flagged_accounts > 0
        assert summary.active_mule_rings >= 1
        assert "CRITICAL" in summary.risk_distribution
        assert len(summary.top_suspicious_accounts) > 0
    finally:
        db.close()

def test_accounts_endpoint():
    db = SessionLocal()
    try:
        accounts = list_accounts(db=db, limit=10)
        assert len(accounts) == 10
        # Detail
        acc_detail = get_account_detail(accounts[0].id, db=db)
        assert acc_detail.id == accounts[0].id
        assert acc_detail.transaction_count >= 0
    finally:
        db.close()

def test_transactions_endpoint():
    db = SessionLocal()
    try:
        txs = list_transactions(db=db, limit=10)
        assert len(txs) == 10
        # Check first tx has explainability breakdown
        first_tx = get_transaction_detail(txs[0]["id"], db=db)
        assert "risk_breakdown" in first_tx
        assert "factors" in first_tx["risk_breakdown"]
    finally:
        db.close()

def test_graph_network_endpoint():
    db = SessionLocal()
    try:
        graph_data = get_network_graph(limit_nodes=50, db=db)
        assert "nodes" in graph_data
        assert "edges" in graph_data
        assert len(graph_data["nodes"]) > 0
        assert len(graph_data["edges"]) > 0
        assert graph_data["stats"]["total_nodes"] > 0
    finally:
        db.close()

def test_alerts_and_cases_endpoint():
    db = SessionLocal()
    try:
        alerts = list_alerts(db=db, limit=5)
        assert len(alerts) > 0
        cases = list_cases(db=db)
        assert len(cases) > 0
    finally:
        db.close()
