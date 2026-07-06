import unittest
import math
from core.slicing_engine import SliceManager
from core.beamforming import BeamformingEngine, Beam

class Test5GCore(unittest.TestCase):
    
    def setUp(self):
        self.slice_manager = SliceManager(total_bandwidth_mbps=10000.0)
        self.beam_engine = BeamformingEngine()

    def test_slicing_urllc_priority(self):
        """Test that URLLC always gets priority bandwidth even if eMBB is overloaded."""
        
        # Spawn massive eMBB load (50 clients * 500Mbps = 25,000 Mbps demand, which > 10,000 capacity)
        self.slice_manager.slices["SLICE_eMBB"].active_clients = 50
        
        # Spawn URLLC load (100 cars * 50 Mbps = 5,000 Mbps)
        self.slice_manager.slices["SLICE_URLLC"].active_clients = 100
        
        self.slice_manager.allocate_resources()
        
        urllc_alloc = self.slice_manager.slices["SLICE_URLLC"].allocated_bw
        embb_alloc = self.slice_manager.slices["SLICE_eMBB"].allocated_bw
        
        # URLLC should get its full 5000 Mbps
        self.assertEqual(urllc_alloc, 5000.0)
        # eMBB should get the remaining 5000 Mbps (total = 10000)
        self.assertEqual(embb_alloc, 5000.0)
        
        # eMBB should be overloaded
        self.assertEqual(self.slice_manager.slices["SLICE_eMBB"].current_load, 100.0)

    def test_slicing_mmtc_starvation(self):
        """Test that mMTC gets throttled when bandwidth is maxed out."""
        # 200 URLLC cars = 10,000 Mbps (Network completely saturated)
        self.slice_manager.slices["SLICE_URLLC"].active_clients = 200
        
        # 1000 IoT sensors (mMTC) = 100 Mbps
        self.slice_manager.slices["SLICE_mMTC"].active_clients = 1000
        
        self.slice_manager.allocate_resources()
        
        # URLLC consumes all 10,000
        self.assertEqual(self.slice_manager.slices["SLICE_URLLC"].allocated_bw, 10000.0)
        # mMTC gets absolutely nothing because priority goes to URLLC
        self.assertEqual(self.slice_manager.slices["SLICE_mMTC"].allocated_bw, 0.0)

    def test_slicing_underload(self):
        """Test normal allocation when network is under capacity."""
        self.slice_manager.slices["SLICE_URLLC"].active_clients = 10 # 500 Mbps
        self.slice_manager.slices["SLICE_eMBB"].active_clients = 2 # 1000 Mbps
        self.slice_manager.slices["SLICE_mMTC"].active_clients = 50 # 5 Mbps
        
        self.slice_manager.allocate_resources()
        
        self.assertEqual(self.slice_manager.slices["SLICE_URLLC"].allocated_bw, 500.0)
        self.assertEqual(self.slice_manager.slices["SLICE_eMBB"].allocated_bw, 1000.0)
        self.assertEqual(self.slice_manager.slices["SLICE_mMTC"].allocated_bw, 5.0)

    def test_beamforming_angles(self):
        """Test that the AP steers beams to the exact correct angles."""
        aps = {"AP1": (0, 0)}
        
        clients = {
            "UE_1": (100, 0),     # 0 degrees
            "UE_2": (0, 100),     # 90 degrees
            "UE_3": (-100, 0),    # 180 degrees
            "UE_4": (0, -100),    # 270 degrees
            "UE_5": (100, 100)    # 45 degrees
        }
        
        self.beam_engine.update_beams(aps, clients)
        beams = self.beam_engine.ap_beams["AP1"]
        
        # Convert list of beams to dict by target for easy lookup
        beam_dict = {b.target_id: b.angle_deg for b in beams}
        
        self.assertAlmostEqual(beam_dict["UE_1"], 0.0)
        self.assertAlmostEqual(beam_dict["UE_2"], 90.0)
        self.assertAlmostEqual(beam_dict["UE_3"], 180.0)
        self.assertAlmostEqual(beam_dict["UE_4"], 270.0)
        self.assertAlmostEqual(beam_dict["UE_5"], 45.0)

if __name__ == '__main__':
    unittest.main()
