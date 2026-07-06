<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Ericsson_logo.svg/1024px-Ericsson_logo.svg.png" width="100" />
  <h1>🌐 5G Nexus Orchestrator</h1>
  <p><strong>Enterprise-Grade 5G Core Network Slicing & Massive MIMO Simulator</strong></p>
</div>

---

## ⚡ Overview
The **5G Nexus Orchestrator** is a cutting-edge Python and React-based simulation engine designed to mathematically and visually demonstrate next-generation 5G telecommunications architectures. 

Unlike traditional ad-hoc MANET simulators that focus on omnidirectional path-loss, this project models a **5G Edge Core** responsible for dynamic Quality of Service (QoS) throttling, mmWave Beamforming, and Network Slicing.

---

## 🎯 Core Engineering Features

### 1. Dynamic Network Slicing & QoS
The Python Core orchestrates a strictly prioritized bandwidth pool across three primary 5G slices:
- 🔴 **URLLC (Ultra-Reliable Low Latency Communications)**: Guaranteed sub-millisecond latency. Priority 1 routing designed for Autonomous Vehicles and remote surgery.
- 🔵 **eMBB (Enhanced Mobile Broadband)**: High-bandwidth slice for 4K VR/AR Streaming.
- 🟢 **mMTC (Massive Machine Type Communications)**: Low-bandwidth, high-density slice for thousands of IoT sensors.

> **The Physics Engine** actively monitors network saturation. If the total requested bandwidth exceeds the `10,000 Mbps` edge server capacity, the engine will aggressively throttle (packet drop) the eMBB and mMTC slices to guarantee the URLLC Service Level Agreement (SLA).

### 2. Massive MIMO & Beam Steering
Traditional Wi-Fi radiates power in a circle. 5G mmWave utilizes **Massive MIMO array gains** to physically steer concentrated beams of RF energy at moving targets.
- The `BeamformingEngine` calculates direct trigonometric steering vectors and beamwidths dynamically.
- The React visualizer renders these vectors as directional microwave cones tracking the User Equipment (UE).

### 3. Enterprise Dashboard Visualization
The frontend eschews typical "hacker" UI tropes in favor of a pristine, professional **Ericsson/Cisco-style Enterprise Dashboard**.
- High-performance **HTML5 Canvas** rendering for MIMO beams.
- Live-updating CSS-Grid telemetry metrics.
- Asynchronous multi-threaded Python backend bridged via low-latency `Socket.IO`.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js (v16+)

### Launching the Environment
You can launch both the Python 5G Core and the React Enterprise Dashboard concurrently using the unified boot script:

```bash
chmod +x run_5g_demo.sh
./run_5g_demo.sh
```

Navigate to `http://localhost:5175` to interact with the Nexus Orchestrator.

---

## 🧪 Computational Testing
The core slicing algorithms are backed by a rigorous Python `unittest` suite that mathematically verifies bandwidth starvation under extreme edge-case load scenarios (e.g., spawning 200 autonomous vehicles into a congested 4K video network).

```bash
python3 src/test_5g_core.py
```

---
*Built as a capstone exploration into next-generation 5G cellular architectures.*