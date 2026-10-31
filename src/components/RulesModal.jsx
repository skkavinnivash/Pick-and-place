import React from 'react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title gradient-text-purple">
            <span>🎮</span> How to Play Memory Master
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Rules">
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Test your short-term visual memory, spatial recognition, and quick-thinking reflexes under pressure!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>👁️</span>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>1. 15-Second Preview</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  A grid of objects will appear with their names and numbered slot positions. Study and memorize where each object is located!
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>🧩</span>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>2. 60-Second Blitz</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  The grid clears and all object names disappear. The objects are shuffled into a mixed collection tray below.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>🎯</span>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--accent-green)' }}>3. Match & Place</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Drag-and-drop or tap each item to place it in its original numbered slot. You can swap items between slots anytime before submitting.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>🏆</span>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>4. Scoring & Results</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Earn <strong>+10 points</strong> for every item placed in its correct original slot. Misses earn 0 points. Review the full side-by-side reveal at the end!
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>🖐️</span>
              <div>
                <h4 style={{ fontWeight: 700, color: '#38bdf8' }}>5. Play With Camera Hand Gestures!</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Click <strong>🖐️ Hand Cam</strong> in the top navbar to turn on webcam controls:
                  <br />• <strong>Aim</strong>: Move your hand to move the glowing virtual reticle.
                  <br />• <strong>Select / Grab</strong>: <strong>Pinch index finger & thumb</strong> together.
                  <br />• <strong>Drag to Place</strong>: Keep fingers pinched, move to any slot, then <strong>open fingers</strong> to place!
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            color: '#bae6fd'
          }}>
            💡 <strong>Pro Tip:</strong> You can use Camera Hand Gestures, Mouse drag-and-drop, or click-to-place interchangeably at any time!
          </div>

          <button className="btn btn-primary" data-gesture-btn="true" onClick={onClose} style={{ alignSelf: 'center', marginTop: '0.5rem' }}>
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
