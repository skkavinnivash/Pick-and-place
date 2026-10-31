/**
 * MediaPipe Hands Loader & Hand Tracking Engine
 * Provides real-time hand landmark detection, smoothing, pinch calculation, and canvas skeleton drawing.
 */

const MEDIAPIPE_HANDS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
const MEDIAPIPE_CAMERA_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils';

// Cache loaded scripts promise to avoid multi-injection
let scriptsPromise = null;

export function loadMediaPipeScripts() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.Hands && window.Camera) return Promise.resolve({ Hands: window.Hands, Camera: window.Camera });

  if (scriptsPromise) return scriptsPromise;

  scriptsPromise = new Promise((resolve, reject) => {
    const loadScript = (src) => {
      return new Promise((res, rej) => {
        // Check if already in DOM
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === 'true') {
            res();
          } else {
            existing.addEventListener('load', () => res());
            existing.addEventListener('error', rej);
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.onload = () => {
          script.dataset.loaded = 'true';
          res();
        };
        script.onerror = rej;
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript(`${MEDIAPIPE_CAMERA_CDN}/camera_utils.js`),
      loadScript(`${MEDIAPIPE_HANDS_CDN}/hands.js`)
    ])
      .then(() => {
        if (window.Hands) {
          resolve({ Hands: window.Hands, Camera: window.Camera });
        } else {
          reject(new Error('MediaPipe Hands failed to initialize on window object.'));
        }
      })
      .catch((err) => {
        scriptsPromise = null;
        reject(err);
      });
  });

  return scriptsPromise;
}

/**
 * Hand landmark connections for skeleton rendering
 */
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

/**
 * Distance calculation in 3D landmark coordinates
 */
export function calculatePinchDistance(thumbTip, indexTip) {
  if (!thumbTip || !indexTip) return 1.0;
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const dz = (thumbTip.z - indexTip.z) || 0;
  // Weight depth slightly lower as webcam z estimation is noisier than x/y
  return Math.sqrt(dx * dx + dy * dy + dz * dz * 0.4);
}

/**
 * Draw hand skeleton and pinch beam onto a 2D canvas context
 */
export function drawHandSkeleton(ctx, landmarks, isPinching, pinchProgress, width, height) {
  if (!ctx || !landmarks || landmarks.length < 21) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Draw connections
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)'; // Neon purple

  HAND_CONNECTIONS.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    if (!p1 || !p2) return;

    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  });

  // Draw joints
  landmarks.forEach((p, idx) => {
    const x = p.x * width;
    const y = p.y * height;

    ctx.beginPath();
    // Highlight thumb tip (4) and index tip (8)
    if (idx === 4 || idx === 8) {
      ctx.arc(x, y, isPinching ? 8 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = isPinching ? '#10b981' : '#06b6d4'; // Green when pinched, cyan when open
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    }
  });

  // Draw active pinch energy beam between thumb (4) and index (8)
  const thumb = landmarks[4];
  const index = landmarks[8];
  if (thumb && index) {
    const tx = thumb.x * width;
    const ty = thumb.y * height;
    const ix = index.x * width;
    const iy = index.y * height;

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ix, iy);

    // Color gradient based on pinch progress
    if (isPinching) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
    } else if (pinchProgress > 0.5) {
      ctx.strokeStyle = '#f59e0b'; // Amber warning closing in
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();

    // Draw midpoint pinch indicator
    const midX = (tx + ix) / 2;
    const midY = (ty + iy) / 2;
    ctx.beginPath();
    ctx.arc(midX, midY, isPinching ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = isPinching ? '#10b981' : '#38bdf8';
    ctx.fill();
  }

  ctx.restore();
}
