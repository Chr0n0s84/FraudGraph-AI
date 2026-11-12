from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, Base, engine
from app.schemas.settings import SimulatorControl
from app.services.simulator_service import simulator_service
from app.services.data_generator import seed_synthetic_database

router = APIRouter()

@router.get("/status")
def get_simulator_status():
    return {
        "is_running": simulator_service.is_running,
        "speed_ms": simulator_service.speed_ms
    }

@router.post("/control")
async def control_simulator(control: SimulatorControl):
    action = control.action.lower()
    simulator_service.speed_ms = control.speed_ms

    if action == "start":
        await simulator_service.start()
        return {"status": "started", "speed_ms": control.speed_ms}
    elif action == "stop":
        await simulator_service.stop()
        return {"status": "stopped"}
    elif action == "step":
        res = await simulator_service.generate_single_transaction()
        return {"status": "stepped", "transaction": res}
    return {"status": "unknown_action"}

@router.post("/reset")
async def reset_database(seed: int = 42, db: Session = Depends(get_db)):
    # Stop simulator if running
    if simulator_service.is_running:
        await simulator_service.stop()

    # Drop and recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Re-seed
    seed_synthetic_database(db, seed=seed)

    return {"status": "success", "message": "Synthetic financial database reset and re-seeded successfully."}

