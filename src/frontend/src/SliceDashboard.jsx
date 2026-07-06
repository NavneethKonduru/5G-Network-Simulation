import React from 'react';
import { ShieldAlert, Video, Cpu } from 'lucide-react';

const SliceDashboard = ({ slices }) => {
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
        <div key={slice.slice_id} className={`slice-card ${slice.type.toLowerCase()}`}>
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
              <span>{slice.allocated_bw.toFixed(0)} Mbps</span>
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

          <div className="progress-bar-bg">
             <div className="progress-bar-fill" style={{
               width: `${slice.load}%`, 
               backgroundColor: slice.load > 90 ? '#E63946' : '#457B9D'
             }}></div>
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
