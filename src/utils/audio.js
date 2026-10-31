// Web Audio API Synthesizer for 100% reliable, zero-latency in-browser sound effects.

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isInitialized = false;

    // Load mute preference from localStorage
    try {
      const saved = localStorage.getItem('memory_master_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.isInitialized = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('memory_master_muted', String(this.muted));
    } catch {
      // storage error ignored
    }
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, pitchBend = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      if (pitchBend) {
        osc.frequency.exponentialRampToValueAtTime(
          pitchBend,
          this.ctx.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio playback failsafe
    }
  }

  // Timer Tick (soft click)
  tick() {
    this.playTone(800, 'sine', 0.04, 0.08);
  }

  // Urgent Countdown Tick (last 10s)
  urgentTick() {
    this.playTone(950, 'triangle', 0.08, 0.18, 550);
  }

  // Preview countdown tick
  previewTick(isLastThree = false) {
    if (isLastThree) {
      this.playTone(880, 'triangle', 0.12, 0.22, 1100);
    } else {
      this.playTone(520, 'sine', 0.06, 0.1);
    }
  }

  // Card Picked Up / Selected
  pickup() {
    this.playTone(440, 'sine', 0.08, 0.12, 660);
  }

  // Card Dropped / Placed in slot
  drop() {
    this.playTone(550, 'triangle', 0.09, 0.15, 750);
  }

  // Card Swapped between slots
  swap() {
    this.playTone(600, 'sine', 0.07, 0.12, 800);
    setTimeout(() => {
      this.playTone(720, 'sine', 0.07, 0.1, 900);
    }, 60);
  }

  // Card Removed back to tray
  remove() {
    this.playTone(650, 'sine', 0.08, 0.1, 400);
  }

  // Preview Phase Ended
  previewEnd() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15, 0.16);
      }, idx * 70);
    });
  }

  // Game Completed / Victory Fanfare
  victory(isHighAccuracy = true) {
    if (this.muted) return;
    if (isHighAccuracy) {
      const melody = [523.25, 659.25, 783.99, 1046.5];
      melody.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.35, 0.2);
        }, i * 120);
      });
    } else {
      const melody = [440, 493.88, 523.25];
      melody.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.25, 0.15);
        }, i * 120);
      });
    }
  }

  // Time Expired Buzzer
  timeUp() {
    this.playTone(320, 'sawtooth', 0.3, 0.18, 180);
    setTimeout(() => {
      this.playTone(280, 'sawtooth', 0.4, 0.2, 140);
    }, 180);
  }
}

export const soundFx = new SoundFX();
