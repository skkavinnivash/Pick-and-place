import React, { useState } from 'react';
import { useHandGestures } from '../context/HandGestureContext';

export default function HandGestureOverlay() {
  const {
    isCameraEnabled,
    toggleCamera,
    cameraStatus,
    statusMessage,
    errorMessage,
    clearErrorMessage,
    gestureStatus,
    handDetected,
    isPinching,
    pinchProgress,
    cursorPos,
    draggedItem,
    pipMinimized,
    setPipMinimized,
    sensitivity,
    setSensitivity,
    isMirrored,
    setIsMirrored,
    isSimulated,
    setIsSimulated,
    videoRef,
    canvasRef,
    ripples
  } = useHandGestures();

  const [showSettings, setShowSettings] = useState(false);

  // Draggable PIP state with localStorage persistence
  const [pipPos, setPipPos] = useState(() => {
    try {
      const saved = localStorage.getItem('mm_pip_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isDraggingRef = React.useRef(false);
  const dragStartRef = React.useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const pipContainerRef = React.useRef(null);

  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, label, svg, .pip-action-btn')) return;
    const container = pipContainerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    const rect = container.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top
    };

    container.style.transition = 'none';

    const handlePointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvt.clientX - dragStartRef.current.startX;
      const dy = moveEvt.clientY - dragStartRef.current.startY;
      const maxX = Math.max(10, window.innerWidth - rect.width - 10);
      const maxY = Math.max(10, window.innerHeight - rect.height - 10);
      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.initialLeft + dx));
      const newY = Math.max(10, Math.min(maxY, dragStartRef.current.initialTop + dy));

      container.style.bottom = 'auto';
      container.style.right = 'auto';
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (container) {
        container.style.transition = '';
        const finalRect = container.getBoundingClientRect();
        const savedPos = { x: finalRect.left, y: finalRect.top };
        setPipPos(savedPos);
        try {
          localStorage.setItem('mm_pip_pos', JSON.stringify(savedPos));
        } catch {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      {/* Friendly Error Toast if Camera Permission Denied or Device Unavailable */}
      {errorMessage && (
        <div className="gesture-error-toast glass-panel">
          <div className="error-toast-icon">📷</div>
          <div className="error-toast-content">
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f87171' }}>
              Hand Tracking Notice
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {errorMessage}
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={clearErrorMessage}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. Virtual Hand Cursor & Floating Drag Preview                   */}
      {/* ================================================================= */}
      {(isCameraEnabled || isSimulated) && cursorPos.visible && (
        <div
          className={`gesture-virtual-cursor ${isPinching ? 'pinched' : ''} ${
            handDetected ? 'tracking' : 'idle'
          }`}
          style={{
            transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`
          }}
        >
          {/* Outer glow ring */}
          <div className="cursor-ring-outer" />

          {/* Dynamic Pinch Indicator Ring (closes in as pinch progresses) */}
          <div
            className="cursor-pinch-ring"
            style={{
              transform: `scale(${1 - pinchProgress * 0.45})`,
              borderColor: isPinching ? '#10b981' : pinchProgress > 0.5 ? '#f59e0b' : '#06b6d4'
            }}
          />

          {/* Center reticle dot */}
          <div className="cursor-center-dot" />

          {/* Gesture state badge / icon */}
          <div className="cursor-status-icon">
            {isPinching ? '🤏' : '🖐️'}
          </div>

          {/* Floating Dragged Item Preview */}
          {draggedItem && (
            <div className="cursor-dragged-floater glass-panel">
              <span className="floater-emoji">{draggedItem.item.emoji}</span>
              <div className="floater-label">
                <span>Dragging</span>
                <span className="floater-hint">Release over slot</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. Visual Pinch Impact Ripples                                    */}
      {/* ================================================================= */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="gesture-ripple-burst"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      {/* ================================================================= */}
      {/* 3. Floating Picture-in-Picture (PIP) Camera Widget (Draggable)   */}
      {/* ================================================================= */}
      {(isCameraEnabled || isSimulated) && (
        <div
          ref={pipContainerRef}
          className={`gesture-pip-container glass-panel ${pipMinimized ? 'minimized' : ''}`}
          style={pipPos ? { left: `${pipPos.x}px`, top: `${pipPos.y}px`, right: 'auto', bottom: 'auto' } : {}}
        >
          {/* PIP Header Bar (Drag Handle) */}
          <div
            className="pip-header"
            onPointerDown={handlePointerDown}
            style={{ cursor: 'grab' }}
            title="Drag to move camera anywhere on screen"
          >
            <div className="pip-title">
              <span className="pip-drag-handle" style={{ marginRight: '4px', opacity: 0.7 }}>⋮⋮</span>
              <span className="pip-live-indicator" />
              <span style={{ fontWeight: 700 }}>AI Hand Tracking</span>
            </div>

            <div className="pip-header-actions">
              <button
                className="pip-action-btn"
                onClick={() => setShowSettings((prev) => !prev)}
                title="Camera Settings"
                aria-label="Camera Settings"
              >
                ⚙️
              </button>
              <button
                className="pip-action-btn"
                onClick={() => setPipMinimized((prev) => !prev)}
                title={pipMinimized ? 'Expand Camera View' : 'Minimize Camera View'}
                aria-label={pipMinimized ? 'Expand Camera View' : 'Minimize Camera View'}
              >
                {pipMinimized ? '◻' : '−'}
              </button>
              <button
                className="pip-action-btn close"
                onClick={toggleCamera}
                title="Disable Hand Controls"
                aria-label="Disable Hand Controls"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Minimized View Pill */}
          {pipMinimized ? (
            <div
              className="pip-minimized-body"
              onPointerDown={handlePointerDown}
              onClick={() => setPipMinimized(false)}
              style={{ cursor: 'grab' }}
            >
              <span className="pip-mini-badge">
                {gestureStatus}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to expand</span>
            </div>
          ) : (
            /* Expanded View Body */
            <div className="pip-body">
              {/* Camera Video & Canvas Stack */}
              <div className="pip-video-wrapper">
                <video
                  ref={videoRef}
                  className={`pip-video-feed ${isMirrored ? 'mirrored' : ''}`}
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className={`pip-canvas-overlay ${isMirrored ? 'mirrored' : ''}`}
                  width={320}
                  height={240}
                />

                {/* Status Overlay if loading or error */}
                {cameraStatus !== 'active' && (
                  <div className="pip-status-overlay">
                    <div className="spinner-dots" />
                    <p className="pip-status-text">{statusMessage || 'Initializing...'}</p>
                  </div>
                )}

                {/* Simple 4-State Status Indicator */}
                {cameraStatus === 'active' && (
                  <div className="pip-gesture-hud">
                    <span
                      className={`pip-hud-badge ${
                        gestureStatus === 'Object Selected'
                          ? 'active-pinch'
                          : gestureStatus === 'Object Placed'
                          ? 'active-placed'
                          : gestureStatus === 'Hand Detected'
                          ? 'active-track'
                          : 'searching'
                      }`}
                    >
                      {gestureStatus === 'Object Selected' && '🤏 '}
                      {gestureStatus === 'Object Placed' && '✨ '}
                      {gestureStatus === 'Hand Detected' && '🖐️ '}
                      {gestureStatus === 'No Hand Detected' && '🔍 '}
                      {gestureStatus.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Settings Panel */}
              {showSettings && (
                <div className="pip-settings-panel">
                  <div className="pip-setting-row">
                    <label>Mirror Camera</label>
                    <input
                      type="checkbox"
                      checked={isMirrored}
                      onChange={(e) => setIsMirrored(e.target.checked)}
                    />
                  </div>

                  <div className="pip-setting-row">
                    <label>Sensitivity ({sensitivity}x)</label>
                    <input
                      type="range"
                      min="1.0"
                      max="2.2"
                      step="0.2"
                      value={sensitivity}
                      onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="pip-setting-row">
                    <label>Mouse Pinch Sim (Alt+Click)</label>
                    <input
                      type="checkbox"
                      checked={isSimulated}
                      onChange={(e) => setIsSimulated(e.target.checked)}
                    />
                  </div>
                </div>
              )}

              {/* Gesture Quick Instructions */}
              <div className="pip-instructions">
                <div className="instruction-step">
                  <span className="inst-icon">🖐️</span>
                  <span>Move index finger to aim</span>
                </div>
                <div className="instruction-step">
                  <span className="inst-icon">🤏</span>
                  <span>Pinch thumb + index to grab</span>
                </div>
                <div className="instruction-step">
                  <span className="inst-icon">✨</span>
                  <span>Release pinch to place</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
