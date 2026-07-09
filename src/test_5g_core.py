import unittest
from core.slicing_engine import SliceManager

class Test5GCoreDeep(unittest.TestCase):
    
    def setUp(self):
        self.slice_manager = SliceManager(total_bandwidth_mbps=10000.0)

    def test_load_percentage_calculation(self):
        """Test that a single client doesn't cause 100% load."""
        # 1 mMTC sensor = 10 Mbps demand. Guaranteed is 2000 Mbps.
        # It should NOT show 100% load just because it gets the 10 Mbps it asked for.
        self.slice_manager.slices["SLICE_mMTC"].active_clients = 1
        self.slice_manager.allocate_resources()
        
        mmtc = self.slice_manager.slices["SLICE_mMTC"]
        
        # It should be allocated 10.0 Mbps
        self.assertEqual(mmtc.allocated_bw, 10.0)
        
        # Load % should be (demand / guaranteed_bw) * 100
        # Wait, if demand = 10, and guaranteed = 2000, load should be 0.5%
        # Let's assert it is NOT 100.0
        self.assertNotEqual(mmtc.current_load, 100.0)
        self.assertAlmostEqual(mmtc.current_load, (10.0 / 2000.0) * 100)

    def test_overload_percentage_calculation(self):
        """Test that load goes over 100% when demand exceeds guaranteed_bw."""
        self.slice_manager.slices["SLICE_mMTC"].active_clients = 250 # 250 * 10 = 2500 Mbps
        self.slice_manager.allocate_resources()
        
        mmtc = self.slice_manager.slices["SLICE_mMTC"]
        
        # Demand is 2500. Guaranteed is 2000.
        # Load should be (2500 / 2000) * 100 = 125%
        self.assertEqual(mmtc.current_load, 125.0)

if __name__ == '__main__':
    unittest.main()
