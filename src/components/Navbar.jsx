import React from 'react';
import { useHandGestures } from '../context/HandGestureContext';

export default function Navbar({
  phase,
  difficulty,
  soundMuted,
  onToggleSound,
  onOpenRules,
  onOpenHighScores,
  onGoHome
}) {
  const { isCameraEnabled, toggleCamera, handDetected, isPinching, gestureStatus } = useHandGestures();

  return (
    <header className="game-navbar glass-panel">
      <button className="nav-brand" onClick={onGoHome} title="Return to Home Screen">
        <span className="nav-logo-icon">🧠</span>
        <div>
          <h1 className="nav-title gradient-text-purple">Memory Master</h1>
          <p className="nav-tagline">60-Second Challenge</p>
        </div>
      </button>

      <div className="nav-actions">
        {phase !== 'home' && (
          <span className="nav-chip" style={{ color: difficulty?.color || '#a855f7' }}>
            <span style={{ fontSize: '0.85rem' }}>🎯</span> {difficulty?.name} ({difficulty?.itemCount} Items)
          </span>
        )}

        {/* Hand Gesture Camera Toggle Button */}
        <button
          className={`btn ${isCameraEnabled ? 'btn-nav-cam-active' : 'btn-secondary'} nav-cam-btn`}
          onClick={toggleCamera}
          title={isCameraEnabled ? 'Disable Hand Controls' : 'Enable Hand Controls (Play hands-free with webcam)'}
          aria-label={isCameraEnabled ? 'Disable Hand Controls' : 'Enable Hand Controls'}
          data-gesture-btn="true"
        >
          <span className="cam-btn-icon">{isPinching ? '🤏' : '🖐️'}</span>
          <span className="cam-btn-text">
            {isCameraEnabled ? 'Disable Hand Controls' : 'Enable Hand Controls'}
          </span>
          {isCameraEnabled && (
            <span
              className={`cam-status-dot ${handDetected ? 'tracking' : 'searching'}`}
              title={`Status: ${gestureStatus}`}
            />
          )}
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleSound}
          title={soundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          aria-label={soundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          data-gesture-btn="true"
        >
          {soundMuted ? '🔇' : '🔊'}
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenHighScores}
          title="View High Scores"
          aria-label="View High Scores"
          data-gesture-btn="true"
        >
          🏆
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenRules}
          title="Game Rules & Guide"
          aria-label="Game Rules & Guide"
          data-gesture-btn="true"
        >
          ❓
        </button>
      </div>
    </header>
  );
}
