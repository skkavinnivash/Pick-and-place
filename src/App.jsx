import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import PreviewPhase from './components/PreviewPhase';
import ChallengePhase from './components/ChallengePhase';
import ResultsScreen from './components/ResultsScreen';
import RulesModal from './components/RulesModal';
import HighScoresModal from './components/HighScoresModal';
import HandGestureOverlay from './components/HandGestureOverlay';
import { HandGestureProvider } from './context/HandGestureContext';
import { DIFFICULTY_CONFIG, generateGameRound } from './data/objects';
import { soundFx } from './utils/audio';
import { getHighScores, saveHighScore } from './utils/storage';
import './App.css';

export default function App() {
  // Game lifecycle phase: 'home' | 'preview' | 'challenge' | 'results'
  const [phase, setPhase] = useState('home');

  // Selected difficulty: 'easy' (10) | 'medium' (15) | 'hard' (20)
  const [difficultyKey, setDifficultyKey] = useState('easy');

  // Round data: { config, originalSlots, shuffledTray }
  const [roundData, setRoundData] = useState(null);

  // Results data: { placements, timeUsed, isNewHigh }
  const [resultsData, setResultsData] = useState(null);

  // High scores tracking
  const [highScores, setHighScores] = useState(() => getHighScores());

  // Modals state
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);

  // Sound state
  const [soundMuted, setSoundMuted] = useState(soundFx.muted);

  // Refresh high scores from storage
  const refreshHighScores = useCallback(() => {
    setHighScores(getHighScores());
  }, []);

  useEffect(() => {
    refreshHighScores();
  }, [refreshHighScores]);

  // Toggle sound
  const handleToggleSound = () => {
    const isMuted = soundFx.toggleMute();
    setSoundMuted(isMuted);
    if (!isMuted) {
      soundFx.pickup();
    }
  };

  // Start Game: Generate fresh randomized objects and enter Preview Phase
  const handleStartGame = () => {
    const newRound = generateGameRound(difficultyKey);
    setRoundData(newRound);
    setResultsData(null);
    setPhase('preview');
  };

  // Preview countdown completes -> transition into 60s Challenge Phase
  const handlePreviewComplete = useCallback(() => {
    setPhase('challenge');
  }, []);

  // Challenge completed (by submission or timer expiration)
  const handleChallengeComplete = useCallback((finalPlacements, timeUsed) => {
    if (!roundData) return;

    // Calculate accuracy and score
    let correctCount = 0;
    roundData.originalSlots.forEach((orig) => {
      const placed = finalPlacements[orig.originalSlot];
      if (placed && placed.id === orig.id) {
        correctCount += 1;
      }
    });

    const score = correctCount * 10;
    const accuracy = Math.round((correctCount / roundData.originalSlots.length) * 100);

    // Save high score locally
    const { isNewHigh } = saveHighScore(difficultyKey, score, accuracy, timeUsed);
    refreshHighScores();

    setResultsData({
      placements: finalPlacements,
      timeUsed,
      isNewHigh
    });

    setPhase('results');
  }, [roundData, difficultyKey, refreshHighScores]);

  // Play Again: Re-roll with the same difficulty
  const handlePlayAgain = () => {
    soundFx.pickup();
    handleStartGame();
  };

  // Change Difficulty: Go to home screen to select difficulty
  const handleChangeDifficulty = () => {
    soundFx.pickup();
    setPhase('home');
  };

  // Go to Home screen
  const handleGoHome = () => {
    soundFx.remove();
    setPhase('home');
  };

  return (
    <HandGestureProvider>
      <div className="app-wrapper">
        {/* Virtual Hand Cursor & Webcam HUD Overlay */}
        <HandGestureOverlay />

        {/* Decorative ambient background glows */}
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />

        <div className="main-container">
          {/* Navigation Bar */}
          <Navbar
            phase={phase}
            difficulty={DIFFICULTY_CONFIG[difficultyKey]}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenHighScores={() => setIsHighScoresOpen(true)}
            onGoHome={handleGoHome}
          />

          {/* Dynamic Game Phases */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {phase === 'home' && (
              <HomeScreen
                selectedDifficulty={difficultyKey}
                onSelectDifficulty={setDifficultyKey}
                onStartGame={handleStartGame}
                highScores={highScores}
                onOpenRules={() => setIsRulesOpen(true)}
              />
            )}

            {phase === 'preview' && roundData && (
              <PreviewPhase
                originalSlots={roundData.originalSlots}
                difficultyConfig={roundData.config}
                onPreviewComplete={handlePreviewComplete}
              />
            )}

            {phase === 'challenge' && roundData && (
              <ChallengePhase
                originalSlots={roundData.originalSlots}
                shuffledTray={roundData.shuffledTray}
                difficultyConfig={roundData.config}
                onChallengeComplete={handleChallengeComplete}
              />
            )}

            {phase === 'results' && roundData && resultsData && (
              <ResultsScreen
                originalSlots={roundData.originalSlots}
                placements={resultsData.placements}
                timeUsed={resultsData.timeUsed}
                difficultyConfig={roundData.config}
                isNewHigh={resultsData.isNewHigh}
                onPlayAgain={handlePlayAgain}
                onChangeDifficulty={handleChangeDifficulty}
                onGoHome={handleGoHome}
              />
            )}
          </main>
        </div>

        {/* Rules Modal */}
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

        {/* High Scores Modal */}
        <HighScoresModal
          isOpen={isHighScoresOpen}
          onClose={() => setIsHighScoresOpen(false)}
          highScores={highScores}
        />
      </div>
    </HandGestureProvider>
  );
}
