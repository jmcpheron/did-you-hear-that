# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AIUIDO Development Guide

## Build & Run Commands
- **Start server**: `python run_server.py` (runs on http://localhost:8000)
- **Virtual environment**:
  - macOS/Linux: `source .venv/bin/activate`
  - Windows (Command Prompt): `.venv\Scripts\activate.bat`
  - Windows (PowerShell): `.venv\Scripts\Activate.ps1`

## Project Architecture

This is a lightweight, static web audio player for managing and playing personal audio collections. It consists of three main components:

### Core Files
- **index.html**: Main application structure with semantic HTML5 and accessibility features
- **scripts/main.js**: Complete application logic (~1800 lines) handling playback, feed management, UI interactions, and local storage
- **styles/style.css**: CSS with custom properties for theming, responsive design, and BEM-like naming conventions
- **run_server.py**: Simple Python HTTP server for local development

### Data Layer
- **data/feed.json**: Default feed configuration with multiple feed support (Classic Cartoons, Audio Books, Sound Board)
- **sample_audio/**: Demo audio files and album art (tracked in git)
- **audio/**: User's local audio files (gitignored)

### Key Architectural Patterns
- **State Management**: Pure JavaScript with localStorage persistence for playback positions, feed preferences, and UI states
- **Feed System**: JSON-based feed structure supporting multiple feeds with tracks, metadata, and remote URLs
- **Media Handling**: Dual audio/video support - uses HTML5 audio element for playback control and video element for visual display when playing video files
- **Progressive Web App**: Includes manifest.json for PWA installation capabilities

## Code Style Guidelines

### JavaScript
- Use modern ES6+ features with arrow functions for callbacks
- `camelCase` for variables/functions, `UPPERCASE_WITH_UNDERSCORES` for constants
- Descriptive variable names (e.g., `currentTrackId`, `feedOptionsList`)
- Error handling with try/catch and user-friendly notifications
- State management through explicit variables and local storage
- HTML element variables named after their IDs

### HTML/CSS
- Semantic HTML5 elements with accessibility attributes
- BEM-like class naming convention
- CSS variables for theming with responsive mobile-first design
- 4-space indentation

### Project Organization
- HTML in root, CSS in `styles/`, JavaScript in `scripts/`, data in `data/`
- JSON feed structure: Required fields (id, title, audioUrl) use camelCase
- Clear code sections with `--- Section Name ---` format comments