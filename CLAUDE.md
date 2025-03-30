# AIUIDO Development Guide

## Build & Run Commands
- **Start server**: `python run_server.py` (runs on http://localhost:8000)
- **Virtual environment**:
  - macOS/Linux: `source .venv/bin/activate`
  - Windows (Command Prompt): `.venv\Scripts\activate.bat`
  - Windows (PowerShell): `.venv\Scripts\Activate.ps1`

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