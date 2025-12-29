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
- Vite for building and development
- Glassmorphic UI with animated gradient backgrounds
- Tailwind CSS for styling
- Local storage for persistent statistics
- Dictionary API integration for word validation

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is set up to automatically deploy to GitHub Pages using GitHub Actions.

### Automatic Deployment

When you push to the `main` branch, the GitHub Actions workflow will:
1. Install dependencies
2. Build the project
3. Deploy to GitHub Pages

### Initial Setup Required

Before the automatic deployment works, you need to configure GitHub Pages:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The next push to `main` will trigger the deployment

Your site will be live at: https://sumitsbasra.github.io/unlimited-wordle/

### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
npm run deploy
```

This will build and push the `dist` folder to the `gh-pages` branch.
