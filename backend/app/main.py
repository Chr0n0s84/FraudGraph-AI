import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.websocket_manager import ws_manager
from app.services.data_generator import seed_synthetic_database
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fraudgraph.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed baseline synthetic data
    logger.info("Initializing FraudGraph AI database schemas...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_synthetic_database(db)
    finally:
        db.close()
        
    logger.info("FraudGraph AI backend started successfully.")
    yield
    # Shutdown
    logger.info("Shutting down FraudGraph AI backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time Fraud & Mule Account Network Detection Platform API",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health Check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Live WebSocket Stream
@app.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open, client can send ping or commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection closed with error: {e}")
        ws_manager.disconnect(websocket)
