import os
import sys
import logging
import asyncio
import threading
import time
import math
from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'src'))

from core.slicing_engine import SliceManager
from core.beamforming import BeamformingEngine

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 5G Core Components
slice_manager = SliceManager(total_bandwidth_mbps=50000.0)
beam_engine = BeamformingEngine()

# State
ap_positions = {"gNodeB_Alpha": (500, 500)}
client_positions = {}
client_slice_mapping = {}

@socketio.on('connect')
def handle_connect():
    logger.info(f"Dashboard Connected: {request.sid}")

@socketio.on('spawn_client')
def spawn_client(data):
    client_id = data.get('id')
    x = data.get('x')
    y = data.get('y')
    slice_req = data.get('slice') # eMBB, URLLC, mMTC
    
    if client_id in client_positions:
        remove_client({'id': client_id})
        
    import random
    import math
    ap_pos = ap_positions.get("gNodeB_Alpha", (500, 500))
    
    # Try to find a non-overlapping angle/position up to 50 times
    for _ in range(50):
        overlap = False
        angle = math.atan2(y - ap_pos[1], x - ap_pos[0])
        
        for cid, pos in client_positions.items():
            cangle = math.atan2(pos[1] - ap_pos[1], pos[0] - ap_pos[0])
            angle_diff = (angle - cangle + math.pi) % (2 * math.pi) - math.pi
            if abs(angle_diff) < 0.25:  # About 14 degrees
                overlap = True
                break
                
        if not overlap:
            break
            
        new_angle = random.uniform(0, 2 * math.pi)
        new_r = random.uniform(150, 400)
        x = 500 + math.cos(new_angle) * new_r
        y = 500 + math.sin(new_angle) * new_r
    
    client_positions[client_id] = (x, y)
    client_slice_mapping[client_id] = slice_req
    
    # Register client to slice
    s = slice_manager.slices.get(f"SLICE_{slice_req}")
    if s:
        s.active_clients += 1
    
    return {"status": "success"}

@socketio.on('remove_client')
def remove_client(data):
    client_id = data.get('id')
    if client_id in client_positions:
        slice_req = client_slice_mapping[client_id]
        s = slice_manager.slices.get(f"SLICE_{slice_req}")
        if s and s.active_clients > 0:
            s.active_clients -= 1
        
        del client_positions[client_id]
        del client_slice_mapping[client_id]
        
    return {"status": "success"}

@socketio.on('clear_all_clients')
def clear_all_clients(data=None):
    client_positions.clear()
    client_slice_mapping.clear()
    for s in slice_manager.slices.values():
        s.active_clients = 0
        s.current_load = 0.0
        s.allocated_bw = 0.0
        s.packets_processed = 0
        s.packets_dropped = 0
    return {"status": "success"}

@socketio.on('remove_client_by_type')
def remove_client_by_type(data):
    slice_type = data.get('slice')
    # Find one client that matches the slice type
    for client_id, req in list(client_slice_mapping.items()):
        if req == slice_type:
            remove_client({'id': client_id})
            break
    return {"status": "success"}

@socketio.on('update_client_pos')
def update_client_pos(data):
    client_id = data.get('id')
    if client_id in client_positions:
        client_positions[client_id] = (data.get('x'), data.get('y'))
        
async def core_loop():
    """
    15Hz Loop for Physics and QoS calculations
    """
    while True:
        # Tick the QoS Allocator
        slice_manager.tick()
        
        # Calculate Beamforming Matrices
        beam_engine.update_beams(ap_positions, client_positions)
        
        # Emit State
        state = {
            "aps": ap_positions,
            "clients": client_positions,
            "mappings": client_slice_mapping,
            "beams": beam_engine.get_state(),
            "slices": slice_manager.get_state(),
            "timestamp": time.time()
        }
        socketio.emit('5g_state', state)
        
        await asyncio.sleep(1/15.0)

def start_core():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(core_loop())

if __name__ == '__main__':
    threading.Thread(target=start_core, daemon=True).start()
    logger.info("Starting 5G Nexus Core on Port 5001...")
    socketio.run(app, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)
