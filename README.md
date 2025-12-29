# unlimited-wordle

An unlimited play Wordle variant built with React. Play as many games as you want with three difficulty levels and track your stats.

## Features

- **Unlimited Gameplay**: Play as many games as you want - no daily limit
- **Three Difficulty Levels**:
  - Easy: Common everyday words
  - Medium: Moderately challenging vocabulary
  - Hard: Obscure and tricky words with unusual letter patterns
- **Word Validation**: Uses a comprehensive 14,854-word allow list plus dictionary API fallback
- **Stats Tracking**: Tracks games played, win percentage, current streak, and best streak
- **Animated UI**: Smooth tile flips, color reveals, and glassmorphic design
- **Share Results**: Copy emoji grid to share your results
- **Persistent Stats**: Game statistics are saved locally

## How to Play

- Guess the 5-letter word in 6 tries
- Each guess must be a valid 5-letter word
- Color feedback after each guess:
  - Green: Letter is correct and in the right position
  - Yellow: Letter is in the word but in the wrong position
  - Gray: Letter is not in the word
- Select difficulty level to adjust word complexity
- Track your winning streak and compete with yourself

## Tech Stack

- React with hooks (useState, useEffect, useCallback)
- Glassmorphic UI with animated gradient backgrounds
- Local storage for persistent statistics
- Dictionary API integration for word validation
