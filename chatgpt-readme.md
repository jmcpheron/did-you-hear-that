# Audiobook Podcast Player

A lightweight, fully-featured audiobook and podcast player built with HTML and JavaScript. Designed for simplicity, it leverages JSON feeds for hosting MP3 files (e.g., via Amazon S3 or any CDN) and maintains playback state using local storage. Ideal for personal audiobook collections, podcasts, or similar audio media hosted online.

## Features

- **MP3 Playback**: Stream audio files hosted remotely (Amazon S3, CDN) or locally during development.
- **Metadata via JSON**: Load episode and audiobook metadata through JSON feeds.
- **Playback State Management**: Local storage-based tracking for playback progress, pause positions, and listened status.
- **Browser-based UI**: Intuitive HTML and JavaScript interface optimized for desktop and mobile browsers.
- **Easy Deployment**: Quickly deployable to GitHub Pages.

## Project Structure

```plaintext
/
├── index.html
├── scripts/
│   └── main.js
├── styles/
│   └── styles.css
├── audio/
│   └── (local mp3 files for testing)
└── data/
    └── metadata.json
```

## Quick Start

### Local Development

1. Clone this repository:
```bash
git clone https://github.com/yourusername/audiobook-podcast-player.git
cd audiobook-podcast-player
```

2. Serve the files locally using your preferred development server (recommended: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VSCode).

3. Navigate to `http://localhost:5500` to view the application.

### Deployment to GitHub Pages

1. Commit and push your changes to GitHub.

2. Enable GitHub Pages under your repository settings:
```
Settings → Pages → Source: Main branch
```

3. Visit your deployed player at:
```
https://yourusername.github.io/audiobook-podcast-player/
```

## JSON Feed Structure (example)

```json
{
  "episodes": [
    {
      "id": "episode1",
      "title": "Episode 1: Getting Started",
      "description": "Introduction to our audiobook podcast.",
      "audioUrl": "https://your-cdn.com/path/to/audio1.mp3",
      "duration": "3600"
    },
    {
      "id": "episode2",
      "title": "Episode 2: Advanced Topics",
      "description": "Deep dive into advanced subjects.",
      "audioUrl": "https://your-cdn.com/path/to/audio2.mp3",
      "duration": "4200"
    }
  ]
}
```

## Browser Compatibility

Designed for modern browsers including Chrome, Firefox, Safari, and Edge on desktop and mobile devices.

## License

MIT License - see [LICENSE](LICENSE) file for details.

