from fastapi import APIRouter
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.graph import router as graph_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.cases import router as cases_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.settings import router as settings_router
from app.api.v1.simulator import router as simulator_router

api_router = APIRouter()

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(accounts_router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(graph_router, prefix="/graph", tags=["Graph Network"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(cases_router, prefix="/cases", tags=["Case Management"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
api_router.include_router(simulator_router, prefix="/simulator", tags=["Simulator"])

