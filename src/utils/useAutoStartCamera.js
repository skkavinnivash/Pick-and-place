/**
 * useAutoStartCamera
 * 
 * A React hook that automatically starts the hand tracking camera when:
 * 1. The URL contains `?autoCamera=1` (launched via launch.bat), OR
 * 2. The user previously had camera enabled (localStorage preference), OR
 * 3. `forceAuto` is passed as true
 * 
 * Usage:
 *   import { useAutoStartCamera } from '../utils/useAutoStartCamera';
 *   // Call inside HandGestureProvider or any component inside it:
 *   useAutoStartCamera();
 */

import { useEffect, useRef } from 'react';

/**
 * Check if this page load should auto-start the camera.
 * Returns true when:
 *  - URL search param ?autoCamera=1 is present (set by launch.bat)
 *  - OR localStorage 'mm_camera_enabled' is 'true' (user previously enabled it)
 */
export function shouldAutoStartCamera() {
  // URL param: ?autoCamera=1
  const params = new URLSearchParams(window.location.search);
  if (params.get('autoCamera') === '1') return true;

  // Saved user preference
  if (localStorage.getItem('mm_camera_enabled') === 'true') return true;

  return false;
}

/**
 * Hook: Auto-start camera on mount based on URL param or user preference.
 * 
 * @param {Object} options
 * @param {boolean} options.isCameraEnabled  - current camera state
 * @param {Function} options.setIsCameraEnabled - setter to enable camera
 * @param {boolean} [options.forceAuto] - force auto-start regardless of URL/prefs
 */
export function useAutoStartCamera({ isCameraEnabled, setIsCameraEnabled, forceAuto = false }) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only trigger once per mount
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const autoStart = forceAuto || shouldAutoStartCamera();

    if (autoStart && !isCameraEnabled) {
      // Small delay to let the DOM fully render before requesting camera
      const timer = setTimeout(() => {
        setIsCameraEnabled(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally empty deps — only run once on mount
}

/**
 * Remove the ?autoCamera=1 param from the URL without page reload.
 * Call after camera has been auto-started to clean up the URL.
 */
export function cleanAutoStartUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('autoCamera')) {
      url.searchParams.delete('autoCamera');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Non-critical, ignore errors
  }
}
