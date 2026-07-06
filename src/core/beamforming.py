import math
from typing import List, Dict

class Beam:
    def __init__(self, target_id: str, angle_deg: float, width_deg: float, power_dbm: float):
        self.target_id = target_id
        self.angle_deg = angle_deg
        self.width_deg = width_deg
        self.power_dbm = power_dbm
        
    def to_dict(self):
        return {
            "target": self.target_id,
            "angle": round(self.angle_deg, 2),
            "width": round(self.width_deg, 2),
            "power": round(self.power_dbm, 2)
        }

class BeamformingEngine:
    """
    Simulates Massive MIMO and dynamic beam steering.
    Instead of omnidirectional rings, APs steer directed cones of RF energy at clients.
    """
    def __init__(self):
        self.ap_beams: Dict[str, List[Beam]] = {}
        
    def calculate_angle(self, src_x, src_y, dst_x, dst_y):
        dx = dst_x - src_x
        dy = dst_y - src_y
        angle = math.degrees(math.atan2(dy, dx))
        if angle < 0:
            angle += 360
        return angle
        
    def update_beams(self, aps_positions: Dict[str, tuple], client_positions: Dict[str, tuple]):
        """
        Calculates steering vectors for all active clients.
        """
        self.ap_beams.clear()
        
        for ap_id, ap_pos in aps_positions.items():
            beams = []
            for client_id, client_pos in client_positions.items():
                # Form a beam from AP to Client
                angle = self.calculate_angle(ap_pos[0], ap_pos[1], client_pos[0], client_pos[1])
                # Beam width narrows as frequency goes up (simulating mmWave)
                width = 15.0 # narrow beam
                power = 30.0 # High EIRP due to array gain
                beams.append(Beam(client_id, angle, width, power))
                
            self.ap_beams[ap_id] = beams
            
    def get_state(self):
        state = {}
        for ap_id, beams in self.ap_beams.items():
            state[ap_id] = [b.to_dict() for b in beams]
        return state
