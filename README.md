<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Ericsson_logo.svg/1024px-Ericsson_logo.svg.png" width="120" />
  <br/><br/>
  
  # 📡 5G Nexus Orchestrator
  **Enterprise-Grade 5G Core Network Slicing & Massive MIMO Simulator**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Python](https://img.shields.io/badge/Backend-Python_3.9+-3776AB?logo=python&logoColor=white)](#)
  [![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react&logoColor=black)](#)
  [![WebSockets](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](#)
  
  <br/>
</div>

## ⚡ Overview

The **5G Nexus Orchestrator** is a cutting-edge Python and React-based simulation engine designed to mathematically and visually demonstrate next-generation 5G telecommunications architectures. 

Unlike traditional ad-hoc MANET simulators that focus on omnidirectional path-loss, this project models a **5G Edge Core** responsible for dynamic Quality of Service (QoS) throttling, mmWave Beamforming, and Network Slicing.

---

## 🎯 Core Engineering Features

### 1. Dynamic Network Slicing & Statistical Multiplexing
The Python Core orchestrates a strictly prioritized bandwidth pool across three primary 5G slices, operating with a **50 Gbps Total Edge Server Capacity**:

| Slice Type | Primary Use Case | Priority | Guaranteed BW | Overdrive Load Limit |
|:---:|:---|:---:|:---:|:---:|
| 🔴 **URLLC** | Autonomous Vehicles, Remote Surgery | **Critical (1st)** | 15,000 Mbps | Dynamic up to 50 Gbps |
| 🔵 **eMBB** | 4K VR/AR Streaming, Mobile Broadband | High (2nd) | 25,000 Mbps | Dynamic up to 50 Gbps |
| 🟢 **mMTC** | IoT Sensor Swarms, Smart Cities | Standard (3rd) | 10,000 Mbps | Dynamic up to 50 Gbps |

> 🚨 **Physics Engine Throttling**: The engine actively monitors network saturation. Because of 5G Statistical Multiplexing, slices can dynamically borrow bandwidth up to the full 50 Gbps. However, if the server is full, the engine will aggressively throttle and physically drop packets for eMBB and mMTC to guarantee the URLLC Service Level Agreement (SLA).

### 2. Massive MIMO & Beam Steering Engine
Traditional Wi-Fi radiates power in an inefficient circle. 5G mmWave utilizes **Massive MIMO array gains** to physically steer concentrated beams of RF energy at moving targets.

- 📐 The `BeamformingEngine` calculates direct trigonometric steering vectors in real-time at 15Hz.
- 🌊 **Smooth Fluid Animations**: The React visualizer renders these vectors as directional microwave cones, featuring animated high-speed data flow particles (» / «) that dynamically trace the uplink/downlink telemetry at varying sizes based on the UE slice requirement.
- 🧲 **Anti-Overlap Physics**: A custom repulsion algorithm actively prevents beams and devices from dangerously overlapping in dense sectors.

### 3. Enterprise Dashboard Visualization
The frontend eschews typical "hacker" UI tropes in favor of a pristine, professional **Ericsson/Cisco-style Enterprise Dashboard**.
- Features reactive, high-contrast animated **Overload Buffer Gauges** that physically extend and glow red when network pressure exceeds safe limits (80% for Slices, 50% for Total Server).

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

<div align="center">
  <br/>
  <i>Built as a capstone exploration into next-generation 5G cellular architectures.</i>
</div>