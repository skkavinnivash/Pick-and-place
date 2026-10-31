import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../utils/audio';

export default function PreviewPhase({
  originalSlots,
  difficultyConfig,
  onPreviewComplete
}) {
  const totalSeconds = difficultyConfig.previewSeconds || 15;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const completedRef = useRef(false);

  useEffect(() => {
    // Play initial countdown beep
    soundFx.previewTick(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundFx.previewEnd();
          // Defer phase transition out of the state-updater to avoid React
          // "Cannot update a component while rendering a different component" warning
          if (!completedRef.current) {
            completedRef.current = true;
            setTimeout(onPreviewComplete, 0);
          }
          return 0;
        }

        const next = prev - 1;
        soundFx.previewTick(next <= 3);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onPreviewComplete]);

  // SVG circle calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = secondsLeft / totalSeconds;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const handleSkipPreview = () => {
    soundFx.previewEnd();
    onPreviewComplete();
  };

  return (
    <div className="preview-screen">
      {/* Top Countdown Banner */}
      <div className="phase-banner glass-panel">
        <div className="phase-banner-content">
          <div className="timer-circular-wrap">
            <svg viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="5"
              />
              <circle
                cx="35"
                cy="35"
                r={radius}
                fill="none"
                stroke={secondsLeft <= 3 ? '#ef4444' : '#06b6d4'}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <span
              className="timer-number"
              style={{ color: secondsLeft <= 3 ? '#f87171' : '#38bdf8' }}
            >
              {secondsLeft}s
            </span>
          </div>

          <div className="phase-text-col">
            <span className="phase-badge-label">Phase 1 of 2: Memorization</span>
            <h2 className="phase-headline">
              Memorize the objects and their positions!
            </h2>
            <p className="phase-subtext">
              Remember both the items and their slot numbers (1 to {originalSlots.length}). Everything will disappear in {secondsLeft} seconds!
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleSkipPreview}
          title="Ready now? Start the challenge immediately"
        >
          <span>⏩</span> I'm Ready, Start Challenge!
        </button>
      </div>

      {/* Progress Line */}
      <div style={{ width: '100%', maxWidth: '1080px', marginTop: '-0.75rem' }}>
        <div className="preview-progress-track">
          <div
            className="preview-progress-fill"
            style={{
              width: `${(secondsLeft / totalSeconds) * 100}%`,
              background: secondsLeft <= 3 ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 'linear-gradient(90deg, #06b6d4, #8b5cf6)'
            }}
          />
        </div>
      </div>

      {/* Numbered Object Grid */}
      <div className="game-grid-container grid-cols-5">
        {originalSlots.map((item, index) => (
          <div
            key={item.id}
            className="preview-card glass-panel"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.15)',
              animationDelay: `${index * 40}ms`
            }}
          >
            <div className="slot-tag">Slot #{item.originalSlot}</div>

            <div className="preview-card-emoji">{item.emoji}</div>

            <div className="preview-card-name">{item.name}</div>

            <div className="preview-card-category">{item.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
