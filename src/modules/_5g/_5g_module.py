"""
5G Technology module
Implements 5G-specific concepts like base stations, network slicing, QoS management
"""

import random
import time
import math
from typing import Dict, List, Tuple, Optional, Set
import logging

logger = logging.getLogger(__name__)


class BaseStation:
    """5G Base Station (gNodeB) simulation"""

    def __init__(self, bs_id: str, cell_id: str, frequency_band: str,
                 x: float = 0, y: float = 0, power: float = 43.0):
        self.bs_id = bs_id
        self.cell_id = cell_id
        self.frequency_band = frequency_band  # e.g., "n78", "n257"
        self.position = (x, y)
        self.power = power  # Transmission power in dBm
        self.connected_ues: Dict[str, 'UserEquipment'] = {}
        self.network_slices: Dict[str, 'NetworkSlice'] = {}
        self.is_active = True
        self.load = 0.0  # Current load percentage
        logger.info(f"5G Base Station {bs_id} (Cell {cell_id}) initialized at {self.position} on {frequency_band}")

    def calculate_distance(self, ue_pos: Tuple[float, float]) -> float:
        """Calculate distance to UE position"""
        return math.sqrt(
            (self.position[0] - ue_pos[0])**2 +
            (self.position[1] - ue_pos[1])**2
        )

    def calculate_signal_strength(self, ue_pos: Tuple[float, float]) -> float:
        """Calculate signal strength (RSRP) at UE position"""
        distance = self.calculate_distance(ue_pos)
        if distance == 0:
            return self.power
        # Simplified path loss for 5G (including penetration loss)
        frequency_ghz = float(self.frequency_band[1:]) if self.frequency_band.startswith('n') else 3.5
        path_loss = 20 * math.log10(distance) + 20 * math.log10(frequency_ghz * 1e9) + 32.44
        # Add penetration loss for indoor/outdoor
        penetration_loss = 10 if random.random() > 0.7 else 0  # 30% chance of outdoor
        return self.power - path_loss - penetration_loss

    def can_connect(self, ue_pos: Tuple[float, float], threshold: float = -120.0) -> bool:
        """Check if UE can connect based on signal strength"""
        rsrp = self.calculate_signal_strength(ue_pos)
        return rsrp > threshold

    def add_ue(self, ue: 'UserEquipment'):
        """Add a User Equipment to this base station"""
        self.connected_ues[ue.ue_id] = ue
        self._update_load()
        logger.info(f"UE {ue.ue_id} connected to BS {self.bs_id}")

    def remove_ue(self, ue_id: str):
        """Remove a User Equipment from this base station"""
        if ue_id in self.connected_ues:
            del self.connected_ues[ue_id]
            self._update_load()
            logger.info(f"UE {ue_id} disconnected from BS {self.bs_id}")

    def add_network_slice(self, slice_id: str, slice_obj: 'NetworkSlice'):
        """Add a network slice to this base station"""
        self.network_slices[slice_id] = slice_obj
        logger.info(f"Network slice {slice_id} added to BS {self.bs_id}")

    def _update_load(self):
        """Update base station load based on connected UEs"""
        # Simplified load calculation
        max_ues = 100  # Assume max 100 UEs per BS
        self.load = min(len(self.connected_ues) / max_ues, 1.0)


class UserEquipment:
    """5G User Equipment (mobile device) simulation"""

    def __init__(self, ue_id: str, x: float = 0, y: float = 0):
        self.ue_id = ue_id
        self.position = (x, y)
        self.connected_bs: Optional[BaseStation] = None
        self.network_slice: Optional[str] = None
        self.qos_class: Optional[str] = None  # e.g., "URLLC", "eMBB", "mMTC"
        self.velocity = (0.0, 0.0)
        logger.info(f"5G UE {ue_id} initialized at {self.position}")

    def update_position(self, dt: float):
        """Update position based on velocity and time"""
        new_x = self.position[0] + self.velocity[0] * dt
        new_y = self.position[1] + self.velocity[1] * dt
        self.position = (new_x, new_y)
        logger.debug(f"UE {self.ue_id} moved to {self.position}")

    def set_velocity(self, vx: float, vy: float):
        """Set movement velocity"""
        self.velocity = (vx, vy)


class NetworkSlice:
    """5G Network Slice representation"""

    def __init__(self, slice_id: str, slice_type: str, bandwidth: float,
                 latency_target: float, reliability_target: float):
        self.slice_id = slice_id
        self.slice_type = slice_type  # e.g., "URLLC", "eMBB", "mMTC"
        self.bandwidth = bandwidth    # MHz
        self.latency_target = latency_target  # ms
        self.reliability_target = reliability_target  # percentage (0-1)
        self.allocated_resources: Dict[str, float] = {}  # bs_id -> allocated_bandwidth
        logger.info(f"Network slice {slice_id} ({slice_type}) created")

    def allocate_resources(self, bs_id: str, bandwidth: float):
        """Allocate resources to a base station"""
        self.allocated_resources[bs_id] = self.allocated_resources.get(bs_id, 0) + bandwidth
        logger.info(f"Allocated {bandwidth} MHz to BS {bs_id} for slice {self.slice_id}")

    def get_utilization(self, bs_id: str) -> float:
        """Get resource utilization for a base station"""
        total_bandwidth = self.bandwidth  # Simplified - assume per BS
        allocated = self.allocated_resources.get(bs_id, 0)
        return min(allocated / total_bandwidth, 1.0) if total_bandwidth > 0 else 0.0


class QoSManager:
    """Manages Quality of Service for 5G services"""

    def __init__(self):
        self.qos_profiles = {
            'URLLC': {'latency': 1, 'reliability': 0.999, 'priority': 1},
            'eMBB': {'latency': 50.0, 'reliability': 0.95, 'priority': 2},
            'mMTC': {'latency': 200.0, 'reliability': 0.9, 'priority': 3}
        }
        logger.info("QoS Manager initialized")

    def get_qos_profile(self, service_type: str) -> Dict:
        """Get QoS profile for a service type"""
        return self.qos_profiles.get(service_type, self.qos_profiles['eMBB'])

    def assess_qos_compliance(self, measured_latency: float,
                            measured_reliability: float,
                            service_type: str) -> bool:
        """Assess if QoS requirements are met"""
        profile = self.qos_profiles.get(service_type)
        if not profile:
            return False
        return (measured_latency <= profile['latency'] and
                measured_reliability >= profile['reliability'])


class _5gModule:
    """Main 5G module interface"""

    def __init__(self):
        self.base_stations: Dict[str, BaseStation] = {}
        self.ues: Dict[str, UserEquipment] = {}
        self.network_slices: Dict[str, NetworkSlice] = {}
        self.qos_manager = QoSManager()
        self.is_active = False
        logger.info("5G module initialized")

    def activate(self):
        """Activate the 5G module"""
        if not self.is_active:
            self.is_active = True
            logger.info("5G module activated")

    def deactivate(self):
        """Deactivate the 5G module"""
        self.is_active = False
        logger.info("5G module deactivated")

    def add_base_station(self, bs_id: str, cell_id: str, frequency_band: str,
                        x: float = 0, y: float = 0, power: float = 43.0) -> BaseStation:
        """Add a 5G base station"""
        bs = BaseStation(bs_id, cell_id, frequency_band, x, y, power)
        self.base_stations[bs_id] = bs
        return bs

    def add_ue(self, ue_id: str, x: float = 0, y: float = 0) -> UserEquipment:
        """Add a User Equipment"""
        ue = UserEquipment(ue_id, x, y)
        self.ues[ue_id] = ue
        return ue

    def add_network_slice(self, slice_id: str, slice_type: str, bandwidth: float,
                         latency_target: float, reliability_target: float) -> NetworkSlice:
        """Add a network slice"""
        slice_obj = NetworkSlice(slice_id, slice_type, bandwidth, latency_target, reliability_target)
        self.network_slices[slice_id] = slice_obj
        return slice_obj

    def simulate_mobility(self, duration: float = 10.0, dt: float = 0.1):
        """Simulate UE mobility and handover"""
        steps = int(duration / dt)
        for step in range(steps):
            # Update UE positions with random movement
            for ue in self.ues.values():
                if ue.connected_bs:
                    # Random walk with tendency to stay connected
                    angle = random.uniform(0, 2 * math.pi)
                    speed = random.uniform(0, 3)  # m/s
                    ue.set_velocity(speed * math.cos(angle), speed * math.sin(angle))
                ue.update_position(dt)

            # Check for handover opportunities
            for ue in self.ues.values():
                if ue.connected_bs:
                    # Find best BS
                    best_bs = None
                    best_rsrp = float('-inf')
                    for bs in self.base_stations.values():
                        if bs.is_active:
                            rsrp = bs.calculate_signal_strength(ue.position)
                            if rsrp > best_rsrp:
                                best_rsrp = rsrp
                                best_bs = bs

                    # Handover if significantly better
                    if best_bs and best_bs != ue.connected_bs:
                        current_rsrp = ue.connected_bs.calculate_signal_strength(ue.position)
                        if best_rsrp > current_rsrp + 3:  # 3dB hysteresis
                            ue.connected_bs.remove_ue(ue.ue_id)
                            best_bs.add_ue(ue)
                            ue.connected_bs = best_bs
                            logger.info(f"UE {ue.ue_id} handed over from {ue.connected_bs.bs_id} to {best_bs.bs_id}")

            time.sleep(dt)

    def allocate_network_slice_resources(self):
        """Allocate network slice resources to base stations"""
        for slice_id, slice_obj in self.network_slices.items():
            # Simple equal distribution for demo
            active_bs = [bs for bs in self.base_stations.values() if bs.is_active]
            if active_bs:
                bandwidth_per_bs = slice_obj.bandwidth / len(active_bs)
                for bs in active_bs:
                    slice_obj.allocate_resources(bs.bs_id, bandwidth_per_bs)

    def simulate_5g_transmission(self, src_user: str, msg_type: str, content: str = ""):
        """Simulate 5G characteristics for a message"""
        if not self.is_active:
            return

        if not hasattr(self, 'band'):
            self.band = "n257 (mmWave, 28 GHz)"

        print(f"\n=======================================================")
        if content.startswith("/compute"):
            print(f"[5G MEC] -> Edge Computing task requested by '{src_user}'.")
            print(f"[5G MEC] -> Routing task to Multi-Access Edge Computing (MEC) Server at the Base Station...")
            time.sleep(0.1)
            print(f"[5G MEC] -> Task completed locally at the Edge.")
            print(f"[5G MEC] -> MEC Latency: 1.2ms (Ultra-Low Latency)")
            print(f"[5G MEC] -> Cloud Latency equivalent would be: 45.8ms")
            print(f"=======================================================\n")
            return
            
        if content.startswith("/blockage"):
            print(f"[5G NR PHY] -> WARNING: Severe signal degradation detected!")
            print(f"[5G NR PHY] -> Physical blockage (e.g., vehicle or building) obstructing mmWave Line-of-Sight.")
            time.sleep(0.4)
            print(f"[gNodeB] -> Executing immediate frequency fallback mechanisms...")
            print(f"[gNodeB] -> Dropping {self.band} connection.")
            self.band = "n78 (Sub-6GHz, 3.5 GHz)"
            time.sleep(0.3)
            print(f"[gNodeB] -> Successfully attached to fallback band: {self.band}")
            print(f"[gNodeB] -> Connection saved via Dual Connectivity (EN-DC).")
            print(f"=======================================================\n")
            return

        print(f"[5G CORE] Intercepted {msg_type} from UE '{src_user}'")
        
        # Determine QoS / Network Slice
        slice_type = "URLLC" if msg_type == "JOIN" else "eMBB"
        print(f"[5G CORE] -> Deep Packet Inspection... Traffic Profile: {slice_type}")
        print(f"[5G CORE] -> Assigning to Network Slice: {slice_type} (Dynamic QoS)")
        time.sleep(0.3)
        
        print(f"[5G RAN] -> Allocating Radio Resources on {self.band}...")
        time.sleep(0.3)
        
        print(f"[gNodeB] -> Massive MIMO Beamforming engaged. Steering beam toward UE '{src_user}'...")
        time.sleep(0.4)
        
        # Simulate signal
        rsrp = random.uniform(-90.0, -65.0) if "Sub-6GHz" in self.band else random.uniform(-75.0, -50.0)
        print(f"[5G PHY] -> Transmission complete. UE Received RSRP: {rsrp:.1f}dBm")
        print(f"=======================================================\n")

    def get_5g_module_info() -> Dict:
        """Get information about 5G capabilities for reporting"""
        return {
            'concepts': [
                '5G New Radio (NR)',
                'Network Slicing',
                'Massive MIMO',
                'Edge Computing',
                'Network Virtualization'
            ],
            'frequency_bands': [
                'Sub-6GHz (n1, n2, n3, n5, n7, n8, n20, n25, n28, n34, n38, n39, n40, n41, n66, n70, n71, n74, n75, n76, n77, n78, n79)',
                'mmWave (n257, n258, n259, n260, n261)'
            ],
            'services': [
                'Enhanced Mobile Broadband (eMBB)',
                'Ultra-Reliable Low Latency Communications (URLLC)',
                'Massive Machine Type Communications (mMTC)'
            ],
            'key_technologies': [
                'OFDM with CP-OFDM/DFT-s-OFDM',
                'Massive MIMO (64T64R, 256T256R)',
                'Beamforming',
                'Network Function Virtualization (NFV)',
                'Software Defined Networking (SDN)'
            ]
        }


if __name__ == "__main__":
    # Simple test
    _5g = _5gModule()
    bs1 = _5g.add_base_station("bs1", "cell1", "n78", 0, 0, 43)
    bs2 = _5g.add_base_station("bs2", "cell2", "n78", 100, 0, 43)
    ue1 = _5g.add_ue("phone1", -10, 0)

    # Add network slices
    eMBB_slice = _5g.add_network_slice("embb_slice", "eMBB", 50.0, 10.0, 0.95)
    URLLC_slice = _5g.add_network_slice("urllc_slice", "URLLC", 10.0, 1.0, 0.999)

    print(f"5G module ready with {len(_5g.base_stations)} BSs and {len(_5g.ues)} UEs")