import React, { useRef, useEffect, useState, useCallback } from 'react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5.0;
const ZOOM_SPEED = 0.001;

const BeamVisualizer = ({ aps, clients, beams, mappings, theme }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const propsRef = useRef({ aps, clients, beams, mappings, theme });
  const spawnTimesRef = useRef({});
  // Smoothed render positions for UE dots — interpolated each animation frame
  // so movement looks silky at 60fps even though the server ticks at 15Hz
  const renderPositionsRef = useRef({});

  // Viewport state stored in a ref so the render loop reads latest values without
  // needing to re-run the canvas setup effect.
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Expose zoom level to React state only for HUD label (avoids expensive re-renders)
  const [zoomLabel, setZoomLabel] = useState('100%');

  // Pan state
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  // Touch pinch state
  const pinchRef = useRef({ active: false, lastDist: 0 });

  // ─── Viewport helpers ─────────────────────────────────────────────────────
  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const applyZoom = useCallback((delta, pivotX, pivotY) => {
    const vp = viewportRef.current;
    const newZoom = clampZoom(vp.zoom + delta * vp.zoom);
    // Adjust pan so zoom feels centred on the cursor/pinch point
    vp.x = pivotX - (pivotX - vp.x) * (newZoom / vp.zoom);
    vp.y = pivotY - (pivotY - vp.y) * (newZoom / vp.zoom);
    vp.zoom = newZoom;
    setZoomLabel(`${Math.round(newZoom * 100)}%`);
  }, []);

  const resetView = useCallback(() => {
    viewportRef.current = { x: 0, y: 0, zoom: 1 };
    setZoomLabel('100%');
  }, []);

  const stepZoom = useCallback((direction) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    applyZoom(direction * 0.3, rect.width / 2, rect.height / 2);
  }, [applyZoom]);

  // ─── Update refs when props change ────────────────────────────────────────
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

      Object.keys(spawnTimesRef.current).forEach(target => {
        let found = false;
        Object.keys(beams).forEach(ap_id => {
          if (beams[ap_id].some(b => b.target === target)) found = true;
        });
        if (!found) delete spawnTimesRef.current[target];
      });
    }
    propsRef.current = { aps, clients, beams, mappings, theme };
  }, [aps, clients, beams, mappings, theme]);

  // ─── Canvas setup & render loop ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
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

    // ── Mouse wheel zoom ──
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      applyZoom(-e.deltaY * ZOOM_SPEED, e.clientX - rect.left, e.clientY - rect.top);
    };

    // ── Mouse drag pan ──
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: viewportRef.current.x,
        originY: viewportRef.current.y,
      };
      canvas.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      if (!dragRef.current.active) return;
      viewportRef.current.x = dragRef.current.originX + (e.clientX - dragRef.current.startX);
      viewportRef.current.y = dragRef.current.originY + (e.clientY - dragRef.current.startY);
    };

    const onMouseUp = () => {
      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
    };

    // ── Touch pan + pinch zoom ──
    const getTouchDist = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const getTouchMid = (t, rect) => ({
      x: (t[0].clientX + t[1].clientX) / 2 - rect.left,
      y: (t[0].clientY + t[1].clientY) / 2 - rect.top,
    });

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchRef.current = { active: true, lastDist: getTouchDist(e.touches) };
      } else if (e.touches.length === 1) {
        dragRef.current = {
          active: true,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          originX: viewportRef.current.x,
          originY: viewportRef.current.y,
        };
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current.active) {
        const dist = getTouchDist(e.touches);
        const rect = canvas.getBoundingClientRect();
        const mid = getTouchMid(e.touches, rect);
        const delta = (dist - pinchRef.current.lastDist) * 0.01;
        applyZoom(delta, mid.x, mid.y);
        pinchRef.current.lastDist = dist;
      } else if (e.touches.length === 1 && dragRef.current.active) {
        viewportRef.current.x = dragRef.current.originX + (e.touches[0].clientX - dragRef.current.startX);
        viewportRef.current.y = dragRef.current.originY + (e.touches[0].clientY - dragRef.current.startY);
      }
    };

    const onTouchEnd = () => {
      dragRef.current.active = false;
      pinchRef.current.active = false;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.style.cursor = 'grab';

    // ── Color helpers ──
    const getSliceColor = (sliceReq) => {
      if (sliceReq === 'URLLC') return 'rgba(225, 29, 72, 0.2)';
      if (sliceReq === 'eMBB') return 'rgba(2, 132, 199, 0.2)';
      return 'rgba(5, 150, 105, 0.2)';
    };

    const getStrokeColor = (sliceReq) => {
      if (sliceReq === 'URLLC') return '#E11D48';
      if (sliceReq === 'eMBB') return '#0284C7';
      return '#059669';
    };

    // ── Main render loop ──
    const render = () => {
      const { aps, clients, beams, mappings, theme } = propsRef.current;
      const { x: panX, y: panY, zoom } = viewportRef.current;
      const now = Date.now();
      const isDark = theme === 'dark';

      // Clear full canvas
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isDark ? '#0F172A' : '#FAFCFF';
      ctx.fillRect(0, 0, width, height);

      // Apply viewport transform for everything inside the world
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // ── Grid (drawn in world space so it scrolls/zooms with scene) ──
      const minX = -panX / zoom;
      const maxX = (width - panX) / zoom;
      const minY = -panY / zoom;
      const maxY = (height - panY) / zoom;
      
      const startX = Math.floor(minX / 40) * 40;
      const startY = Math.floor(minY / 40) * 40;

      ctx.strokeStyle = isDark ? '#1E293B' : '#E2E8F0';
      ctx.lineWidth = 1 / zoom;
      for (let i = startX - 40; i <= maxX + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, minY); ctx.lineTo(i, maxY); ctx.stroke();
      }
      for (let i = startY - 40; i <= maxY + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(minX, i); ctx.lineTo(maxX, i); ctx.stroke();
      }
      ctx.strokeStyle = isDark ? '#0F172A' : '#F1F5F9';
      for (let i = startX - 20; i <= maxX + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, minY); ctx.lineTo(i, maxY); ctx.stroke();
      }
      for (let i = startY - 20; i <= maxY + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(minX, i); ctx.lineTo(maxX, i); ctx.stroke();
      }

      const maxDrawRadius = Math.max(width, height) * 0.8;

      // ── Beams ──
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
            const progress = Math.min(1, age / 1500);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const drawRadius = maxDrawRadius * easeProgress;

            ctx.beginPath();
            ctx.moveTo(ap_x, ap_y);
            
            // Calculate angle directly to the visually rendered (lerped) position
            // so the beam perfectly tracks the moving dot without dragging ahead.
            let angleRad = beam.angle * (Math.PI / 180);
            const renderPos = renderPositionsRef.current[beam.target];
            if (renderPos) {
              angleRad = Math.atan2(renderPos.y - ap_y, renderPos.x - ap_x);
            }
            
            const halfWidth = (beam.width / 2) * (Math.PI / 180);
            ctx.arc(ap_x, ap_y, drawRadius, angleRad - halfWidth, angleRad + halfWidth);
            ctx.closePath();

            const grad = ctx.createRadialGradient(ap_x, ap_y, 0, ap_x, ap_y, drawRadius);
            grad.addColorStop(0, getSliceColor(sliceReq));
            grad.addColorStop(0.5, getSliceColor(sliceReq));
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = getStrokeColor(sliceReq);
            ctx.lineWidth = 1.5 / zoom;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(ap_x, ap_y);
            ctx.lineTo(ap_x + Math.cos(angleRad - halfWidth) * drawRadius, ap_y + Math.sin(angleRad - halfWidth) * drawRadius);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ap_x, ap_y);
            ctx.lineTo(ap_x + Math.cos(angleRad + halfWidth) * drawRadius, ap_y + Math.sin(angleRad + halfWidth) * drawRadius);
            ctx.stroke();
            ctx.setLineDash([]);

            if (easeProgress > 0.1) {
              const numParticles = 8;
              const drawArrow = (x, y, rotation, color) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2 / zoom;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(2, 0);
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-2, -5);
                ctx.lineTo(1, 0);
                ctx.lineTo(-2, 5);
                ctx.fill();
                ctx.restore();
              };

              for (let i = 0; i < numParticles; i++) {
                const offsetDown = ((now / 2500) + (i / numParticles)) % 1;
                const rDown = drawRadius * offsetDown;
                const latOffsetDown = Math.min(10, rDown * 0.1);
                const downX = ap_x + Math.cos(angleRad) * rDown + Math.cos(angleRad - Math.PI / 2) * latOffsetDown;
                const downY = ap_y + Math.sin(angleRad) * rDown + Math.sin(angleRad - Math.PI / 2) * latOffsetDown;
                drawArrow(downX, downY, angleRad, '#0284C7');

                const offsetUp = 1 - (((now / 3000) + (i / numParticles)) % 1);
                const rUp = drawRadius * offsetUp;
                const latOffsetUp = Math.min(10, rUp * 0.1);
                const upX = ap_x + Math.cos(angleRad) * rUp + Math.cos(angleRad + Math.PI / 2) * latOffsetUp;
                const upY = ap_y + Math.sin(angleRad) * rUp + Math.sin(angleRad + Math.PI / 2) * latOffsetUp;
                drawArrow(upX, upY, angleRad + Math.PI, '#059669');
              }
            }
          });
        });
      }

      // ── AP Tower ──
      if (aps) {
        Object.keys(aps).forEach(() => {
          const x = width / 2;
          const y = height / 2;
          ctx.beginPath();
          ctx.arc(x, y, 25, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(2, 132, 199, 0.1)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(x - 12, y - 12, 24, 24, 6);
          ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
          ctx.fill();

          ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
          ctx.font = `bold ${Math.max(8, 10 / zoom)}px Outfit, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('5G', x, y + 3);

          ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
          ctx.font = `bold ${Math.max(8, 11 / zoom)}px Outfit, sans-serif`;
          ctx.fillText('gNodeB Core', x, y + 40);
        });
      }

      // ── UEs ──
      if (clients && mappings) {
        const getSliceSize = (sliceReq) => {
          if (sliceReq === 'URLLC') return 12;
          if (sliceReq === 'eMBB') return 10.2;
          return 8.6;
        };

        const LERP_FACTOR = 0.18;
        const renderPos = renderPositionsRef.current;

        Object.keys(clients).forEach(client_id => {
          const serverPos = clients[client_id];
          const sliceReq = mappings[client_id] || 'mMTC';
          const ueSize = getSliceSize(sliceReq);
          const stroke = getStrokeColor(sliceReq);

          if (!renderPos[client_id]) {
            renderPos[client_id] = { x: serverPos[0] * (width / 1000), y: serverPos[1] * (height / 1000) };
          }

          renderPos[client_id].x += (serverPos[0] * (width / 1000) - renderPos[client_id].x) * LERP_FACTOR;
          renderPos[client_id].y += (serverPos[1] * (height / 1000) - renderPos[client_id].y) * LERP_FACTOR;

          const x = renderPos[client_id].x;
          const y = renderPos[client_id].y;

          // Shadow
          ctx.beginPath();
          ctx.arc(x, y + 3, ueSize + 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(x, y, ueSize, 0, 2 * Math.PI);
          ctx.fillStyle = isDark ? '#1E293B' : '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 4 / zoom;
          ctx.stroke();

          // Label
          ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
          ctx.font = `800 ${Math.max(9, 12 / zoom)}px Outfit, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(sliceReq, x, y - (ueSize + 6));
        });

        // Cleanup render positions for removed clients
        Object.keys(renderPos).forEach(id => {
          if (!clients[id]) delete renderPos[id];
        });
      }

      // Restore to screen space
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [applyZoom]);

  // ─── HUD styles ───────────────────────────────────────────────────────────
  const hudBase = {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    bottom: '16px',
    right: '16px',
  };

  const btnStyle = {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--panel-bg)',
    color: 'var(--text-primary)',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.15s ease',
    lineHeight: 1,
    userSelect: 'none',
  };

  const labelStyle = {
    background: 'var(--panel-bg)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textAlign: 'center',
    padding: '3px 0',
    boxShadow: 'var(--shadow-sm)',
    letterSpacing: '0.5px',
    userSelect: 'none',
  };

  const resetBtnStyle = {
    ...btnStyle,
    fontSize: '14px',
    height: '28px',
  };

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Zoom / Pan HUD */}
      <div style={hudBase}>
        <div style={labelStyle}>{zoomLabel}</div>
        <button
          style={btnStyle}
          onClick={() => stepZoom(1)}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--panel-bg)'; }}
          aria-label="Zoom in"
          title="Zoom In (scroll wheel)"
        >+</button>
        <button
          style={btnStyle}
          onClick={() => stepZoom(-1)}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--panel-bg)'; }}
          aria-label="Zoom out"
          title="Zoom Out (scroll wheel)"
        >−</button>
        <button
          style={resetBtnStyle}
          onClick={resetView}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--panel-bg)'; }}
          aria-label="Reset view"
          title="Reset View"
        >⌂</button>
      </div>
    </div>
  );
};

export default BeamVisualizer;
