import React, { useRef, useEffect } from 'react';

const BeamVisualizer = ({ aps, clients, beams, mappings }) => {
  const canvasRef = useRef(null);
  const propsRef = useRef({ aps, clients, beams, mappings });
  const spawnTimesRef = useRef({});

  // Update refs without triggering re-render of canvas setup
  useEffect(() => {
    const now = Date.now();
    if (beams) {
      Object.keys(beams).forEach(ap_id => {
        beams[ap_id].forEach(beam => {
          if (!spawnTimesRef.current[beam.target]) {
            spawnTimesRef.current[beam.target] = now;
          }
        });
      });
      
      // Cleanup disconnected clients
      Object.keys(spawnTimesRef.current).forEach(target => {
        let found = false;
        Object.keys(beams).forEach(ap_id => {
          if (beams[ap_id].some(b => b.target === target)) found = true;
        });
        if (!found) delete spawnTimesRef.current[target];
      });
    }
    propsRef.current = { aps, clients, beams, mappings };
  }, [aps, clients, beams, mappings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement;
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * 2;
      canvas.height = height * 2;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(2, 2);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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

    const render = () => {
      const { aps, clients, beams, mappings } = propsRef.current;
      const now = Date.now();

      // Clear and draw background
      ctx.clearRect(0, 0, width, height);
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

      const maxDrawRadius = Math.max(width, height) * 0.8;

      // Draw Beams
      if (beams && aps) {
        Object.keys(beams).forEach(ap_id => {
          const apPos = aps[ap_id];
          if (!apPos) return;
          
          const ap_x = width / 2;
          const ap_y = height / 2;

          beams[ap_id].forEach(beam => {
            const sliceReq = mappings[beam.target] || 'mMTC';
            const spawnTime = spawnTimesRef.current[beam.target] || now;
            const age = now - spawnTime;
            
            // Animate beam radius over 1.5s
            const progress = Math.min(1, age / 1500); 
            // Use easeOutCubic for smoother effect
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const drawRadius = maxDrawRadius * easeProgress;
            
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

            // Draw flow particles (Data packets)
            if (easeProgress > 0.1) {
              const numParticles = 8;
              
              const drawArrow = (x, y, rotation, color) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                
                // Draw tail
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-10, 0); // medium tail
                ctx.lineTo(2, 0);
                ctx.stroke();
                
                // Draw head
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(10, 0); // tip
                ctx.lineTo(-2, -5); // top back
                ctx.lineTo(1, 0);  // inset
                ctx.lineTo(-2, 5);  // bottom back
                ctx.fill();
                
                ctx.restore();
              };

              for (let i = 0; i < numParticles; i++) {
                // Downlink (Outward) - Blue - Slower, smoother speed
                const offsetDown = ((now / 2500) + (i / numParticles)) % 1;
                const rDown = drawRadius * offsetDown;
                // Scale lateral offset by distance so arrows stay inside narrow beam near center
                const latOffsetDown = Math.min(10, rDown * 0.1);
                const downX = ap_x + Math.cos(angleRad)*rDown + Math.cos(angleRad - Math.PI/2)*latOffsetDown;
                const downY = ap_y + Math.sin(angleRad)*rDown + Math.sin(angleRad - Math.PI/2)*latOffsetDown;
                drawArrow(downX, downY, angleRad, '#0284C7');
                
                // Uplink (Inward) - Green - Slower, smoother speed
                const offsetUp = 1 - (((now / 3000) + (i / numParticles)) % 1);
                const rUp = drawRadius * offsetUp;
                const latOffsetUp = Math.min(10, rUp * 0.1);
                const upX = ap_x + Math.cos(angleRad)*rUp + Math.cos(angleRad + Math.PI/2)*latOffsetUp;
                const upY = ap_y + Math.sin(angleRad)*rUp + Math.sin(angleRad + Math.PI/2)*latOffsetUp;
                drawArrow(upX, upY, angleRad + Math.PI, '#059669');
              }
            }
          });
        });
      }

      // Draw APs (Towers)
      if (aps) {
        Object.keys(aps).forEach(ap_id => {
           const apPos = aps[ap_id];
           const x = width / 2;
           const y = height / 2;
           
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
           ctx.textBaseline = 'alphabetic';
           ctx.fillText("5G", x, y + 3);
           
           ctx.fillStyle = '#0F172A';
           ctx.font = 'bold 11px Outfit, sans-serif';
           ctx.fillText("gNodeB Core", x, y + 40);
        });
      }

      // Draw Clients (UEs)
      if (clients && mappings) {
        const getSliceSize = (sliceReq) => {
            if(sliceReq === 'URLLC') return 12; // Car - largest
            if(sliceReq === 'eMBB') return 10.2; // 4K - 15% smaller
            return 8.6; // IoT - 15% smaller again
        };

        Object.keys(clients).forEach(client_id => {
           const pos = clients[client_id];
           const sliceReq = mappings[client_id] || 'mMTC';
           const x = pos[0] * (width/1000);
           const y = pos[1] * (height/1000);
           
           const stroke = getStrokeColor(sliceReq);
           const ueSize = getSliceSize(sliceReq);
           
           // UE Shadow
           ctx.beginPath();
           ctx.arc(x, y + 3, ueSize + 2, 0, 2*Math.PI);
           ctx.fillStyle = 'rgba(0,0,0,0.15)';
           ctx.fill();
           
           // UE Dot
           ctx.beginPath();
           ctx.arc(x, y, ueSize, 0, 2*Math.PI);
           ctx.fillStyle = '#FFFFFF';
           ctx.fill();
           ctx.strokeStyle = stroke;
           ctx.lineWidth = 4;
           ctx.stroke();
           
           // Label
           ctx.fillStyle = '#0F172A';
           ctx.font = '800 12px Outfit, sans-serif';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'alphabetic';
           ctx.fillText(sliceReq, x, y - (ueSize + 6));
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};

export default BeamVisualizer;
