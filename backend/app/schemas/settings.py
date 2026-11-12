from pydantic import BaseModel
from typing import Dict, Any

class SettingsUpdate(BaseModel):
    critical_threshold: int = 80
    high_threshold: int = 60
    medium_threshold: int = 35
    weight_graph: float = 0.25
    weight_velocity: float = 0.20
    weight_ml: float = 0.25
    weight_rules: float = 0.30
    enable_circular_rule: bool = True
    enable_fan_in_rule: bool = True
    enable_fan_out_rule: bool = True
    enable_velocity_rule: bool = True
    enable_structuring_rule: bool = True
    simulator_interval_ms: int = 2000

class SimulatorControl(BaseModel):
    action: str  # start, stop, step, reset
    speed_ms: int = 2000
