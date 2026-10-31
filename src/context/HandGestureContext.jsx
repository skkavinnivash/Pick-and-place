import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { loadMediaPipeScripts, calculatePinchDistance, drawHandSkeleton } from '../utils/handTracking';
import { soundFx } from '../utils/audio';
import { useAutoStartCamera, cleanAutoStartUrl } from '../utils/useAutoStartCamera';

const HandGestureContext = createContext(null);

export function useHandGestures() {
  const ctx = useContext(HandGestureContext);
  if (!ctx) {
    throw new Error('useHandGestures must be used within a HandGestureProvider');
  }
  return ctx;
}

export function HandGestureProvider({ children }) {
  // Master camera toggle
  const [isCameraEnabled, setIsCameraEnabled] = useState(() => {
    return localStorage.getItem('mm_camera_enabled') === 'true';
  });

  // Camera & Model status: 'idle' | 'loading' | 'active' | 'error' | 'denied' | 'no_device'
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Hand tracking state
  const [handDetected, setHandDetected] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [pinchProgress, setPinchProgress] = useState(0);
  const [isObjectPlacedRecent, setIsObjectPlacedRecent] = useState(false);
  const placedTimeoutRef = useRef(null);

  const [cursorPos, setCursorPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
    rawX: 0.5,
    rawY: 0.5,
    visible: false
  });

  // Current entity being dragged via hand gesture:
  // { source: 'tray', item } | { source: 'slot', slotNum, item } | null
  const [draggedItem, setDraggedItem] = useState(null);

  // Active hover target under cursor: slot number (1..N) or null
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // PIP Window configuration
  const [pipMinimized, setPipMinimized] = useState(() => {
    return localStorage.getItem('mm_pip_minimized') === 'true';
  });
  const [sensitivity, setSensitivity] = useState(1.4);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  // Click ripple effects
  const [ripples, setRipples] = useState([]);

  // Internal tracking refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isPinchingRef = useRef(false);
  const pinchStartTimeRef = useRef(0);
  const lastDropTimeRef = useRef(0);
  const lastButtonClickTimeRef = useRef(0);
  const consecutivePinchFramesRef = useRef(0);
  const lostHandGraceFramesRef = useRef(0);
  const smoothPosRef = useRef({ x: 0.5, y: 0.5 });
  const draggedItemRef = useRef(null);
  const hoveredSlotRef = useRef(null);
  const isEnabledRef = useRef(isCameraEnabled);

  // Keep refs in sync with state
  useEffect(() => {
    isEnabledRef.current = isCameraEnabled;
    localStorage.setItem('mm_camera_enabled', String(isCameraEnabled));
  }, [isCameraEnabled]);

  useEffect(() => {
    draggedItemRef.current = draggedItem;
  }, [draggedItem]);

  useEffect(() => {
    hoveredSlotRef.current = hoveredSlot;
  }, [hoveredSlot]);

  useEffect(() => {
    localStorage.setItem('mm_pip_minimized', String(pipMinimized));
  }, [pipMinimized]);

  // Method called when an object has been successfully placed into a slot
  const notifyObjectPlaced = useCallback(() => {
    setIsObjectPlacedRecent(true);
    if (placedTimeoutRef.current) {
      clearTimeout(placedTimeoutRef.current);
    }
    placedTimeoutRef.current = setTimeout(() => {
      setIsObjectPlacedRecent(false);
    }, 2500);
  }, []);

  // Compute exact 4-state status indicator string required:
  // - “Hand Detected”
  // - “No Hand Detected”
  // - “Object Selected”
  // - “Object Placed”
  let gestureStatus = 'No Hand Detected';
  if (!handDetected && cameraStatus === 'active') {
    gestureStatus = 'No Hand Detected';
  } else if (cameraStatus !== 'active') {
    gestureStatus = cameraStatus === 'loading' ? 'Loading Camera...' : 'No Hand Detected';
  } else if (draggedItem) {
    gestureStatus = 'Object Selected';
  } else if (isObjectPlacedRecent) {
    gestureStatus = 'Object Placed';
  } else if (handDetected) {
    gestureStatus = 'Hand Detected';
  }

  // Spawn visual ripple at coordinates
  const triggerRipple = useCallback((x, y) => {
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev.slice(-4), { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  // Update virtual cursor & inspect DOM element under cursor
  const updateCursorAndHover = useCallback((screenX, screenY) => {
    setCursorPos({
      x: screenX,
      y: screenY,
      visible: true
    });

    // Detect element under cursor (ignoring cursor overlay itself via pointer-events: none)
    const elem = document.elementFromPoint(screenX, screenY);
    if (!elem) {
      setHoveredSlot(null);
      return;
    }

    // Check if over a target slot
    const slotElem = elem.closest('[data-gesture-slot]');
    if (slotElem) {
      const slotNum = Number(slotElem.getAttribute('data-gesture-slot'));
      setHoveredSlot(slotNum);
    } else {
      setHoveredSlot(null);
    }
  }, []);

  // Handle pinch gesture state machine (start, drag, release, tap) with debouncing
  const handlePinchTransition = useCallback((nextPinching, screenX, screenY) => {
    const prevPinching = isPinchingRef.current;
    if (prevPinching === nextPinching) return;

    const now = Date.now();

    // 1. PINCH START: Fingers came together (GRAB)
    if (nextPinching && !prevPinching) {
      // Cooldown after last drop to prevent instant re-grab noise
      if (now - lastDropTimeRef.current < 350) {
        return;
      }

      isPinchingRef.current = true;
      setIsPinching(true);
      pinchStartTimeRef.current = now;
      triggerRipple(screenX, screenY);

      // Inspect what is beneath the cursor
      const elem = document.elementFromPoint(screenX, screenY);
      if (!elem) return;

      // Case A: Tray item grabbed
      const trayItemElem = elem.closest('[data-gesture-tray-item]');
      if (trayItemElem) {
        const itemId = trayItemElem.getAttribute('data-gesture-tray-item');
        window.dispatchEvent(new CustomEvent('mm-gesture-grab', {
          detail: { source: 'tray', itemId, screenX, screenY }
        }));
        return;
      }

      // Case B: Slot item grabbed
      const slotElem = elem.closest('[data-gesture-slot]');
      if (slotElem) {
        const slotNum = Number(slotElem.getAttribute('data-gesture-slot'));
        window.dispatchEvent(new CustomEvent('mm-gesture-grab', {
          detail: { source: 'slot', slotNum, screenX, screenY }
        }));
        return;
      }

      // Case C: Clickable button or card (UI interactions)
      const clickable = elem.closest('button, .btn, .diff-card, .difficulty-card, .nav-brand, .modal-close-btn, [data-gesture-btn]');
      if (clickable && now - lastButtonClickTimeRef.current > 400) {
        lastButtonClickTimeRef.current = now;
        soundFx.pickup();
        clickable.click();
      }
    }
    // 2. PINCH RELEASE: Fingers opened up (DROP / PLACE)
    else if (!nextPinching && prevPinching) {
      isPinchingRef.current = false;
      setIsPinching(false);
      lastDropTimeRef.current = now;

      const duration = now - pinchStartTimeRef.current;
      const isQuickTap = duration < 300;

      const currentHoveredSlot = hoveredSlotRef.current;
      const currentDragged = draggedItemRef.current;

      // Dispatch drop event with target details
      window.dispatchEvent(new CustomEvent('mm-gesture-drop', {
        detail: {
          draggedItem: currentDragged,
          targetSlotNum: currentHoveredSlot,
          screenX,
          screenY,
          isQuickTap
        }
      }));
    }
  }, [triggerRipple]);

  // Process MediaPipe landmark results each frame
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const width = canvas?.width || 320;
    const height = canvas?.height || 240;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Grace period to prevent tracking dropouts from flickering
      lostHandGraceFramesRef.current += 1;
      if (lostHandGraceFramesRef.current > 6) {
        setHandDetected(false);
        consecutivePinchFramesRef.current = 0;
        if (ctx) ctx.clearRect(0, 0, width, height);

        // If dragging was active when hand was completely lost, release safely
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
          setIsPinching(false);
          const currentDragged = draggedItemRef.current;
          window.dispatchEvent(new CustomEvent('mm-gesture-drop', {
            detail: {
              draggedItem: currentDragged,
              targetSlotNum: null,
              screenX: smoothPosRef.current.x * window.innerWidth,
              screenY: smoothPosRef.current.y * window.innerHeight,
              isQuickTap: false
            }
          }));
        }
      }
      return;
    }

    // Hand landmark detected
    lostHandGraceFramesRef.current = 0;
    setHandDetected(true);
    const landmarks = results.multiHandLandmarks[0];

    // Thumb tip = 4, Index tip = 8
    const thumb = landmarks[4];
    const index = landmarks[8];

    // Calculate pinch distance in 3D landmark coordinates
    const pinchDist = calculatePinchDistance(thumb, index);

    // Pinch threshold with hysteresis:
    // When distance < 0.065 -> PINCH
    // When distance > 0.088 -> RELEASE
    const pinchThreshold = 0.065;
    const releaseThreshold = 0.088;
    const isCurrentlyPinching = isPinchingRef.current;

    let nextPinching = isCurrentlyPinching;
    if (!isCurrentlyPinching) {
      if (pinchDist < pinchThreshold) {
        consecutivePinchFramesRef.current += 1;
        // Require 2 consecutive frames to confirm pinch start
        if (consecutivePinchFramesRef.current >= 2) {
          nextPinching = true;
        }
      } else {
        consecutivePinchFramesRef.current = 0;
      }
    } else {
      if (pinchDist > releaseThreshold) {
        nextPinching = false;
        consecutivePinchFramesRef.current = 0;
      }
    }

    // Normalized progress: 0.0 (open) to 1.0 (pinched)
    const progress = Math.max(0, Math.min(1, (0.13 - pinchDist) / (0.13 - pinchThreshold)));
    setPinchProgress(progress);

    // Draw hand skeleton & pinch beam onto PIP canvas
    if (ctx) {
      drawHandSkeleton(ctx, landmarks, nextPinching, progress, width, height);
    }

    // Track index fingertip in real time (Landmark 8) per requirement A
    // When pinched, use fingertip contact point
    const rawX = isCurrentlyPinching ? (thumb.x * 0.4 + index.x * 0.6) : index.x;
    const rawY = isCurrentlyPinching ? (thumb.y * 0.4 + index.y * 0.6) : index.y;

    // Mirror interaction horizontally so right hand to right = cursor to right
    let targetX = isMirrored ? (1.0 - rawX) : rawX;
    let targetY = rawY;

    // Center-offset scaling with sensitivity
    targetX = 0.5 + (targetX - 0.5) * sensitivity;
    targetY = 0.5 + (targetY - 0.5) * sensitivity;

    // Clamp normalized coordinates to stay well inside the playable game area
    targetX = Math.max(0.02, Math.min(0.98, targetX));
    targetY = Math.max(0.02, Math.min(0.98, targetY));

    // Adaptive Exponential Moving Average (EMA) smoothing:
    // When moving fast, alpha increases for immediate response.
    // When steady/aiming, alpha decreases to eliminate cursor jitter.
    const dx = targetX - smoothPosRef.current.x;
    const dy = targetY - smoothPosRef.current.y;
    const moveDist = Math.hypot(dx, dy);
    const alpha = Math.min(0.55, Math.max(0.26, moveDist * 3.2));

    smoothPosRef.current.x += dx * alpha;
    smoothPosRef.current.y += dy * alpha;

    // Map accurately to window screen coordinates and prevent leaving playable area
    const screenX = Math.max(16, Math.min(window.innerWidth - 16, smoothPosRef.current.x * window.innerWidth));
    const screenY = Math.max(16, Math.min(window.innerHeight - 16, smoothPosRef.current.y * window.innerHeight));

    // Update screen cursor and hovered elements
    updateCursorAndHover(screenX, screenY, nextPinching);

    // Handle gesture state transitions (pinch start / drop)
    handlePinchTransition(nextPinching, screenX, screenY);
  }, [isMirrored, sensitivity, updateCursorAndHover, handlePinchTransition]);

  // Start Camera Stream & MediaPipe Hands
  const startCamera = useCallback(async () => {
    if (!isEnabledRef.current) return;

    setCameraStatus('loading');
    setStatusMessage('Loading MediaPipe AI Hand Tracking...');
    setErrorMessage(null);

    try {
      // 1. Load MediaPipe Hands
      const { Hands } = await loadMediaPipeScripts();

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      hands.onResults(onResults);
      handsInstanceRef.current = hands;

      // 2. Request user webcam (only after player enables hand controls)
      setStatusMessage('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      cameraStreamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();

        // 3. Setup real-time frame processing loop
        let isProcessing = false;
        const processFrame = async () => {
          if (!isEnabledRef.current || !handsInstanceRef.current || !videoRef.current) return;

          if (video.readyState >= 2 && !isProcessing) {
            isProcessing = true;
            try {
              await handsInstanceRef.current.send({ image: video });
            } catch (err) {
              console.warn('Frame processing warning:', err);
            } finally {
              isProcessing = false;
            }
          }
          animFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }

      setCameraStatus('active');
      setStatusMessage('Camera active! Show your hand.');
    } catch (err) {
      console.error('Camera or MediaPipe initialization failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setStatusMessage('Camera permission denied.');
        setErrorMessage('Webcam access was not granted. You can continue playing normally using mouse or touch controls!');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('no_device');
        setStatusMessage('No camera detected.');
        setErrorMessage('No webcam was detected on this device. Mouse controls remain fully active!');
      } else {
        setCameraStatus('error');
        setStatusMessage(err.message || 'Failed to start camera.');
        setErrorMessage('Camera or AI model initialization encountered an issue. Mouse controls remain active!');
      }
    }
  }, [onResults]);

  // Stop camera and release resources cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (handsInstanceRef.current) {
      try {
        handsInstanceRef.current.close();
      } catch {
        // Ignored
      }
      handsInstanceRef.current = null;
    }

    setHandDetected(false);
    setIsPinching(false);
    isPinchingRef.current = false;
    setDraggedItem(null);
    setHoveredSlot(null);
    setCameraStatus('idle');
    setStatusMessage('');
  }, []);

  // Toggle Camera On/Off
  const toggleCamera = useCallback(() => {
    setIsCameraEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopCamera();
      }
      return next;
    });
  }, [stopCamera]);

  // ── Auto-start camera on launch (via launch.bat ?autoCamera=1 or saved pref) ──
  useAutoStartCamera({ isCameraEnabled, setIsCameraEnabled });

  // Lifecycle: Start or stop when isCameraEnabled changes
  useEffect(() => {
    if (isCameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraEnabled, startCamera, stopCamera]);

  // Clean up ?autoCamera=1 from URL once camera is active
  useEffect(() => {
    if (isCameraEnabled && cameraStatus === 'active') {
      cleanAutoStartUrl();
    }
  }, [isCameraEnabled, cameraStatus]);

  // Demo Hand Simulation for testing / machines without webcam (Alt + Mouse Move/Click)
  useEffect(() => {
    if (!isSimulated) return;

    let simPinching = false;

    const handleMouseMove = (e) => {
      updateCursorAndHover(e.clientX, e.clientY, simPinching);
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && e.altKey) {
        simPinching = true;
        handlePinchTransition(true, e.clientX, e.clientY);
      }
    };

    const handleMouseUp = (e) => {
      if (simPinching) {
        simPinching = false;
        handlePinchTransition(false, e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSimulated, updateCursorAndHover, handlePinchTransition]);

  const value = {
    isCameraEnabled,
    setIsCameraEnabled,
    toggleCamera,
    cameraStatus,
    statusMessage,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(null),
    gestureStatus,
    notifyObjectPlaced,
    handDetected,
    isPinching,
    pinchProgress,
    cursorPos,
    draggedItem,
    setDraggedItem,
    hoveredSlot,
    setHoveredSlot,
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
    ripples,
    startCamera,
    stopCamera
  };

  return (
    <HandGestureContext.Provider value={value}>
      {children}
    </HandGestureContext.Provider>
  );
}
