# ScriptFlow — AI-Powered Scriptwriting

AI-powered scriptwriting app for Canva and the web. Write, generate, and format professional screenplay content.

## Features

- **Script Editor** — Block-based screenplay editor with action, dialogue, slugline, character, parenthetical, and transition blocks
- **Scene Generator** — AI-powered scene generation from a premise/outline
- **AI Tools** — Script Doctor, Tone Analyzer, Plot Hole Detector
- **Character Tracker** — Track characters, appearances, and dialogue stats
- **Script Statistics** — Word count, page estimate, scene breakdown
- **Export** — Export as plain text, formatted PDF, or Final Draft (FDX)
- **Collaboration Notes** — Add per-block notes and annotations
- **Insert to Design** — Format and insert screenplay text into Canva designs
- **Document Import** — Import scripts from text files

## Setup (Canva Plugin)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm start
   ```

3. In the [Canva Developer Portal](https://www.canva.com/developers/), create a new app and set the Development URL to `http://localhost:8080`.

## GitHub Pages (Standalone Web App)

1. Build for GitHub Pages:
   ```bash
   npm run build:gh-pages
   ```

2. The output is in `gh-pages/`. Deploy that folder to GitHub Pages.

   Or use GitHub Actions — see `.github/workflows/deploy.yml`.

## AI

ScriptFlow uses [Pollinations AI](https://pollinations.ai) — works out of the box with no API key. Optionally add a key in Settings for higher rate limits.
