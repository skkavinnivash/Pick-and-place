// LocalStorage manager for persisting high scores and game statistics.

const HIGH_SCORES_KEY = 'memory_master_high_scores_v1';

export function getHighScores() {
  try {
    const data = localStorage.getItem(HIGH_SCORES_KEY);
    if (!data) {
      return {
        easy: { score: 0, accuracy: 0, timeUsed: 60, date: null },
        medium: { score: 0, accuracy: 0, timeUsed: 60, date: null },
        hard: { score: 0, accuracy: 0, timeUsed: 60, date: null }
      };
    }
    return JSON.parse(data);
  } catch {
    return {
      easy: { score: 0, accuracy: 0, timeUsed: 60, date: null },
      medium: { score: 0, accuracy: 0, timeUsed: 60, date: null },
      hard: { score: 0, accuracy: 0, timeUsed: 60, date: null }
    };
  }
}

export function saveHighScore(difficulty, score, accuracy, timeUsed) {
  try {
    const scores = getHighScores();
    const current = scores[difficulty] || { score: 0, accuracy: 0, timeUsed: 60 };

    // New high score if:
    // 1. higher score, OR
    // 2. same score but achieved in less time
    const isNewHigh = score > current.score || (score === current.score && score > 0 && timeUsed < current.timeUsed);

    if (isNewHigh) {
      scores[difficulty] = {
        score,
        accuracy,
        timeUsed,
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
      return { isNewHigh: true, bestScore: score };
    }

    return { isNewHigh: false, bestScore: current.score };
  } catch {
    return { isNewHigh: false, bestScore: score };
  }
}
