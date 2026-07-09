#!/bin/bash
echo "Starting Ericsson 5G Nexus Orchestrator..."

# 1. Start the 5G Core Backend
echo "[1/2] Booting Python 5G Core..."
python3 src/core/nexus_core.py &
BACKEND_PID=$!

# 2. Start the Enterprise Dashboard
echo "[2/2] Booting React Enterprise Dashboard..."
cd src/frontend
npm run dev -- --port 5175 &
FRONTEND_PID=$!

echo "================================================="
echo "5G Nexus is Live!"
echo "Enterprise Dashboard: http://localhost:5175"
echo "================================================="

# Handle termination
trap "echo 'Shutting down 5G Nexus...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
