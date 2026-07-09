"""
mobility.py — Dynamic UE Mobility Engine for the 5G Nexus Orchestrator.

Manages smooth, physics-based movement for all UEs in the simulation.
Runs inside the existing core_loop() in nexus_core.py.
"""

import math
import random
from typing import Dict, Tuple

# Simulation coordinate space is 1000x1000
MAP_WIDTH = 1000
MAP_HEIGHT = 1000
BOUNDARY_MARGIN = 60  # UEs stay inside this margin so they're always visible

# Mobility profile speeds (simulation units per second)
# The simulation area is 1000x1000, so these are tuned for visual clarity
MOBILITY_PROFILES = {
    "pedestrian": {
        "speed_min": 15,   # ~1–2 m/s equivalent
        "speed_max": 25,
    },
    "vehicle": {
        "speed_min": 60,   # ~8–15 m/s equivalent
        "speed_max": 100,
    },
    "high_speed": {
        "speed_min": 130,  # ~20–30 m/s equivalent
        "speed_max": 180,
    },
}

# Default profile per slice type
SLICE_PROFILE_MAP = {
    "URLLC": "vehicle",      # Autonomous cars — fast but not high-speed for visibility
    "eMBB": "pedestrian",    # VR headset users — walking around
    "mMTC": "pedestrian",    # IoT sensors — very slow, almost stationary
}


class UEMobility:
    """
    Tracks the movement state of a single UE.
    Uses a waypoint-steering model: the UE steers smoothly towards a target
    waypoint, then picks a new one on arrival.
    """

    def __init__(self, client_id: str, x: float, y: float, slice_type: str):
        self.client_id = client_id
        self.x = float(x)
        self.y = float(y)
        self.slice_type = slice_type

        # Assign mobility profile
        profile_name = SLICE_PROFILE_MAP.get(slice_type, "pedestrian")
        # mMTC sensors have a chance of being nearly stationary
        if slice_type == "mMTC" and random.random() < 0.5:
            self.speed = random.uniform(3, 8)
        else:
            profile = MOBILITY_PROFILES[profile_name]
            self.speed = random.uniform(profile["speed_min"], profile["speed_max"])

        # Direction as a unit vector (vx, vy)
        angle = random.uniform(0, 2 * math.pi)
        self.vx = math.cos(angle)
        self.vy = math.sin(angle)

        # Pick an initial random waypoint
        self.waypoint_x, self.waypoint_y = self._random_waypoint()

        # Turn rate: how fast the UE can steer towards its waypoint (radians/s)
        self.turn_rate = random.uniform(1.5, 3.0)

    def _random_waypoint(self) -> Tuple[float, float]:
        """Pick a random point in an orbital ring around the center (gNodeB)."""
        angle = random.uniform(0, 2 * math.pi)
        # Stay in the middle of the beam's visual range
        radius = random.uniform(250, 350)
        wx = 500 + math.cos(angle) * radius
        wy = 500 + math.sin(angle) * radius
        return wx, wy

    def _distance_to_waypoint(self) -> float:
        dx = self.waypoint_x - self.x
        dy = self.waypoint_y - self.y
        return math.sqrt(dx * dx + dy * dy)

    def tick(self, dt: float):
        """
        Advance position by one time step dt (seconds).
        Steers smoothly towards waypoint, bounces off walls.
        """
        # If close enough to waypoint, pick a new one
        if self._distance_to_waypoint() < 20.0:
            self.waypoint_x, self.waypoint_y = self._random_waypoint()

        # Desired direction towards waypoint
        dx = self.waypoint_x - self.x
        dy = self.waypoint_y - self.y
        dist = math.sqrt(dx * dx + dy * dy)
        if dist > 0:
            desired_vx = dx / dist
            desired_vy = dy / dist
        else:
            desired_vx, desired_vy = self.vx, self.vy

        # Gradually steer current direction towards desired direction
        # Blend factor: small dt → small turn
        alpha = min(1.0, self.turn_rate * dt)
        self.vx = self.vx + alpha * (desired_vx - self.vx)
        self.vy = self.vy + alpha * (desired_vy - self.vy)

        # Re-normalize velocity to unit vector
        mag = math.sqrt(self.vx * self.vx + self.vy * self.vy)
        if mag > 0:
            self.vx /= mag
            self.vy /= mag

        # Move
        self.x += self.vx * self.speed * dt
        self.y += self.vy * self.speed * dt

        # Constrain to the orbital ring (don't let them wander too close to center or too far)
        # This replaces the old square boundary clamping
        dx_center = self.x - 500
        dy_center = self.y - 500
        dist_center = math.sqrt(dx_center * dx_center + dy_center * dy_center)
        
        if dist_center < 150 or dist_center > 450:
            # If they drift too far out or too far in, force a new waypoint 
            # and gently push velocity towards the ring
            self.waypoint_x, self.waypoint_y = self._random_waypoint()
            # Nudge them towards the new valid waypoint immediately
            nx = self.waypoint_x - self.x
            ny = self.waypoint_y - self.y
            ndist = math.sqrt(nx * nx + ny * ny)
            if ndist > 0:
                self.vx = nx / ndist
                self.vy = ny / ndist

    @property
    def position(self) -> Tuple[float, float]:
        return (self.x, self.y)


class MobilityEngine:
    """
    Manages mobility for all active UEs.
    Called once per simulation tick from nexus_core.py's core_loop().
    Mutates client_positions in-place so that the rest of the pipeline
    (BeamformingEngine, WebSocket broadcast) automatically uses updated coords.
    """

    def __init__(self):
        self._ues: Dict[str, UEMobility] = {}

    def register(self, client_id: str, x: float, y: float, slice_type: str):
        """Register a newly spawned UE with its initial position and slice type."""
        self._ues[client_id] = UEMobility(client_id, x, y, slice_type)

    def deregister(self, client_id: str):
        """Remove a UE when it is despawned."""
        self._ues.pop(client_id, None)

    def tick(self, dt: float, client_positions: dict):
        """
        Advance all UE positions by dt seconds.
        Writes updated (x, y) tuples back into client_positions in-place.
        """
        for client_id, ue in self._ues.items():
            ue.tick(dt)
            client_positions[client_id] = ue.position
