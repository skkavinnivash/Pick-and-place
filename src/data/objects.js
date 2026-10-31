// Comprehensive library of 50 recognizable objects with distinct emojis, names, and vibrant color themes.
export const OBJECT_LIBRARY = [
  { id: 'apple', name: 'Red Apple', emoji: '🍎', color: '#ff4d4d', category: 'Food' },
  { id: 'key', name: 'Golden Key', emoji: '🔑', color: '#e6b800', category: 'Tools' },
  { id: 'phone', name: 'Smartphone', emoji: '📱', color: '#38bdf8', category: 'Tech' },
  { id: 'ball', name: 'Soccer Ball', emoji: '⚽', color: '#f8fafc', category: 'Sports' },
  { id: 'rocket', name: 'Space Rocket', emoji: '🚀', color: '#f43f5e', category: 'Travel' },
  { id: 'guitar', name: 'Acoustic Guitar', emoji: '🎸', color: '#fb923c', category: 'Music' },
  { id: 'watch', name: 'Wrist Watch', emoji: '⌚', color: '#94a3b8', category: 'Accessory' },
  { id: 'diamond', name: 'Shiny Diamond', emoji: '💎', color: '#06b6d4', category: 'Treasure' },
  { id: 'pizza', name: 'Pizza Slice', emoji: '🍕', color: '#f59e0b', category: 'Food' },
  { id: 'coffee', name: 'Hot Coffee', emoji: '☕', color: '#b45309', category: 'Beverage' },
  { id: 'headphones', name: 'Headphones', emoji: '🎧', color: '#a855f7', category: 'Tech' },
  { id: 'trophy', name: 'Gold Trophy', emoji: '🏆', color: '#eab308', category: 'Awards' },
  { id: 'camera', name: 'Camera', emoji: '📷', color: '#64748b', category: 'Tech' },
  { id: 'car', name: 'Red Sports Car', emoji: '🚗', color: '#ef4444', category: 'Vehicles' },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', color: '#10b981', category: 'Vehicles' },
  { id: 'airplane', name: 'Jet Airplane', emoji: '✈️', color: '#60a5fa', category: 'Vehicles' },
  { id: 'bulb', name: 'Light Bulb', emoji: '💡', color: '#facc15', category: 'Tools' },
  { id: 'bell', name: 'Golden Bell', emoji: '🔔', color: '#f59e0b', category: 'Tools' },
  { id: 'crown', name: 'Royal Crown', emoji: '👑', color: '#eab308', category: 'Treasure' },
  { id: 'compass', name: 'Navigator Compass', emoji: '🧭', color: '#14b8a6', category: 'Travel' },
  { id: 'palette', name: 'Artist Palette', emoji: '🎨', color: '#ec4899', category: 'Art' },
  { id: 'gift', name: 'Gift Box', emoji: '🎁', color: '#f43f5e', category: 'Items' },
  { id: 'lock', name: 'Padlock', emoji: '🔒', color: '#eab308', category: 'Security' },
  { id: 'sunglasses', name: 'Sunglasses', emoji: '🕶️', color: '#64748b', category: 'Fashion' },
  { id: 'magnet', name: 'Horseshoe Magnet', emoji: '🧲', color: '#ef4444', category: 'Science' },
  { id: 'telescope', name: 'Telescope', emoji: '🔭', color: '#6366f1', category: 'Science' },
  { id: 'planet', name: 'Ringed Planet', emoji: '🪐', color: '#d97706', category: 'Space' },
  { id: 'lightning', name: 'Lightning Bolt', emoji: '⚡', color: '#facc15', category: 'Nature' },
  { id: 'umbrella', name: 'Rain Umbrella', emoji: '☂️', color: '#8b5cf6', category: 'Weather' },
  { id: 'book', name: 'Hardcover Book', emoji: '📖', color: '#3b82f6', category: 'Education' },
  { id: 'pen', name: 'Fountain Pen', emoji: '✒️', color: '#64748b', category: 'Stationery' },
  { id: 'clock', name: 'Alarm Clock', emoji: '⏰', color: '#ef4444', category: 'Time' },
  { id: 'cup', name: 'Tea Cup', emoji: '🍵', color: '#10b981', category: 'Beverage' },
  { id: 'shoe', name: 'Running Sneaker', emoji: '👟', color: '#38bdf8', category: 'Fashion' },
  { id: 'dice', name: 'Lucky Dice', emoji: '🎲', color: '#ec4899', category: 'Games' },
  { id: 'candle', name: 'Wax Candle', emoji: '🕯️', color: '#f59e0b', category: 'Light' },
  { id: 'violin', name: 'Classical Violin', emoji: '🎻', color: '#b45309', category: 'Music' },
  { id: 'fire', name: 'Campfire', emoji: '🔥', color: '#f97316', category: 'Nature' },
  { id: 'anchor', name: 'Nautical Anchor', emoji: '⚓', color: '#475569', category: 'Marine' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#ea580c', category: 'Sports' },
  { id: 'puzzle', name: 'Puzzle Piece', emoji: '🧩', color: '#06b6d4', category: 'Games' },
  { id: 'donut', name: 'Glazed Donut', emoji: '🍩', color: '#d946ef', category: 'Food' },
  { id: 'flask', name: 'Science Flask', emoji: '🧪', color: '#10b981', category: 'Science' },
  { id: 'flashlight', name: 'Flashlight', emoji: '🔦', color: '#eab308', category: 'Tools' },
  { id: 'hourglass', name: 'Hourglass', emoji: '⏳', color: '#ca8a04', category: 'Time' },
  { id: 'backpack', name: 'School Backpack', emoji: '🎒', color: '#ef4444', category: 'Travel' },
  { id: 'axe', name: 'Lumber Axe', emoji: '🪓', color: '#b45309', category: 'Tools' },
  { id: 'microscope', name: 'Microscope', emoji: '🔬', color: '#8b5cf6', category: 'Science' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', color: '#ec4899', category: 'Nature' },
  { id: 'drum', name: 'Marching Drum', emoji: '🥁', color: '#dc2626', category: 'Music' }
];

export const DIFFICULTY_CONFIG = {
  easy: {
    id: 'easy',
    name: 'Easy',
    itemCount: 10,
    previewSeconds: 15,
    challengeSeconds: 60,
    gridCols: 5,
    gridRows: 2,
    badge: 'Beginner',
    color: '#10b981',
    description: '10 objects to remember in 15 seconds. Great warm-up!'
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    itemCount: 15,
    previewSeconds: 15,
    challengeSeconds: 60,
    gridCols: 5,
    gridRows: 3,
    badge: 'Challenger',
    color: '#f59e0b',
    description: '15 objects. Requires sharp spatial memory and concentration.'
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    itemCount: 20,
    previewSeconds: 15,
    challengeSeconds: 60,
    gridCols: 5,
    gridRows: 4,
    badge: 'Grandmaster',
    color: '#ef4444',
    description: '20 objects in 15 seconds! Only the sharpest minds conquer this.'
  }
};

/**
 * Randomly pick N distinct items from the library and assign them to slots 1..N.
 * Also returns a shuffled copy for the challenge tray.
 */
export function generateGameRound(difficultyKey = 'easy') {
  const config = DIFFICULTY_CONFIG[difficultyKey] || DIFFICULTY_CONFIG.easy;
  const count = config.itemCount;

  // Shuffle the library
  const pool = [...OBJECT_LIBRARY].sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  // Assign original slot numbers (1-indexed)
  const originalSlots = selected.map((item, idx) => ({
    ...item,
    originalSlot: idx + 1
  }));

  // Create a shuffled tray list (so items do not appear in order)
  let shuffledTray = [...originalSlots].sort(() => Math.random() - 0.5);
  // Ensure the tray isn't accidentally in original order
  if (shuffledTray.every((item, idx) => item.originalSlot === idx + 1) && count > 1) {
    shuffledTray.reverse();
  }

  return {
    config,
    originalSlots, // The correct reference array
    shuffledTray   // The objects for the user to pick from
  };
}
