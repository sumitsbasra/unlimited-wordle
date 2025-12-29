import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ALLOWED_WORDS } from './allowed-words.js';

// Words organized by difficulty (common → obscure)
const EASY_WORDS = [
  'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GRAPE', 'HOUSE', 'JUICE', 'KNIFE',
  'LEMON', 'MANGO', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'STONE', 'TIGER', 'WATER',
  'BRAIN', 'DREAM', 'GHOST', 'HEART', 'LIGHT', 'MUSIC', 'PEACE', 'SPACE', 'TRAIN', 'WORLD',
  'BREAD', 'CLEAN', 'DRINK', 'FRESH', 'GREEN', 'HAPPY', 'LAUGH', 'PARTY', 'SLEEP', 'SMART',
  'BLOOD', 'CHILD', 'DEATH', 'EARLY', 'FIELD', 'GLASS', 'HONOR', 'IMAGE', 'JOINT', 'LUNCH',
  'MONEY', 'PLANT', 'RADIO', 'SALAD', 'TABLE', 'VIDEO', 'WOMAN', 'YOUTH', 'ALARM', 'BASIC'
];

const MEDIUM_WORDS = [
  'CRANE', 'EAGLE', 'FROST', 'GLEAM', 'IVORY', 'JOKER', 'KNEEL', 'LUNAR', 'MARCH', 'NOBLE',
  'ORBIT', 'PRIDE', 'QUEST', 'ROYAL', 'SHINE', 'TREND', 'ULTRA', 'VIVID', 'YIELD', 'ADAPT',
  'BLEND', 'CLIMB', 'DRIVE', 'ENJOY', 'FOCUS', 'GRANT', 'HASTE', 'INTRO', 'JOLLY', 'KARMA',
  'LAYER', 'MINOR', 'NOVEL', 'OASIS', 'PHASE', 'QUOTE', 'RELAY', 'SHARE', 'TOUCH', 'URBAN',
  'VALOR', 'WEAVE', 'ACUTE', 'BLAZE', 'CHARM', 'DRAFT', 'EMBED', 'FAIRY', 'GLIDE', 'HAZEL',
  'INLET', 'JUMPY', 'LEASE', 'MAPLE', 'NINJA', 'OLIVE', 'PEARL', 'RADAR', 'SALSA', 'THUMB'
];

const HARD_WORDS = [
  'AXIOM', 'BAYOU', 'CYNIC', 'DRYLY', 'EVOKE', 'FJORD', 'GLYPH', 'HYPER', 'IRONY', 'JAZZY',
  'KAYAK', 'LYMPH', 'MYRRH', 'NYMPH', 'PROXY', 'QUARK', 'RHYME', 'SYNOD', 'TRYST', 'ULCER',
  'VEXED', 'WRYLY', 'XENON', 'YACHT', 'ZESTY', 'APHID', 'BLUFF', 'CRYPT', 'DWARF', 'EPOCH',
  'FLUFF', 'GRUFF', 'HUTCH', 'JIFFY', 'KIOSK', 'LLAMA', 'MORPH', 'NUTTY', 'ABYSM', 'BUXOM',
  'CAULK', 'FRIZZ', 'GAUZE', 'HUSKY', 'KLUTZ', 'LURCH', 'MULCH', 'PIXIE', 'QUAFF',
  'SQUAB', 'THYME', 'USURP', 'VODKA', 'WALTZ', 'ZILCH', 'AFFIX', 'BLITZ', 'ETHOS', 'GNASH'
];

const WORD_LISTS = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: HARD_WORDS
};

// Combine all answer words into a set for quick validation (always valid)
const ALL_ANSWER_WORDS = new Set([...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS]);

const STORAGE_KEY = 'wordle-stats-v3';

export default function Wordle() {
  const [difficulty, setDifficulty] = useState('easy');
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ played: 0, won: 0, currentStreak: 0, maxStreak: 0 });
  const [revealedRows, setRevealedRows] = useState([]);
  const [revealedTiles, setRevealedTiles] = useState({});
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load stats from storage on mount
  useEffect(() => {
    const loadStats = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setStats(JSON.parse(stored));
        }
      } catch (e) {
        // Storage not available or key doesn't exist
      }
    };
    loadStats();
  }, []);

  // Save stats to storage
  const saveStats = (newStats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch (e) {
      // Storage not available
    }
  };

  // Validate word using local allow list (fast) or dictionary API (fallback)
  const validateWord = async (word) => {
    // Always allow words that are in our answer lists
    if (ALL_ANSWER_WORDS.has(word)) {
      return true;
    }

    // Check against standard Wordle allow list (14,854 words) - instant validation
    if (ALLOWED_WORDS.has(word)) {
      return true;
    }

    // Fallback to dictionary API for words not in the allow list
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return response.ok;
    } catch (e) {
      // If API fails (network error), allow the word to keep game playable
      return true;
    }
  };

  const getRandomWord = useCallback((diff) => {
    const words = WORD_LISTS[diff];
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  const startNewGame = useCallback((diff = difficulty) => {
    const newWord = getRandomWord(diff);
    setTargetWord(newWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setMessage('');
    setRevealedRows([]);
    setRevealedTiles({});
    setShowEndScreen(false);
    setCopied(false);
  }, [difficulty, getRandomWord]);

  useEffect(() => {
    startNewGame();
  }, []);

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setDropdownOpen(false);
    startNewGame(newDifficulty);
  };

  const getLetterStatus = (letter, index, guess) => {
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) {
      const targetCount = targetWord.split('').filter(l => l === letter).length;
      const correctCount = guess.split('').filter((l, i) => l === letter && targetWord[i] === letter).length;
      const previousYellows = guess.slice(0, index).split('').filter((l, i) => l === letter && targetWord[i] !== letter).length;
      if (correctCount + previousYellows < targetCount) return 'present';
    }
    return 'absent';
  };

  const revealTilesSequentially = useCallback((rowIndex) => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setRevealedTiles(prev => ({
          ...prev,
          [`${rowIndex}-${i}`]: true
        }));
      }, i * 300 + 150);
    }
  }, []);

  const handleKeyPress = useCallback(async (key) => {
    if (gameOver || isValidating) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setShake(true);
        setMessage('Not enough letters');
        setTimeout(() => {
          setShake(false);
          setMessage('');
        }, 500);
        return;
      }

      // Validate word
      setIsValidating(true);
      setMessage('Checking...');
      const isValid = await validateWord(currentGuess);
      setIsValidating(false);
      setMessage('');

      if (!isValid) {
        setShake(true);
        setMessage('Not in word list');
        setTimeout(() => {
          setShake(false);
          setMessage('');
        }, 1500);
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      
      const rowIndex = newGuesses.length - 1;
      setTimeout(() => {
        setRevealedRows(prev => [...prev, rowIndex]);
        revealTilesSequentially(rowIndex);
      }, 50);

      if (currentGuess === targetWord) {
        setTimeout(() => {
          setWon(true);
          setGameOver(true);
          const newStats = {
            played: stats.played + 1,
            won: stats.won + 1,
            currentStreak: stats.currentStreak + 1,
            maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1)
          };
          setStats(newStats);
          saveStats(newStats);
          setShowEndScreen(true);
        }, 1800);
      } else if (newGuesses.length >= 6) {
        setTimeout(() => {
          setGameOver(true);
          const newStats = {
            played: stats.played + 1,
            won: stats.won,
            currentStreak: 0,
            maxStreak: stats.maxStreak
          };
          setStats(newStats);
          saveStats(newStats);
          setShowEndScreen(true);
        }, 1800);
      }

      setCurrentGuess('');
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, guesses, gameOver, targetWord, revealTilesSequentially, stats, isValidating]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (showEndScreen) return;
      
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, showEndScreen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  const getKeyboardStatus = () => {
    const status = {};
    guesses.forEach((guess, rowIndex) => {
      guess.split('').forEach((letter, index) => {
        if (!revealedTiles[`${rowIndex}-${index}`]) return;
        const letterStatus = getLetterStatus(letter, index, guess);
        if (status[letter] === 'correct') return;
        if (status[letter] === 'present' && letterStatus !== 'correct') return;
        status[letter] = letterStatus;
      });
    });
    return status;
  };

  const generateEmojiGrid = () => {
    const emojiMap = {
      correct: '🟩',
      present: '🟨',
      absent: '⬛'
    };
    
    const grid = guesses.map(guess => {
      return guess.split('').map((letter, index) => {
        const status = getLetterStatus(letter, index, guess);
        return emojiMap[status];
      }).join('');
    }).join('\n');
    
    const result = won ? `${guesses.length}/6` : 'X/6';
    const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    return `Wordle (${diffLabel}) ${result}\n\n${grid}`;
  };

  const copyToClipboard = async () => {
    const text = generateEmojiGrid();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const keyboardStatus = getKeyboardStatus();
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const renderTile = (letter, status, index, isCurrentRow, rowRevealing, rowIndex) => {
    const baseStyle = "w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase rounded-lg transition-all";

    const tileKey = `${rowIndex}-${index}`;
    const isRevealed = revealedTiles[tileKey];

    let glassClass = 'glass-tile';
    let textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';

    if (isRevealed && status) {
      if (status === 'correct') {
        glassClass = 'glass-correct';
        textColor = 'text-white';
      } else if (status === 'present') {
        glassClass = 'glass-present';
        textColor = 'text-white';
      } else {
        glassClass = 'glass-absent';
        textColor = 'text-white';
      }
    } else if (letter && isCurrentRow) {
      glassClass = 'glass-tile';
      textColor = isDarkMode ? 'text-white' : 'text-gray-900';
    }

    const animationDelay = rowRevealing ? `${index * 0.3}s` : '0s';
    const flipClass = rowRevealing ? 'animate-flip' : '';
    const popClass = isCurrentRow && letter && !rowRevealing ? 'animate-pop' : '';

    return (
      <div
        key={index}
        className={`${baseStyle} ${glassClass} ${textColor} ${flipClass} ${popClass}`}
        style={{
          animationDelay,
          transformStyle: 'preserve-3d'
        }}
      >
        {letter}
      </div>
    );
  };

  const renderRow = (rowIdx) => {
    const guess = guesses[rowIdx];
    const isCurrentRow = rowIdx === guesses.length;
    const rowRevealing = revealedRows.includes(rowIdx);
    
    const letters = guess 
      ? guess.split('') 
      : isCurrentRow 
        ? currentGuess.padEnd(5, ' ').split('').map(c => c === ' ' ? '' : c)
        : Array(5).fill('');

    return (
      <div 
        key={rowIdx} 
        className={`flex gap-1.5 ${shake && isCurrentRow ? 'animate-shake' : ''}`}
      >
        {letters.map((letter, index) => {
          const status = guess ? getLetterStatus(letter, index, guess) : null;
          return renderTile(letter, status, index, isCurrentRow, rowRevealing, rowIdx);
        })}
      </div>
    );
  };

  const winPercentage = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  const difficultyColors = {
    easy: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hard: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`flex flex-col items-center py-4 px-2 relative overflow-y-auto overflow-x-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
    }`} style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
    }}>
      {/* Fixed Background for iOS Safari */}
      <div className={`fixed inset-0 -z-10 ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
          : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
      }`} />

      {/* Animated Gradient Orbs */}
      <div className={`fixed -top-48 -left-48 w-96 h-96 rounded-full blur-3xl animate-float-slow -z-10 ${
        isDarkMode
          ? 'bg-gradient-to-br from-indigo-500/40 to-purple-500/40'
          : 'bg-gradient-to-br from-blue-400/30 to-purple-400/30'
      }`} />
      <div className={`fixed -bottom-48 -right-48 w-96 h-96 rounded-full blur-3xl animate-float-delayed -z-10 ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-500/40 to-pink-500/40'
          : 'bg-gradient-to-br from-pink-400/30 to-orange-400/30'
      }`} />

      <style>{`
        @keyframes flip {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-flip {
          animation: flip 0.6s ease-in-out forwards;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-pop {
          animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float-slow {
          animation: floatSlow 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatDelayed 25s ease-in-out infinite;
        }
        .glass {
          background: ${isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'};
        }
        .glass-dark {
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0, 0, 0, 0.3)'};
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .glass-tile {
          background: ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(255, 255, 255, 0.8)'};
          box-shadow:
            0 4px 6px rgba(0, 0, 0, ${isDarkMode ? '0.3' : '0.05'}),
            0 1px 3px rgba(0, 0, 0, ${isDarkMode ? '0.2' : '0.05'}),
            inset 0 1px 0 ${isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(255, 255, 255, 0.9)'};
        }
        .glass-correct {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          box-shadow:
            0 8px 32px rgba(16, 185, 129, 0.3),
            0 4px 8px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .glass-present {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          box-shadow:
            0 8px 32px rgba(245, 158, 11, 0.3),
            0 4px 8px rgba(245, 158, 11, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .glass-absent {
          background: linear-gradient(135deg, rgba(100, 116, 139, 0.85), rgba(71, 85, 105, 0.85));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="glass rounded-2xl p-4 mb-6 shadow-lg">
          <div className="relative flex items-center justify-between">
            {/* Difficulty Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <span className={difficulty === 'easy' ? 'text-green-600' : difficulty === 'medium' ? 'text-amber-600' : 'text-red-600'}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 glass rounded-xl shadow-xl overflow-hidden z-10 min-w-[140px]">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDifficultyChange(diff);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all ${
                        diff === difficulty ? 'bg-white/50' : 'hover:bg-white/30'
                      } ${diff === 'easy' ? 'text-green-600' : diff === 'medium' ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl font-bold tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              wordle
            </h1>

            {/* Stats Summary */}
            <div className={`text-xs font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div>{stats.won}W - {stats.played - stats.won}L</div>
              <div className="text-base">🔥 {stats.currentStreak}</div>
            </div>
          </div>
        </div>

        {message && !showEndScreen && (
          <div className={`text-center mb-4 py-3 px-5 rounded-xl font-semibold shadow-lg ${
            isValidating
              ? 'glass text-indigo-700'
              : 'glass-dark text-white'
          }`}>
            {message}
          </div>
        )}

        <div className="flex flex-col items-center gap-1.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map(renderRow)}
        </div>

        <div className="flex flex-col items-center gap-2 w-full px-1">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1.5 justify-center w-full max-w-xl">
              {row.map((key) => {
                const status = keyboardStatus[key];
                let glassClass = 'glass';
                let textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';

                if (status === 'correct') {
                  glassClass = 'glass-correct';
                  textColor = 'text-white';
                } else if (status === 'present') {
                  glassClass = 'glass-present';
                  textColor = 'text-white';
                } else if (status === 'absent') {
                  glassClass = 'glass-absent';
                  textColor = 'text-white';
                }

                const isWide = key === 'ENTER' || key === 'BACKSPACE';

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    disabled={gameOver || isValidating}
                    className={`${glassClass} ${textColor} ${isWide ? 'px-4 sm:px-5' : 'w-9 sm:w-11'} h-12 sm:h-14 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center shadow-md ${
                      gameOver || isValidating
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    {key === 'BACKSPACE' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                      </svg>
                    ) : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className={`text-center text-sm mt-8 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Guess the 5-letter word in 6 tries
        </p>
      </div>

      {/* End Screen Modal */}
      {showEndScreen && (
        <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50">
          <div className="glass rounded-3xl p-8 max-w-sm w-full animate-slideUp shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{won ? '🎉' : '😔'}</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {won ? 'You Won!' : 'Game Over'}
              </h2>
              {!won && (
                <p className={`mt-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  The word was <span className="font-bold text-indigo-400">{targetWord}</span>
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center glass-tile rounded-xl p-3">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.played}</div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Played</div>
              </div>
              <div className="text-center glass-tile rounded-xl p-3">
                <div className="text-2xl font-bold text-indigo-500">{winPercentage}</div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Win %</div>
              </div>
              <div className="text-center glass-tile rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Streak</div>
              </div>
              <div className="text-center glass-tile rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-500">{stats.maxStreak}</div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best</div>
              </div>
            </div>

            {/* Emoji Grid Preview */}
            <div className="glass-tile rounded-2xl p-5 mb-5">
              <pre className={`text-center text-sm leading-relaxed font-mono whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {generateEmojiGrid()}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 glass-correct text-white font-bold py-4 px-5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </>
                )}
              </button>
              <button
                onClick={() => startNewGame()}
                className="flex-1 flex items-center justify-center gap-2 glass-dark text-white font-bold py-4 px-5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Wordle />
  </React.StrictMode>
);
