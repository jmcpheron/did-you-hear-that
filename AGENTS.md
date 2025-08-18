# Repository Guidelines

## Project Structure & Modules
- `index.html`: App shell and UI layout.
- `scripts/main.js`: Player logic, feed management, UI interactions.
- `styles/style.css`: Theme, layout, and responsive styles.
- `data/feed.json`: Default feeds/tracks; safe to edit.
- `sample_audio/`: Sample media and art tracked by Git.
- `audio/`: Your local media (ignored by Git).
- `run_server.py`: Local static server on port 8000.

## Build, Test, and Dev Commands
- `python run_server.py`: Start a local server at `http://localhost:8000/`.
- No build step: Static HTML/CSS/JS served as-is.
- Alternative: `python -m http.server 8000` from repo root.

## Coding Style & Naming
- JavaScript: Use `const`/`let`, semicolons, single quotes, 4‑space indent; keep functions small and UI updates centralized in `main.js`.
- CSS: Prefer variables in `:root`, class-based selectors, and mobile-friendly layouts; avoid high specificity.
- Python: PEP 8 for `run_server.py`.
- Filenames/paths: lower-case with hyphens or underscores (e.g., `sample_audio`, `main.js`).
- JSON feed: stable `id`, human-readable `title`, relative `audioUrl` when local (e.g., `sample_audio/foo.mp3`).

## Testing Guidelines
- No automated tests. Manually verify in Chrome/Safari:
  - Load and switch feeds, play/pause, seek, and speed controls.
  - Local storage resume works across refresh.
  - Album art shows/hides correctly; video errors handled.
- Run locally via `python run_server.py`; test mobile via LAN if needed.

## Commit & Pull Request Guidelines
- Commit style observed: Conventional Commits preferred (`feat:`, `fix:`, `refactor:`, `style:`) with imperative subject (e.g., `feat: show current playlist name`).
- Keep commits focused; reference issues in body when relevant.
- PRs: include a clear summary, screenshots/GIFs for UI changes, reproduction/verification steps, and linked issues.

## Security & Configuration Tips
- Keep large media out of Git: place personal files in `audio/` (gitignored).
- Verify external URLs in feeds are from trusted sources and support CORS/https.
- For deployment (e.g., GitHub Pages), ensure `data/feed.json` and assets resolve via relative paths.
