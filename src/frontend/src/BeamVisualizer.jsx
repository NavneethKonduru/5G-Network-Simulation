import React, { useRef, useEffect } from 'react';

const BeamVisualizer = ({ aps, clients, beams, mappings }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    
    // Ensure height is properly calculated even if flex is acting up
    const width = rect.width;
    const height = rect.height;
    
    // High DPI scaling
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(2, 2);
    
    // Clear and draw background
    ctx.fillStyle = '#FAFCFF';
    ctx.fillRect(0, 0, width, height);

    // Draw Sleek Enterprise Blueprint Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for(let i=0; i<height; i+=40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }
    
    // Draw Sub-grid for premium look
    ctx.strokeStyle = '#F1F5F9';
    for(let i=20; i<width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for(let i=20; i<height; i+=40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const getSliceColor = (sliceReq) => {
        if(sliceReq === 'URLLC') return 'rgba(225, 29, 72, 0.2)'; // Tailwind Rose-600
        if(sliceReq === 'eMBB') return 'rgba(2, 132, 199, 0.2)'; // Tailwind Sky-600
        return 'rgba(5, 150, 105, 0.2)'; // Tailwind Emerald-600
    };
    
    const getStrokeColor = (sliceReq) => {
        if(sliceReq === 'URLLC') return '#E11D48';
        if(sliceReq === 'eMBB') return '#0284C7';
        return '#059669';
    };

    // Draw Beams
    const drawRadius = Math.max(width, height) * 0.8;
    Object.keys(beams).forEach(ap_id => {
      const apPos = aps[ap_id];
      if (!apPos) return;
      
      const ap_x = apPos[0] * (width/1000);
      const ap_y = apPos[1] * (height/1000);

      beams[ap_id].forEach(beam => {
        const sliceReq = mappings[beam.target] || 'mMTC';
        
        ctx.beginPath();
        ctx.moveTo(ap_x, ap_y);
        
        const angleRad = beam.angle * (Math.PI / 180);
        const halfWidth = (beam.width / 2) * (Math.PI / 180);
        
        ctx.arc(ap_x, ap_y, drawRadius, angleRad - halfWidth, angleRad + halfWidth);
        ctx.closePath();
        
        // Gradient for beam
        const grad = ctx.createRadialGradient(ap_x, ap_y, 0, ap_x, ap_y, drawRadius);
        grad.addColorStop(0, getSliceColor(sliceReq));
        grad.addColorStop(0.5, getSliceColor(sliceReq));
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Beam edge outlines
        ctx.strokeStyle = getStrokeColor(sliceReq);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(ap_x, ap_y);
        ctx.lineTo(ap_x + Math.cos(angleRad - halfWidth)*drawRadius, ap_y + Math.sin(angleRad - halfWidth)*drawRadius);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(ap_x, ap_y);
        ctx.lineTo(ap_x + Math.cos(angleRad + halfWidth)*drawRadius, ap_y + Math.sin(angleRad + halfWidth)*drawRadius);
        ctx.stroke();
        
        ctx.setLineDash([]);
      });
    });

    // Draw APs (Towers)
    Object.keys(aps).forEach(ap_id => {
       const apPos = aps[ap_id];
       const x = apPos[0] * (width/1000);
       const y = apPos[1] * (height/1000);
       
       // AP Halo
       ctx.beginPath();
       ctx.arc(x, y, 25, 0, 2*Math.PI);
       ctx.fillStyle = 'rgba(2, 132, 199, 0.1)';
       ctx.fill();
       ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
       ctx.lineWidth = 1;
       ctx.stroke();
       
       // AP Core
       ctx.beginPath();
       ctx.roundRect(x - 12, y - 12, 24, 24, 6);
       ctx.fillStyle = '#0F172A';
       ctx.fill();
       
       ctx.fillStyle = '#FFFFFF';
       ctx.font = 'bold 10px Outfit, sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText("5G", x, y + 3);
       
       ctx.fillStyle = '#0F172A';
       ctx.font = 'bold 11px Outfit, sans-serif';
       ctx.fillText("gNodeB Core", x, y + 40);
    });

    // Draw Clients (UEs)
    Object.keys(clients).forEach(client_id => {
       const pos = clients[client_id];
       const sliceReq = mappings[client_id] || 'mMTC';
       const x = pos[0] * (width/1000);
       const y = pos[1] * (height/1000);
       
       const stroke = getStrokeColor(sliceReq);
       
       // UE Shadow
       ctx.beginPath();
       ctx.arc(x, y + 2, 8, 0, 2*Math.PI);
       ctx.fillStyle = 'rgba(0,0,0,0.1)';
       ctx.fill();
       
       // UE Dot
       ctx.beginPath();
       ctx.arc(x, y, 7, 0, 2*Math.PI);
       ctx.fillStyle = '#FFFFFF';
       ctx.fill();
       ctx.strokeStyle = stroke;
       ctx.lineWidth = 3;
       ctx.stroke();
       
       // Label
       ctx.fillStyle = '#0F172A';
       ctx.font = '600 10px Outfit, sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText(sliceReq, x, y - 12);
    });

  }, [aps, clients, beams, mappings]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};

export default BeamVisualizer;
