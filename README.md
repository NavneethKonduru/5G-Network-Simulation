# 5G Network Simulation Engine 📶

A full-stack, split-screen **5G Networking simulation engine** built to visually and technically demonstrate next-generation mobile broadband concepts like Network Slicing, massive MIMO, dynamic bandwidth allocation, and edge computing integration.

## 🌟 Overview
This project simulates an advanced 5G-oriented networking stack from the ground up, featuring a custom Python backend that powers both a headless **Terminal CLI Application** and a stunning **React-based Web Dashboard**. 

It focuses on handling ultra-reliable low-latency communication (URLLC), enhanced mobile broadband (eMBB), and massive machine-type communications (mMTC) by dynamically altering network characteristics on the fly.

## 🎯 Key Features

### 1. Dynamic Network Slicing
- Demonstrates how a single physical network infrastructure can be logically partitioned into multiple virtual networks ("slices").
- Simulates assigning independent bandwidth, QoS, and latency guarantees tailored to specific use cases (e.g., IoT sensors vs. HD video streaming).

### 2. High-Frequency Attenuation & MIMO
- Simulates millimeter-wave (mmWave) characteristics, including rapid signal degradation over distance and through obstacles.
- Illustrates massive MIMO (Multiple Input, Multiple Output) techniques by forming focused signal beams to track mobile users, dynamically mitigating interference.

### 3. Edge Computing & Low Latency Routing
- Nodes actively calculate the closest Edge computing server to offload heavy processing tasks.
- Illustrates how moving compute closer to the end-user dramatically drops round-trip time (RTT) for URLLC applications like autonomous vehicles.

## 🛠️ Architecture Stack
- **Backend Core**: Python 3, custom Socket.IO application layer, 5G Modulator Engine, Slice Manager.
- **Frontend Visualization**: React, Vite, D3.js Force Simulation, Network Slicing Overlay.
- **Communication**: Bidirectional low-latency WebSockets mapping Python events directly to React state hooks.

## 🚀 Getting Started

### 1. Launch the Visual Dashboard
To start the React frontend and Python backend simultaneously:
```bash
./run_dashboard.sh
```
Then visit `http://localhost:5173` in your browser.

### 2. Run Headless Simulation
To run the raw backend engine for terminal-based testing:
```bash
python3 src/applications/chat_app/chat_app.py --config configs/_5g_config.yaml --server
```
*Built as a capstone exploration into next-generation 5G cellular architectures.*