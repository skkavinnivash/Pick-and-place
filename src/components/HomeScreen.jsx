import React from 'react';
import { DIFFICULTY_CONFIG, OBJECT_LIBRARY } from '../data/objects';
import { soundFx } from '../utils/audio';
import { useHandGestures } from '../context/HandGestureContext';

export default function HomeScreen({
  selectedDifficulty,
  onSelectDifficulty,
  onStartGame,
  highScores,
  onOpenRules
}) {
  const { isCameraEnabled, toggleCamera, isPinching } = useHandGestures();

  const handleDifficultyClick = (diffKey) => {
    soundFx.pickup();
    onSelectDifficulty(diffKey);
  };

  const handleStartClick = () => {
    soundFx.pickup();
    onStartGame();
  };

  // Sample items for the animated showcase ticker
  const showcaseItems = OBJECT_LIBRARY.slice(0, 24);

  return (
    <div className="home-screen">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-badge">
          <span>⚡</span> 60-Second Blitz Memory Arena
        </div>

        <h1 className="hero-title gradient-text-purple">Memory Master</h1>

        <p className="hero-subtitle">
          “Observe. Remember. Match. Win!”
        </p>

        <p className="hero-desc">
          Test your observation speed, spatial recall, and focus under pressure. Memorize 
          items in their numbered slots for 15 seconds, then reconstruct the exact sequence 
          from a scrambled collection in just 60 seconds!
        </p>
      </div>

      {/* Hand Gesture Feature Showcase Banner */}
      <div className={`home-gesture-banner glass-panel ${isCameraEnabled ? 'enabled' : ''}`}>
        <div className="home-gesture-left">
          <div className="home-gesture-icon-orb">
            <span>{isPinching ? '🤏' : '🖐️'}</span>
          </div>
          <div>
            <div className="home-gesture-heading">
              <span className="home-gesture-title">Webcam Hand Gestures</span>
              <span className={`home-gesture-tag ${isCameraEnabled ? 'active' : ''}`}>
                {isCameraEnabled ? 'CAMERA ACTIVE' : 'NEW FEATURE'}
              </span>
            </div>
            <p className="home-gesture-text">
              Play entirely hands-free! <strong>Pinch index & thumb</strong> to select and drag objects, then release to place.
            </p>
          </div>
        </div>
        <button
          className={`btn ${isCameraEnabled ? 'btn-accent' : 'btn-secondary'} home-gesture-toggle-btn`}
          onClick={toggleCamera}
          data-gesture-btn="true"
          title={isCameraEnabled ? 'Disable Hand Controls' : 'Enable Hand Controls'}
        >
          <span>{isCameraEnabled ? '✓ Hand Controls Active' : '📷 Enable Hand Controls'}</span>
        </button>
      </div>

      {/* Rules Overview */}
      <div className="rules-row">
        <div className="rule-step-card glass-panel">
          <div className="rule-step-num">1</div>
          <div className="rule-icon">👁️</div>
          <h3 className="rule-step-title">Observe (15s)</h3>
          <p className="rule-step-desc">
            Memorize objects, their names, and their exact numbered slot positions on the grid.
          </p>
        </div>

        <div className="rule-step-card glass-panel">
          <div className="rule-step-num">2</div>
          <div className="rule-icon">🌀</div>
          <h3 className="rule-step-title">Shuffle & Hide</h3>
          <p className="rule-step-desc">
            All names and arrangements vanish! Objects appear scrambled in a collection tray.
          </p>
        </div>

        <div className="rule-step-card glass-panel">
          <div className="rule-step-num">3</div>
          <div className="rule-icon">🎯</div>
          <h3 className="rule-step-title">Match & Win (60s)</h3>
          <p className="rule-step-desc">
            Drag or tap each item back to its original slot. Score 10 points for every correct match!
          </p>
        </div>
      </div>

      {/* Difficulty Level Selector */}
      <div className="difficulty-section">
        <div className="section-label">
          <span>Choose Your Challenge Level</span>
          <button
            onClick={onOpenRules}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            How scoring works
          </button>
        </div>

        <div className="difficulty-cards-grid">
          {Object.keys(DIFFICULTY_CONFIG).map((key) => {
            const diff = DIFFICULTY_CONFIG[key];
            const isSelected = selectedDifficulty === key;
            const record = highScores[key] || { score: 0, accuracy: 0 };
            const maxScore = diff.itemCount * 10;

            return (
              <div
                key={key}
                data-gesture-btn="true"
                className={`diff-card glass-panel ${isSelected ? 'selected' : ''}`}
                style={{ '--card-color': diff.color }}
                onClick={() => handleDifficultyClick(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleDifficultyClick(key);
                  }
                }}
              >
                <div className="diff-header">
                  <span className="diff-title" style={{ color: isSelected ? diff.color : '#fff' }}>
                    {diff.name}
                  </span>
                  <span className="diff-badge" style={{ backgroundColor: diff.color }}>
                    {diff.badge}
                  </span>
                </div>

                <div className="diff-count" style={{ color: diff.color }}>
                  {diff.itemCount}
                </div>
                <div className="diff-count-label">Objects to remember</div>

                <p className="diff-desc">{diff.description}</p>

                <div className="diff-highscore">
                  <span>🏆 Best:</span>
                  <strong>{record.score} / {maxScore} pts</strong>
                  {record.score > 0 && <span style={{ opacity: 0.8 }}>({record.accuracy}%)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button Hero Action */}
      <div className="start-cta-section">
        <button
          className="btn btn-primary btn-start-hero pulse-glow"
          data-gesture-btn="true"
          onClick={handleStartClick}
          aria-label="Start Game"
        >
          <span>🚀</span> Start Game ({DIFFICULTY_CONFIG[selectedDifficulty]?.name} Mode)
        </button>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Press Start to begin the 15-second memory preview
        </p>
      </div>

      {/* Animated Objects Showcase Ticker */}
      <div className="object-ticker-section">
        <div className="ticker-track">
          {[...showcaseItems, ...showcaseItems].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="ticker-item">
              <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
