import time
import math
from typing import Dict, List

class NetworkSlice:
    def __init__(self, slice_id: str, slice_type: str, guaranteed_bw: float, max_latency_ms: float):
        self.slice_id = slice_id
        self.slice_type = slice_type # eMBB, URLLC, mMTC
        self.guaranteed_bw = guaranteed_bw
        self.allocated_bw = 0.0
        self.max_latency_ms = max_latency_ms
        self.active_clients = 0
        self.current_load = 0.0 # percentage
        self.packets_processed = 0
        self.packets_dropped = 0
        
    def to_dict(self):
        return {
            "slice_id": self.slice_id,
            "type": self.slice_type,
            "guaranteed_bw": self.guaranteed_bw,
            "allocated_bw": self.allocated_bw,
            "latency_target": self.max_latency_ms,
            "active_clients": self.active_clients,
            "load": round(self.current_load, 2),
            "processed": self.packets_processed,
            "dropped": self.packets_dropped
        }

class SliceManager:
    def __init__(self, total_bandwidth_mbps: float = 50000.0):
        self.total_bandwidth = total_bandwidth_mbps
        self.slices: Dict[str, NetworkSlice] = {}
        
        # Default 5G Slices (Total 50000 Mbps)
        self.add_slice("SLICE_URLLC", "URLLC", guaranteed_bw=15000.0, max_latency_ms=1.0)
        self.add_slice("SLICE_eMBB", "eMBB", guaranteed_bw=25000.0, max_latency_ms=20.0)
        self.add_slice("SLICE_mMTC", "mMTC", guaranteed_bw=10000.0, max_latency_ms=100.0)
        
    def add_slice(self, slice_id, slice_type, guaranteed_bw, max_latency_ms):
        self.slices[slice_id] = NetworkSlice(slice_id, slice_type, guaranteed_bw, max_latency_ms)
        
    def allocate_resources(self):
        """
        Dynamically allocates bandwidth based on load and slice priority.
        URLLC gets strict priority.
        """
        remaining_bw = self.total_bandwidth
        
        # 1. Fulfill URLLC demands first
        urllc = self.slices.get("SLICE_URLLC")
        if urllc:
            demand = urllc.active_clients * 2500.0 # 2500 Mbps per autonomous car
            allocated = min(demand, remaining_bw)
            urllc.allocated_bw = max(allocated, urllc.guaranteed_bw * 0.1) if urllc.active_clients > 0 else 0.0
            urllc.current_load = (demand / urllc.guaranteed_bw) * 100 if urllc.guaranteed_bw > 0 else 0
            remaining_bw -= urllc.allocated_bw

        # 2. Fulfill eMBB demands
        embb = self.slices.get("SLICE_eMBB")
        if embb:
            demand = embb.active_clients * 5000.0 # 5000 Mbps per 4K VR streaming cluster
            allocated = min(demand, remaining_bw)
            embb.allocated_bw = allocated
            embb.current_load = (demand / embb.guaranteed_bw) * 100 if embb.guaranteed_bw > 0 else 0
            if demand > embb.allocated_bw:
                embb.packets_dropped += int((demand - embb.allocated_bw) / 10) # Simulate drops
            remaining_bw -= embb.allocated_bw

        # 3. Fulfill mMTC demands
        mmtc = self.slices.get("SLICE_mMTC")
        if mmtc:
            demand = mmtc.active_clients * 1000.0 # 1000 Mbps per IoT cluster
            allocated = min(demand, remaining_bw)
            mmtc.allocated_bw = allocated
            mmtc.current_load = (demand / mmtc.guaranteed_bw) * 100 if mmtc.guaranteed_bw > 0 else 0
            if demand > mmtc.allocated_bw:
                mmtc.packets_dropped += int((demand - mmtc.allocated_bw) / 10)
            remaining_bw -= mmtc.allocated_bw

    def tick(self):
        for s in self.slices.values():
            if s.active_clients > 0:
                s.packets_processed += int(s.allocated_bw * 10)
        self.allocate_resources()

    def get_state(self):
        total_allocated = sum(s.allocated_bw for s in self.slices.values())
        return {
            "total_capacity": self.total_bandwidth,
            "total_allocated": total_allocated,
            "slices": [s.to_dict() for s in self.slices.values()]
        }
