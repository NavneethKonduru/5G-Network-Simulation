import React from 'react';
import { ShieldAlert, Video, Cpu } from 'lucide-react';

const SliceDashboard = ({ slices, isOverloaded }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'URLLC': return <ShieldAlert size={20} color="#E63946" />;
      case 'eMBB': return <Video size={20} color="#457B9D" />;
      case 'mMTC': return <Cpu size={20} color="#2A9D8F" />;
      default: return null;
    }
  };

  return (
    <div className="slices-container">
      {slices.map((slice) => (
        <div key={slice.slice_id} className={`slice-card ${slice.type.toLowerCase()} ${(isOverloaded && slice.type !== 'URLLC') ? 'throttled' : ''}`}>
          <div className="slice-header">
            {getIcon(slice.type)}
            <div>
              <h3 style={{margin:0, fontSize: '1rem', color: '#1D3557'}}>{slice.type} Slice</h3>
              <span style={{fontSize: '0.7rem', color: '#6C757D'}}>Target Latency: {slice.latency_target}ms</span>
            </div>
            <div className="active-badge">{slice.active_clients} UEs</div>
          </div>
          
          <div className="slice-metrics">
            <div className="metric">
              <label>Allocated</label>
              <span>{slice.allocated_bw.toFixed(1)} Mbps</span>
            </div>
            <div className="metric">
              <label>Guaranteed</label>
              <span>{slice.guaranteed_bw} Mbps</span>
            </div>
            <div className="metric">
              <label>Load %</label>
              <span style={{color: slice.load > 90 ? '#E63946' : '#2A9D8F'}}>{slice.load}%</span>
            </div>
          </div>

          <div style={{ paddingRight: '10%', position: 'relative', marginTop: '10px' }}>
            <div style={{
               position: 'absolute', right: '10%', top: '-4px', bottom: '-4px', width: '2px', 
               backgroundColor: 'rgba(69, 123, 157, 0.4)', zIndex: 5, borderRight: '1px dashed #457B9D'
            }}></div>
            <div className="progress-bar-bg" style={{ 
                width: slice.load > 80 ? '110%' : '100%',
                transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                border: slice.load > 80 ? '1px solid #E11D48' : 'none',
                boxShadow: slice.load > 80 ? '0 0 10px rgba(225, 29, 72, 0.3)' : 'none'
            }}>
               <div className={`progress-bar-fill ${slice.load > 90 ? 'buffering' : ''}`} style={{
                 width: `${Math.min(100, (slice.load / (slice.load > 80 ? 110 : 100)) * 100)}%`, 
                 background: slice.load > 80 ? 'linear-gradient(90deg, #457B9D 80%, #E63946 100%)' : '#457B9D',
                 transition: 'width 0.3s ease, background 0.3s ease'
               }}></div>
            </div>
          </div>

          <div className="packet-stats">
            <span>Processed: {slice.processed.toLocaleString()}</span>
            <span style={{color: slice.dropped > 0 ? '#E63946' : '#6C757D'}}>Dropped: {slice.dropped.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SliceDashboard;
