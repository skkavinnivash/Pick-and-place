import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audio';
import { useHandGestures } from '../context/HandGestureContext';

export default function ChallengePhase({
  originalSlots,
  shuffledTray,
  difficultyConfig,
  onChallengeComplete
}) {
  const totalSeconds = difficultyConfig.challengeSeconds || 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isGameOver, setIsGameOver] = useState(false);

  // placements: mapping of slotNumber (1..N) to object or null
  // Initially all slots are empty: { 1: null, 2: null, ... }
  const [placements, setPlacements] = useState(() => {
    const init = {};
    for (let i = 1; i <= originalSlots.length; i++) {
      init[i] = null;
    }
    return init;
  });

  // Locked slots: mapping of slotNumber -> boolean
  // Correctly placed objects must remain locked in their slots per gameplay rules
  const [lockedSlots, setLockedSlots] = useState({});
  const lockedSlotsRef = useRef(lockedSlots);
  useEffect(() => {
    lockedSlotsRef.current = lockedSlots;
  }, [lockedSlots]);

  // Track which item is currently selected for tap-to-place interaction
  // Can be { source: 'tray', item: object } or { source: 'slot', slotNum: number, item: object }
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Track drag hover over slot (for mouse drag and drop)
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Ref to prevent multiple completions
  const completedRef = useRef(false);

  // Compute available items in the tray (items not yet placed in any slot)
  const placedIds = new Set(
    Object.values(placements)
      .filter(Boolean)
      .map((item) => item.id)
  );

  const availableTrayItems = shuffledTray.filter((item) => !placedIds.has(item.id));
  const placedCount = placedIds.size;
  const totalCount = originalSlots.length;

  // Real-time calculation of currently correct placements
  const currentCorrectCount = Object.entries(placements).filter(([slotNum, item]) => {
    if (!item) return false;
    return item.originalSlot === Number(slotNum);
  }).length;

  // 60-Second Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            setIsGameOver(true);
            soundFx.timeUp();
            setTimeout(() => {
              onChallengeComplete(placements, totalSeconds);
            }, 600);
          }
          return 0;
        }

        const next = prev - 1;
        if (next <= 10) {
          soundFx.urgentTick();
        } else {
          soundFx.tick();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [placements, totalSeconds, onChallengeComplete]);

  // Handler: Submit placements manually
  const handleSubmitPlacements = () => {
    if (completedRef.current || isGameOver) return;
    completedRef.current = true;
    setIsGameOver(true);

    const timeUsed = totalSeconds - secondsLeft;
    soundFx.pickup();
    onChallengeComplete(placements, timeUsed);
  };

  // Handler: Clear unlocked placements back to tray (locked items remain in place per rules)
  const handleClearAll = () => {
    if (isGameOver) return;
    soundFx.remove();
    setSelectedEntity(null);
    setPlacements((prev) => {
      const updated = {};
      for (let i = 1; i <= totalCount; i++) {
        // Correctly placed objects remain locked in their slots
        updated[i] = lockedSlotsRef.current[i] ? prev[i] : null;
      }
      return updated;
    });
  };

  // Hand Gestures integration
  const {
    isCameraEnabled,
    toggleCamera,
    draggedItem,
    setDraggedItem,
    hoveredSlot,
    gestureStatus,
    notifyObjectPlaced
  } = useHandGestures();

  // Placements and selectedEntity refs for gesture event callbacks
  const placementsRef = useRef(placements);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  const selectedEntityRef = useRef(selectedEntity);
  useEffect(() => {
    selectedEntityRef.current = selectedEntity;
  }, [selectedEntity]);

  // Listen to custom hand gesture events dispatched by HandGestureContext
  useEffect(() => {
    if (isGameOver) return;

    const handleGestureGrab = (e) => {
      if (isGameOver) return;
      const { source, itemId, slotNum } = e.detail;

      if (source === 'tray') {
        const itemToGrab = shuffledTray.find((i) => i.id === itemId);
        if (!itemToGrab) return;

        // Check if item is already placed in grid
        const isAlreadyPlaced = Object.values(placementsRef.current).some(
          (p) => p && p.id === itemToGrab.id
        );
        if (isAlreadyPlaced) return;

        setDraggedItem({ source: 'tray', item: itemToGrab });
        setSelectedEntity({ source: 'tray', item: itemToGrab });
        soundFx.pickup();
      } else if (source === 'slot') {
        // If slot is locked, do not allow picking it up!
        if (lockedSlotsRef.current[slotNum]) {
          return;
        }

        const currentItem = placementsRef.current[slotNum];
        if (!currentItem) return;

        setDraggedItem({ source: 'slot', slotNum, item: currentItem });
        setSelectedEntity({ source: 'slot', slotNum, item: currentItem });
        soundFx.pickup();
      }
    };

    const handleGestureDrop = (e) => {
      if (isGameOver) return;
      const { draggedItem: activeDragged, targetSlotNum, screenX, screenY, isQuickTap } = e.detail;

      const currentDragged = activeDragged || null;
      const currentSelected = selectedEntityRef.current;

      // Case 1: Active item was being dragged
      if (currentDragged) {
        if (targetSlotNum && targetSlotNum >= 1 && targetSlotNum <= totalCount) {
          // If the target slot is already locked with a correct item, cannot place here
          if (lockedSlotsRef.current[targetSlotNum]) {
            soundFx.remove();
            setDraggedItem(null);
            setSelectedEntity(null);
            return;
          }

          const isCorrect = currentDragged.item.originalSlot === targetSlotNum;

          if (isCorrect) {
            // Correct slot: Snap into position and mark as locked
            setPlacements((prev) => {
              const updated = { ...prev };
              if (currentDragged.source === 'slot') {
                updated[currentDragged.slotNum] = null;
              }
              updated[targetSlotNum] = currentDragged.item;
              return updated;
            });
            setLockedSlots((prev) => ({ ...prev, [targetSlotNum]: true }));
            soundFx.drop();
            notifyObjectPlaced();
          } else {
            // Wrong slot: Allow placing it so it can be picked up again
            setPlacements((prev) => {
              const updated = { ...prev };
              if (currentDragged.source === 'slot') {
                const targetCurrent = prev[targetSlotNum];
                updated[currentDragged.slotNum] = targetCurrent;
              }
              updated[targetSlotNum] = currentDragged.item;
              return updated;
            });
            soundFx.drop();
            notifyObjectPlaced();
          }

          setDraggedItem(null);
          setSelectedEntity(null);
          return;
        }

        // Dropped outside slot: check if dropped over tray
        const elemAtPoint = document.elementFromPoint(screenX, screenY);
        const isOverTray = elemAtPoint && elemAtPoint.closest('.tray-wrapper');

        if (isOverTray && currentDragged.source === 'slot') {
          // Return slot item to tray (only if unlocked)
          if (!lockedSlotsRef.current[currentDragged.slotNum]) {
            setPlacements((prev) => ({
              ...prev,
              [currentDragged.slotNum]: null
            }));
            soundFx.remove();
          }
          setDraggedItem(null);
          setSelectedEntity(null);
          return;
        }

        if (isQuickTap) {
          setDraggedItem(null);
          return;
        }

        setDraggedItem(null);
        setSelectedEntity(null);
        return;
      }

      // Case 2: Selected entity exists, user pinched on a slot (Tap mode)
      if (currentSelected && targetSlotNum) {
        if (lockedSlotsRef.current[targetSlotNum]) {
          return;
        }

        const isCorrect = currentSelected.item.originalSlot === targetSlotNum;

        if (currentSelected.source === 'tray') {
          setPlacements((prev) => ({
            ...prev,
            [targetSlotNum]: currentSelected.item
          }));
          if (isCorrect) {
            setLockedSlots((prev) => ({ ...prev, [targetSlotNum]: true }));
          }
          soundFx.drop();
          notifyObjectPlaced();
          setSelectedEntity(null);
        } else if (currentSelected.source === 'slot') {
          const sourceSlot = currentSelected.slotNum;
          if (sourceSlot === targetSlotNum) {
            setSelectedEntity(null);
            soundFx.remove();
          } else {
            const targetCurrentItem = placementsRef.current[targetSlotNum];
            setPlacements((prev) => ({
              ...prev,
              [sourceSlot]: targetCurrentItem,
              [targetSlotNum]: currentSelected.item
            }));
            if (isCorrect) {
              setLockedSlots((prev) => ({ ...prev, [targetSlotNum]: true }));
            }
            soundFx.swap();
            notifyObjectPlaced();
            setSelectedEntity(null);
          }
        }
      }
    };

    window.addEventListener('mm-gesture-grab', handleGestureGrab);
    window.addEventListener('mm-gesture-drop', handleGestureDrop);

    return () => {
      window.removeEventListener('mm-gesture-grab', handleGestureGrab);
      window.removeEventListener('mm-gesture-drop', handleGestureDrop);
    };
  }, [isGameOver, setDraggedItem, totalCount, shuffledTray, notifyObjectPlaced]);

  // =========================================================================
  // Tap / Click to Select and Place Logic (Mouse Controls)
  // =========================================================================

  const handleTrayItemClick = (item) => {
    if (isGameOver) return;

    if (selectedEntity?.source === 'tray' && selectedEntity.item.id === item.id) {
      setSelectedEntity(null);
      soundFx.remove();
    } else {
      setSelectedEntity({ source: 'tray', item });
      soundFx.pickup();
    }
  };

  const handleSlotClick = (slotNum) => {
    if (isGameOver) return;

    // Locked slots cannot be interacted with
    if (lockedSlots[slotNum]) return;

    const currentItemInSlot = placements[slotNum];

    // CASE 1: User has an entity selected
    if (selectedEntity) {
      const isCorrect = selectedEntity.item.originalSlot === slotNum;

      if (selectedEntity.source === 'tray') {
        setPlacements((prev) => ({
          ...prev,
          [slotNum]: selectedEntity.item
        }));
        if (isCorrect) {
          setLockedSlots((prev) => ({ ...prev, [slotNum]: true }));
        }
        soundFx.drop();
        notifyObjectPlaced();
        setSelectedEntity(null);
      } else if (selectedEntity.source === 'slot') {
        const sourceSlotNum = selectedEntity.slotNum;

        if (sourceSlotNum === slotNum) {
          setSelectedEntity(null);
          soundFx.remove();
          return;
        }

        setPlacements((prev) => ({
          ...prev,
          [sourceSlotNum]: currentItemInSlot,
          [slotNum]: selectedEntity.item
        }));
        if (isCorrect) {
          setLockedSlots((prev) => ({ ...prev, [slotNum]: true }));
        }
        soundFx.swap();
        notifyObjectPlaced();
        setSelectedEntity(null);
      }
      return;
    }

    // CASE 2: No entity selected, but slot is occupied -> select it if unlocked
    if (currentItemInSlot && !lockedSlots[slotNum]) {
      setSelectedEntity({
        source: 'slot',
        slotNum,
        item: currentItemInSlot
      });
      soundFx.pickup();
    }
  };

  const handleRemoveFromSlot = (slotNum, e) => {
    e.stopPropagation();
    if (isGameOver) return;
    if (lockedSlots[slotNum]) return; // Correctly placed items are locked

    if (selectedEntity?.source === 'slot' && selectedEntity.slotNum === slotNum) {
      setSelectedEntity(null);
    }

    setPlacements((prev) => ({
      ...prev,
      [slotNum]: null
    }));
    soundFx.remove();
  };

  // =========================================================================
  // HTML5 Drag and Drop Handlers (Mouse Controls)
  // =========================================================================

  const handleDragStartTray = (e, item) => {
    if (isGameOver) return;
    setSelectedEntity({ source: 'tray', item });
    soundFx.pickup();
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'tray', id: item.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartSlot = (e, slotNum, item) => {
    if (isGameOver || lockedSlots[slotNum]) return;
    setSelectedEntity({ source: 'slot', slotNum, item });
    soundFx.pickup();
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'slot', slotNum }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSlot = (e, slotNum) => {
    e.preventDefault();
    if (lockedSlots[slotNum]) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotNum) {
      setDragOverSlot(slotNum);
    }
  };

  const handleDragLeaveSlot = (e, slotNum) => {
    if (dragOverSlot === slotNum) {
      setDragOverSlot(null);
    }
  };

  const handleDropOnSlot = (e, targetSlotNum) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (isGameOver || lockedSlots[targetSlotNum]) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      const targetCurrentItem = placements[targetSlotNum];

      if (data.source === 'tray') {
        const itemToPlace = shuffledTray.find((i) => i.id === data.id);
        if (!itemToPlace) return;

        const isCorrect = itemToPlace.originalSlot === targetSlotNum;
        setPlacements((prev) => ({
          ...prev,
          [targetSlotNum]: itemToPlace
        }));
        if (isCorrect) {
          setLockedSlots((prev) => ({ ...prev, [targetSlotNum]: true }));
        }
        soundFx.drop();
        notifyObjectPlaced();
      } else if (data.source === 'slot') {
        const sourceSlotNum = data.slotNum;
        if (sourceSlotNum === targetSlotNum) return;

        const sourceItem = placements[sourceSlotNum];
        if (!sourceItem) return;

        const isCorrect = sourceItem.originalSlot === targetSlotNum;
        setPlacements((prev) => ({
          ...prev,
          [sourceSlotNum]: targetCurrentItem,
          [targetSlotNum]: sourceItem
        }));
        if (isCorrect) {
          setLockedSlots((prev) => ({ ...prev, [targetSlotNum]: true }));
        }
        soundFx.swap();
        notifyObjectPlaced();
      }
      setSelectedEntity(null);
    } catch {
      // Drop parsing error ignored
    }
  };

  const handleDropOnTray = (e) => {
    e.preventDefault();
    if (isGameOver) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.source === 'slot') {
        const sourceSlotNum = data.slotNum;
        if (!lockedSlots[sourceSlotNum]) {
          setPlacements((prev) => ({
            ...prev,
            [sourceSlotNum]: null
          }));
          soundFx.remove();
          setSelectedEntity(null);
        }
      }
    } catch {
      // Ignored
    }
  };

  // Timer formatting: MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = secondsLeft <= 20 && secondsLeft > 10;
  const isCritical = secondsLeft <= 10;

  return (
    <div className="challenge-screen">
      {/* Hand Gesture Status & Guide Banner */}
      <div className="gesture-game-banner glass-panel">
        <div className="gesture-banner-left">
          <div className="gesture-banner-badge">
            <span
              className={`pulse-dot ${
                gestureStatus === 'Hand Detected' || gestureStatus === 'Object Selected' || gestureStatus === 'Object Placed'
                  ? 'active'
                  : ''
              }`}
            />
            <span style={{ fontWeight: 800 }}>STATUS: {gestureStatus.toUpperCase()}</span>
          </div>

          <div className="gesture-banner-steps">
            <span className="step-item"><span className="step-icon">🖐️</span> <strong>Aim</strong></span>
            <span className="step-sep">➜</span>
            <span className="step-item"><span className="step-icon">🤏</span> <strong>Pinch</strong> grab</span>
            <span className="step-sep">➜</span>
            <span className="step-item"><span className="step-icon">🎯</span> <strong>Drag</strong></span>
            <span className="step-sep">➜</span>
            <span className="step-item"><span className="step-icon">✨</span> <strong>Release</strong> place</span>
          </div>
        </div>

        {!isCameraEnabled && (
          <button
            className="btn btn-primary"
            data-gesture-btn="true"
            onClick={toggleCamera}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            📷 Enable Hand Controls
          </button>
        )}
      </div>

      {/* Top HUD */}
      <div className="challenge-hud glass-panel">
        <div className="hud-stat-group">
          {/* Prominent 60s Countdown Timer */}
          <div
            className={`hud-timer-badge ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
            title="Time remaining"
          >
            <span>⏱️</span>
            <span>{formatTime(secondsLeft)}</span>
          </div>

          {/* Placed Objects Progress Counter */}
          <div className="hud-counter">
            <span className="hud-counter-label">Objects Placed</span>
            <span className="hud-counter-val" style={{ color: '#38bdf8' }}>
              {placedCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {totalCount}</span>
            </span>
          </div>

          {/* Correct Placements Locked Counter */}
          <div className="hud-counter">
            <span className="hud-counter-label">Correct & Locked</span>
            <span className="hud-counter-val" style={{ color: '#10b981' }}>
              {currentCorrectCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {totalCount}</span>
            </span>
          </div>
        </div>

        {/* HUD Action Buttons */}
        <div className="hud-actions">
          <button
            className="btn btn-secondary"
            data-gesture-btn="true"
            onClick={handleClearAll}
            disabled={placedCount === 0 || isGameOver}
            title="Return unlocked objects back to the collection tray"
            style={{ opacity: placedCount === 0 ? 0.5 : 1 }}
          >
            <span>🔄</span> Clear Unlocked
          </button>

          <button
            className="btn btn-accent"
            data-gesture-btn="true"
            onClick={handleSubmitPlacements}
            disabled={isGameOver}
            style={{
              boxShadow: placedCount === totalCount ? '0 0 25px rgba(16, 185, 129, 0.7)' : undefined,
              animation: placedCount === totalCount ? 'pulseGlow 2s infinite' : undefined
            }}
          >
            <span>✓</span> Submit Placements
          </button>
        </div>
      </div>

      {/* Grid Section */}
      <div className="challenge-grid-wrapper">
        <div className="grid-section-header">
          <div className="grid-section-title">
            <span>🎯</span> Numbered Placement Grid
          </div>
          <div className="grid-section-hint">
            {isCameraEnabled
              ? '🤏 Pinch index & thumb to grab, move hand over slot, release to place!'
              : selectedEntity
              ? '👉 Tap any slot to place the selected object'
              : 'Drag & drop or tap an object below to place it in its original slot'}
          </div>
        </div>

        <div className="game-grid-container grid-cols-5">
          {Array.from({ length: totalCount }, (_, i) => i + 1).map((slotNum) => {
            const placedItem = placements[slotNum];
            const isLocked = !!lockedSlots[slotNum];
            const isHovered = dragOverSlot === slotNum;
            const isSelectedSlot =
              selectedEntity?.source === 'slot' && selectedEntity.slotNum === slotNum;
            const isGestureHovered = hoveredSlot === slotNum;

            return (
              <div
                key={slotNum}
                data-gesture-slot={slotNum}
                className={`target-slot glass-panel ${
                  placedItem ? 'occupied' : 'empty'
                } ${isLocked ? 'slot-locked' : ''} ${
                  isHovered && !isLocked ? 'drag-over' : ''
                } ${isSelectedSlot ? 'target-selected' : ''} ${
                  isGestureHovered && !isLocked ? 'gesture-target-hover' : ''
                }`}
                onClick={() => handleSlotClick(slotNum)}
                onDragOver={(e) => handleDragOverSlot(e, slotNum)}
                onDragLeave={(e) => handleDragLeaveSlot(e, slotNum)}
                onDrop={(e) => handleDropOnSlot(e, slotNum)}
                draggable={!!placedItem && !isGameOver && !isLocked}
                onDragStart={(e) => placedItem && !isLocked && handleDragStartSlot(e, slotNum, placedItem)}
                style={{ cursor: isLocked ? 'default' : placedItem ? 'grab' : 'pointer' }}
              >
                <div className="slot-num-badge">
                  Slot #{slotNum} {isLocked && <span title="Correctly placed & locked">🔒</span>}
                </div>

                {placedItem ? (
                  <>
                    <div className={`slot-item-emoji ${isLocked ? 'locked-emoji' : ''}`}>
                      {placedItem.emoji}
                    </div>
                    {/* Object name is hidden during challenge per specification */}
                    {!isLocked && (
                      <button
                        className="slot-remove-btn"
                        onClick={(e) => handleRemoveFromSlot(slotNum, e)}
                        title="Remove object and return to tray"
                        aria-label={`Remove object from slot ${slotNum}`}
                      >
                        ✕
                      </button>
                    )}
                  </>
                ) : (
                  <div className="slot-empty-content">
                    <span className="slot-empty-icon">➕</span>
                    <span className="slot-empty-text">Empty</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Object Tray (Mixed Collection Pool) */}
      <div
        className="tray-wrapper glass-panel"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropOnTray}
      >
        <div className="tray-header">
          <div className="tray-title">
            <span>📦</span> Mixed Collection (Names Hidden)
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({availableTrayItems.length} remaining)
            </span>
          </div>

          <div className="tray-helper">
            {isCameraEnabled
              ? '🤏 Aim index finger & pinch thumb to grab any item'
              : selectedEntity
              ? '✨ Object selected! Click a slot above to place it'
              : '💡 Select an object or drag it into its original slot'}
          </div>
        </div>

        <div className="tray-items-grid">
          {availableTrayItems.length === 0 ? (
            <div className="tray-empty-message">
              <span>🎉</span> All objects placed! Click "Submit Placements" to see your final score.
            </div>
          ) : (
            availableTrayItems.map((item) => {
              const isSelected =
                selectedEntity?.source === 'tray' && selectedEntity.item.id === item.id;
              const isBeingDragged =
                draggedItem?.source === 'tray' && draggedItem.item.id === item.id;

              return (
                <div
                  key={item.id}
                  data-gesture-tray-item={item.id}
                  className={`tray-item-card ${isSelected ? 'selected' : ''} ${
                    isBeingDragged ? 'gesture-drag-active' : ''
                  }`}
                  onClick={() => handleTrayItemClick(item)}
                  draggable={!isGameOver}
                  onDragStart={(e) => handleDragStartTray(e, item)}
                  title="Click or Pinch to grab and drag"
                >
                  <span>{item.emoji}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
