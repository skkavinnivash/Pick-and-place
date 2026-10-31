import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/audio';

export default function ResultsScreen({
  originalSlots,
  placements,
  timeUsed,
  difficultyConfig,
  isNewHigh,
  onPlayAgain,
  onChangeDifficulty,
  onGoHome
}) {
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'side-by-side'
  const [copied, setCopied] = useState(false);

  const totalItems = originalSlots.length;
  const maxScore = totalItems * 10;

  // Calculate scores and matches cleanly with useMemo
  const { comparisonRows, correctCount } = React.useMemo(() => {
    let count = 0;
    const rows = originalSlots.map((orig) => {
      const slotNum = orig.originalSlot;
      const placedItem = placements[slotNum] || null;
      const isCorrect = placedItem && placedItem.id === orig.id;
      if (isCorrect) {
        count += 1;
      }
      return {
        slotNum,
        original: orig,
        placed: placedItem,
        isCorrect
      };
    });
    return { comparisonRows: rows, correctCount: count };
  }, [originalSlots, placements]);

  const finalScore = correctCount * 10;
  const accuracy = Math.round((correctCount / totalItems) * 100);

  // Performance Tier Assessment
  let performanceTitle = 'Practice Makes Perfect!';
  let performanceDesc = 'Keep training your brain to retain patterns under time pressure!';
  let tierBadge = '🌱';
  let tierColor = '#60a5fa';

  if (accuracy === 100) {
    performanceTitle = 'GODLIKE MEMORY! PERFECT SCORE!';
    performanceDesc = 'Incredible photographic recall! You mastered both the objects and their exact positions in record time!';
    tierBadge = '🌟';
    tierColor = '#facc15';
  } else if (accuracy >= 80) {
    performanceTitle = 'MEMORY MASTER! OUTSTANDING!';
    performanceDesc = 'Phenomenal observation and spatial memory! You easily rank among top mental athletes!';
    tierBadge = '🏆';
    tierColor = '#10b981';
  } else if (accuracy >= 60) {
    performanceTitle = 'SHARP MIND! GREAT EFFORT!';
    performanceDesc = 'Very impressive concentration! A few more rounds and you will achieve perfection.';
    tierBadge = '🧠';
    tierColor = '#38bdf8';
  } else if (accuracy >= 40) {
    performanceTitle = 'GOOD TRY! REFLEXES SHARPENING!';
    performanceDesc = 'Nice effort! The 60-second clock is intense, but your focus is building fast.';
    tierBadge = '⚡';
    tierColor = '#fb923c';
  }

  // Confetti trigger & victory fanfare
  useEffect(() => {
    soundFx.victory(accuracy >= 60);

    if (accuracy >= 60) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 }
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 }
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [accuracy]);

  // Copy results summary to clipboard
  const handleCopySummary = () => {
    const text = `🧠 Memory Master – 60 Second Challenge\n🎯 Difficulty: ${difficultyConfig.name} (${totalItems} items)\n🏆 Score: ${finalScore}/${maxScore} pts (${accuracy}%)\n⏱️ Time: ${timeUsed}s / 60s\n${accuracy === 100 ? '🌟 PERFECT SCORE!' : '🔥 Can you beat my score?'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="results-screen">
      {/* Hero Performance Card */}
      <div className="results-hero-card glass-panel" style={{ borderColor: `${tierColor}55` }}>
        <div className="results-tier-badge">{tierBadge}</div>

        <h2 className="results-title" style={{ color: tierColor }}>
          {performanceTitle}
        </h2>

        <p className="results-subtitle">{performanceDesc}</p>

        {isNewHigh && (
          <div
            style={{
              padding: '0.4rem 1.2rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)'
            }}
          >
            <span>🎉</span> NEW PERSONAL BEST!
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="results-stats-row">
          <div className="stat-box">
            <span className="stat-box-val" style={{ color: '#fde047' }}>
              {finalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {maxScore}</span>
            </span>
            <span className="stat-box-label">Final Score</span>
          </div>

          <div className="stat-box">
            <span className="stat-box-val" style={{ color: '#10b981' }}>
              {correctCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {totalItems}</span>
            </span>
            <span className="stat-box-label">Correct Placements</span>
          </div>

          <div className="stat-box">
            <span className="stat-box-val" style={{ color: accuracy >= 70 ? '#38bdf8' : '#fb923c' }}>
              {accuracy}%
            </span>
            <span className="stat-box-label">Accuracy</span>
          </div>

          <div className="stat-box">
            <span className="stat-box-val" style={{ color: '#a855f7' }}>
              {timeUsed}s
            </span>
            <span className="stat-box-label">Time Used</span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="results-actions-bar">
          <button className="btn btn-primary" onClick={onPlayAgain} title="Play same difficulty with fresh objects">
            <span>🔄</span> Play Again
          </button>

          <button className="btn btn-secondary" onClick={onChangeDifficulty} title="Choose Easy, Medium, or Hard">
            <span>⚡</span> Change Difficulty
          </button>

          <button className="btn btn-secondary" onClick={onGoHome} title="Return to Home Screen">
            <span>🏠</span> Home
          </button>

          <button className="btn btn-secondary" onClick={handleCopySummary} title="Copy results summary">
            <span>📋</span> {copied ? 'Copied!' : 'Share Score'}
          </button>
        </div>
      </div>

      {/* Reveal & Verification Section */}
      <div className="comparison-section glass-panel" style={{ padding: '1.4rem' }}>
        <div className="comparison-tabs-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              <span>🔍</span> Placement Verification & Answer Reveal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Compare your placements with the original preview arrangement. Green = Correct (+10 pts), Red = Incorrect (0 pts).
            </p>
          </div>

          <div className="comparison-toggle-group">
            <button
              className={`comp-tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('breakdown')}
            >
              Detailed List
            </button>
            <button
              className={`comp-tab-btn ${activeTab === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setActiveTab('side-by-side')}
            >
              Side-by-Side Grids
            </button>
          </div>
        </div>

        {/* VIEW 1: Detailed List Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="slots-breakdown-grid">
            {comparisonRows.map((row) => (
              <div
                key={row.slotNum}
                className={`breakdown-row ${row.isCorrect ? 'is-correct' : 'is-wrong'}`}
              >
                <div className="breakdown-slot-id">
                  Slot #{row.slotNum}
                </div>

                {/* Original Object */}
                <div className="breakdown-item-view">
                  <span className="breakdown-item-emoji">{row.original.emoji}</span>
                  <div>
                    <div className="breakdown-item-name">{row.original.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Original Target
                    </div>
                  </div>
                </div>

                {/* Player's Placement */}
                <div className="breakdown-item-view">
                  {row.placed ? (
                    <>
                      <span className="breakdown-item-emoji">{row.placed.emoji}</span>
                      <div>
                        <div className="breakdown-item-name">{row.placed.name}</div>
                        <div style={{ fontSize: '0.72rem', color: row.isCorrect ? '#34d399' : '#f87171' }}>
                          Your Placement
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      (Empty - Not Placed)
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div style={{ textAlign: 'right' }}>
                  {row.isCorrect ? (
                    <span className="status-pill correct">
                      <span>✓</span> Correct (+10 pts)
                    </span>
                  ) : (
                    <span className="status-pill wrong">
                      <span>✗</span> {row.placed ? 'Mismatch' : 'Empty'} (0 pts)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: Side-by-Side Arrangement Grids */}
        {activeTab === 'side-by-side' && (
          <div className="dual-grids-layout">
            {/* Original Arrangement Grid */}
            <div className="dual-grid-col">
              <div className="dual-grid-col-title" style={{ color: 'var(--accent-cyan)' }}>
                <span>👁️</span> Original Arrangement (Preview)
              </div>
              <div className="game-grid-container grid-cols-5" style={{ gap: '0.6rem' }}>
                {originalSlots.map((orig) => (
                  <div key={orig.id} className="result-card">
                    <div className="slot-tag">#{orig.originalSlot}</div>
                    <div className="result-card-emoji">{orig.emoji}</div>
                    <div className="result-card-name">{orig.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player's Final Grid */}
            <div className="dual-grid-col">
              <div className="dual-grid-col-title" style={{ color: 'var(--accent-purple)' }}>
                <span>🎯</span> Your Final Placements
              </div>
              <div className="game-grid-container grid-cols-5" style={{ gap: '0.6rem' }}>
                {originalSlots.map((orig) => {
                  const slotNum = orig.originalSlot;
                  const placed = placements[slotNum];
                  const isCorrect = placed && placed.id === orig.id;

                  return (
                    <div
                      key={slotNum}
                      className={`result-card ${
                        isCorrect ? 'correct-halo' : placed ? 'wrong-halo' : ''
                      }`}
                      style={{
                        borderColor: isCorrect ? '#10b981' : placed ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="slot-tag">#{slotNum}</div>
                      {placed ? (
                        <>
                          <div className="result-card-emoji">{placed.emoji}</div>
                          <div
                            className="result-card-name"
                            style={{ color: isCorrect ? '#34d399' : '#f87171' }}
                          >
                            {placed.name}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 'auto' }}>
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
