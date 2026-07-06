import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import BeamVisualizer from './BeamVisualizer';
import SliceDashboard from './SliceDashboard';
import { Activity, Server, Radio, Database } from 'lucide-react';

const socket = io('http://localhost:5001');

function App() {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('5g_state', (data) => {
      setGameState(data);
    });
    return () => socket.off('5g_state');
  }, []);

  const handleSpawn = (sliceType) => {
    socket.emit('spawn_client', {
      id: `UE_${Math.floor(Math.random() * 1000)}`,
      x: Math.floor(Math.random() * 800) + 100,
      y: Math.floor(Math.random() * 800) + 100,
      slice: sliceType
    });
  };

  const handleClear = () => {
    if(!gameState) return;
    Object.keys(gameState.clients).forEach(id => {
      socket.emit('remove_client', {id});
    });
  };

  if (!gameState) {
    return <div className="loading">Booting 5G Nexus Core...</div>;
  }

  return (
    <div className="nexus-dashboard">
      <header className="nexus-header">
        <div className="logo-section">
          <Server size={28} className="brand-icon" />
          <div className="brand-text">
            <h1>ERICSSON</h1>
            <span>5G NEXUS ORCHESTRATOR</span>
          </div>
        </div>
        <div className="status-indicators">
          <div className="status-pill active"><Activity size={14}/> CORE ONLINE</div>
          <div className="status-pill"><Radio size={14}/> gNodeB ACTIVE</div>
          <div className="status-pill"><Database size={14}/> EDGE COMPUTE</div>
        </div>
      </header>

      <main className="nexus-grid">
        {/* Left Column: Slicing UI */}
        <section className="slicing-panel">
          <div className="panel-header">
            <h2>Dynamic Network Slicing</h2>
            <button className="clear-btn" onClick={handleClear}>RESET TOPOLOGY</button>
          </div>
          
          <div className="spawn-controls" style={{marginTop: 0, marginBottom: '2rem'}}>
            <h3>Inject Traffic Workloads</h3>
            <div className="spawn-buttons">
              <button className="btn-urllc" onClick={() => handleSpawn('URLLC')}>
                + Autonomous Vehicle (URLLC)
              </button>
              <button className="btn-embb" onClick={() => handleSpawn('eMBB')}>
                + 4K VR Headset (eMBB)
              </button>
              <button className="btn-mmtc" onClick={() => handleSpawn('mMTC')}>
                + 10x IoT Sensors (mMTC)
              </button>
            </div>
            
            <div className="scenario-log" style={{marginTop: '1.5rem', padding: '1rem', background: '#F1F5F9', borderRadius: '8px', fontSize: '0.75rem', borderLeft: '4px solid #0284C7'}}>
              <strong>Simulation Purpose:</strong> Watch what happens when the network hits 100% capacity. Spawning a URLLC vehicle will force the Edge Server to actively throttle (drop packets from) the eMBB VR headsets to guarantee 1ms latency for the car. This proves 5G Network Slicing QoS.
            </div>
          </div>
          
          <SliceDashboard slices={gameState.slices} />
        </section>

        {/* Right Column: Radar/Beamforming */}
        <section className="beamforming-panel">
          <div className="panel-header">
            <h2>Massive MIMO Beam Steering Visualizer</h2>
          </div>
          <div className="canvas-wrapper">
             <BeamVisualizer 
                aps={gameState.aps} 
                clients={gameState.clients} 
                beams={gameState.beams} 
                mappings={gameState.mappings}
              />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
