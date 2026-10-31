import React from 'react';
import { DIFFICULTY_CONFIG } from '../data/objects';

export default function HighScoresModal({ isOpen, onClose, highScores }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title gradient-text-gold">
            <span>🏆</span> Hall of Fame & High Scores
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close High Scores">
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Local records saved on this device. Beat your personal best in each challenge tier!
          </p>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {Object.keys(DIFFICULTY_CONFIG).map((key) => {
              const diff = DIFFICULTY_CONFIG[key];
              const record = highScores[key] || { score: 0, accuracy: 0, timeUsed: 60 };
              const maxScore = diff.itemCount * 10;

              return (
                <div
                  key={key}
                  style={{
                    padding: '1rem 1.2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: diff.color
                      }}
                    />
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {diff.name} Mode ({diff.itemCount} Items)
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {record.date ? `Recorded on ${record.date}` : 'No games played yet'}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fde047', fontFamily: 'var(--font-display)' }}>
                      {record.score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {maxScore} pts</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {record.accuracy}% Acc • {record.timeUsed}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-secondary" onClick={onClose} style={{ alignSelf: 'center', marginTop: '0.5rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
