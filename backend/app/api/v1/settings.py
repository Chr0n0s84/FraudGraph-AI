from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.setting import SystemSetting
from app.schemas.settings import SettingsUpdate
from app.core.config import settings as app_settings

router = APIRouter()

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    db_settings = db.query(SystemSetting).all()
    res = {}
    for s in db_settings:
        # Convert numeric and boolean strings
        val = s.value
        if val.lower() == "true":
            res[s.key] = True
        elif val.lower() == "false":
            res[s.key] = False
        else:
            try:
                res[s.key] = float(val) if "." in val else int(val)
            except ValueError:
                res[s.key] = val

    # Ensure defaults present
    res.setdefault("critical_threshold", app_settings.CRITICAL_RISK_THRESHOLD)
    res.setdefault("high_threshold", app_settings.HIGH_RISK_THRESHOLD)
    res.setdefault("medium_threshold", app_settings.MEDIUM_RISK_THRESHOLD)
    res.setdefault("weight_graph", app_settings.WEIGHT_GRAPH_CENTRALITY)
    res.setdefault("weight_velocity", app_settings.WEIGHT_VELOCITY)
    res.setdefault("weight_ml", app_settings.WEIGHT_ML_ANOMALY)
    res.setdefault("weight_rules", app_settings.WEIGHT_RULES_HEURISTIC)
    res.setdefault("enable_circular_rule", True)
    res.setdefault("enable_fan_in_rule", True)
    res.setdefault("enable_fan_out_rule", True)
    res.setdefault("enable_velocity_rule", True)
    res.setdefault("enable_structuring_rule", True)
    res.setdefault("simulator_interval_ms", app_settings.SIMULATOR_SPEED_MS)

    return res

@router.put("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    updates = data.dict()
    for k, v in updates.items():
        s = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        str_val = str(v).lower() if isinstance(v, bool) else str(v)
        if s:
            s.value = str_val
        else:
            db.add(SystemSetting(key=k, value=str_val))
    
    # Update runtime config
    app_settings.CRITICAL_RISK_THRESHOLD = data.critical_threshold
    app_settings.HIGH_RISK_THRESHOLD = data.high_threshold
    app_settings.MEDIUM_RISK_THRESHOLD = data.medium_threshold
    app_settings.WEIGHT_GRAPH_CENTRALITY = data.weight_graph
    app_settings.WEIGHT_VELOCITY = data.weight_velocity
    app_settings.WEIGHT_ML_ANOMALY = data.weight_ml
    app_settings.WEIGHT_RULES_HEURISTIC = data.weight_rules
    app_settings.SIMULATOR_SPEED_MS = data.simulator_interval_ms

    db.commit()
    return {"status": "success", "message": "Detection thresholds and weights updated."}

