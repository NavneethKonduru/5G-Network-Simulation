import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import BeamVisualizer from './BeamVisualizer';
import SliceDashboard from './SliceDashboard';
import { Activity, Server, Radio, Database, Sun, Moon } from 'lucide-react';

const socket = io('http://localhost:5001');

function App() {
  const [gameState, setGameState] = useState(null);
  const [isOverloaded, setIsOverloaded] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexus-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    socket.on('5g_state', (data) => {
      setGameState(data);
    });
    return () => socket.off('5g_state');
  }, []);

  useEffect(() => {
    if (!gameState || !gameState.slices) return;
    
    if (gameState.slices.total_allocated >= gameState.slices.total_capacity) {
      const timer = setTimeout(() => {
        setIsOverloaded(true);
      }, 1500); // 1.5s buffer
      return () => clearTimeout(timer);
    } else {
      setIsOverloaded(false);
    }
  }, [gameState?.slices?.total_allocated, gameState?.slices?.total_capacity]);

  const handleSpawn = (sliceType) => {
    // Spawn at a fixed distance (300) from center so the UE sits 
    // exactly in the middle of the beam's visual range
    const angle = Math.random() * Math.PI * 2;
    const r = 300;
    
    socket.emit('spawn_client', {
      id: `UE_${Math.floor(Math.random() * 1000)}`,
      x: 500 + Math.cos(angle) * r,
      y: 500 + Math.sin(angle) * r,
      slice: sliceType
    });
  };

  const handleRemove = (sliceType) => {
    socket.emit('remove_client_by_type', { slice: sliceType });
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
      {isOverloaded && (
        <div className="critical-alert-overlay">
          <div className="critical-alert-modal">
            <h2>CRITICAL WARNING</h2>
            <p>
              Edge Server Capacity (50 Gbps) Exceeded.<br/><br/>
              Initiating QoS Throttling. Dropping packets for <strong>eMBB (VR)</strong> and <strong>mMTC (Sensors)</strong> to guarantee sub-millisecond latency for <strong>URLLC (Autonomous Vehicles)</strong>.
            </p>
            <button className="alert-dismiss-btn" onClick={() => setIsOverloaded(false)}>Acknowledge & Continue</button>
          </div>
        </div>
      )}
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
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} className="theme-icon" /> : <Moon size={18} className="theme-icon" />}
          </button>
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
               <div style={{width: '100%', padding: '10px', background: 'var(--dashboard-bar-bg)', borderRadius: '8px', border: '1px solid var(--dashboard-border)', transition: 'background-color 0.4s ease, border-color 0.4s ease'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>
                   <span>Total Server Capacity</span>
                   <span>{gameState.slices.total_allocated.toFixed(0)} / {((gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? gameState.slices.total_capacity * 1.2 : gameState.slices.total_capacity).toFixed(0)} Mbps</span>
                 </div>
                 <div style={{ paddingRight: '20%', position: 'relative', marginTop: '10px' }}>
                     <div style={{
                        position: 'absolute', right: '20%', top: '-4px', bottom: '-4px', width: '2px', 
                        backgroundColor: 'rgba(2, 132, 199, 0.4)', zIndex: 5, borderRight: '1px dashed #0284C7'
                     }}></div>
                     <div style={{
                       height: '8px', 
                       background: 'var(--dashboard-border)', 
                       borderRadius: '4px', 
                       width: (gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? '120%' : '100%',
                       transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.4s ease',
                       position: 'relative',
                       border: (gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? '1px solid #E11D48' : 'none',
                       boxShadow: (gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? '0 0 12px rgba(225, 29, 72, 0.4)' : 'none'
                     }}>
                       <div className={(gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.8 ? 'buffering' : ''} style={{
                         height: '100%', 
                         width: `${Math.min(100, (gameState.slices.total_allocated / (gameState.slices.total_capacity * ((gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? 1.2 : 1.0))) * 100)}%`, 
                         background: (gameState.slices.total_allocated / gameState.slices.total_capacity) > 0.5 ? 'linear-gradient(90deg, #0284C7 80%, #E11D48 100%)' : '#0284C7',
                         transition: 'width 0.3s ease, background 0.3s ease',
                         borderRadius: '3px'
                       }}></div>
                     </div>
                 </div>
               </div>
            )}
          </div>
          <SliceDashboard slices={gameState.slices.slices || []} isOverloaded={isOverloaded} />
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
                theme={theme}
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
              <div style={{display: 'flex', gap: '8px'}}>
                <button className="btn-urllc" style={{flex: 1}} onClick={() => handleSpawn('URLLC')}>
                  + Auto Vehicle (URLLC)
                </button>
                <button className="btn-urllc" style={{padding: '14px', width: '45px', display: 'flex', justifyContent: 'center'}} onClick={() => handleRemove('URLLC')}>-</button>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button className="btn-embb" style={{flex: 1}} onClick={() => handleSpawn('eMBB')}>
                  + 4K VR Headset (eMBB)
                </button>
                <button className="btn-embb" style={{padding: '14px', width: '45px', display: 'flex', justifyContent: 'center'}} onClick={() => handleRemove('eMBB')}>-</button>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button className="btn-mmtc" style={{flex: 1}} onClick={() => handleSpawn('mMTC')}>
                  + 10x Sensors (mMTC)
                </button>
                <button className="btn-mmtc" style={{padding: '14px', width: '45px', display: 'flex', justifyContent: 'center'}} onClick={() => handleRemove('mMTC')}>-</button>
              </div>
            </div>
            
            <div className="scenario-log" style={{marginTop: '2rem', padding: '1rem', background: 'var(--card-hover-bg)', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid var(--accent-blue)', color: 'var(--text-secondary)', lineHeight: '1.5', transition: 'background-color 0.4s ease, color 0.4s ease'}}>
              <strong style={{display: 'block', marginBottom: '8px', color: 'var(--text-primary)', transition: 'color 0.4s ease'}}>Simulation Objective:</strong>
              Monitor the Edge Server's QoS response under load. As eMBB traffic consumes bandwidth, spawning a URLLC client forces the 5G Core to aggressively throttle lower-priority streams to guarantee 1ms latency for mission-critical applications.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
