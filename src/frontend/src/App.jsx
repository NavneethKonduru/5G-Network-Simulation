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
        {/* Left Column: Slices */}
        <section className="side-panel left-panel">
          <div className="panel-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <h2>Network Slices</h2>
              <button className="clear-btn" onClick={handleClear}>RESET</button>
            </div>
            {gameState.slices && gameState.slices.total_capacity && (
               <div style={{width: '100%', padding: '10px', background: '#F1F5F9', borderRadius: '8px', border: '1px solid #CBD5E1'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px'}}>
                   <span>Total Server Capacity</span>
                   <span>{gameState.slices.total_allocated.toFixed(0)} / {gameState.slices.total_capacity} Mbps</span>
                 </div>
                 <div style={{height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden'}}>
                   <div style={{
                     height: '100%', 
                     width: `${Math.min(100, (gameState.slices.total_allocated / gameState.slices.total_capacity) * 100)}%`, 
                     backgroundColor: gameState.slices.total_allocated >= gameState.slices.total_capacity ? '#E11D48' : '#0284C7',
                     transition: 'width 0.3s ease'
                   }}></div>
                 </div>
               </div>
            )}
          </div>
          <SliceDashboard slices={gameState.slices.slices || []} />
        </section>

        {/* Center Column: Radar/Beamforming */}
        <section className="beamforming-panel">
          <div className="panel-header center-header">
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

        {/* Right Column: Controls */}
        <section className="side-panel right-panel">
          <div className="panel-header">
            <h2>Edge Controls</h2>
          </div>
          
          <div className="spawn-controls">
            <h3>Inject Traffic</h3>
            <div className="spawn-buttons">
              <button className="btn-urllc" onClick={() => handleSpawn('URLLC')}>
                + Auto Vehicle (URLLC)
              </button>
              <button className="btn-embb" onClick={() => handleSpawn('eMBB')}>
                + 4K VR Headset (eMBB)
              </button>
              <button className="btn-mmtc" onClick={() => handleSpawn('mMTC')}>
                + 10x Sensors (mMTC)
              </button>
            </div>
            
            <div className="scenario-log" style={{marginTop: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid #0284C7', color: '#334155', lineHeight: '1.5'}}>
              <strong style={{display: 'block', marginBottom: '8px', color: '#0F172A'}}>Simulation Objective:</strong>
              Monitor the Edge Server's QoS response under load. As eMBB traffic consumes bandwidth, spawning a URLLC client forces the 5G Core to aggressively throttle lower-priority streams to guarantee 1ms latency for mission-critical applications.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
