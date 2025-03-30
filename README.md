# Did you hear that?

A fun, lightweight web player for your personal collection of interesting audio clips, podcasts, AI-generated summaries, and other sound bites you want to keep track of. It uses JSON feeds and saves your progress locally.

## Features

*   **MP3 Playback**: Stream audio files defined in a JSON feed.
*   **JSON Metadata**: Load track information (title, URL, duration, album art) from a `feed.json` file.
*   **Multiple Feeds Support**: Add, manage, and switch between multiple audio feeds.
*   **Playback Controls**: Play/pause, previous/next, and playback speed controls (0.5x, 1.0x, 1.5x, 2.0x).
*   **Album Art Support**: Display custom album art for feeds and tracks.
*   **Playback Progress Saving**: Uses browser local storage to remember the playback position for each track.
*   **Responsive UI**: Modern, clean interface that works on desktop, tablet, and mobile devices.
*   **Touch-Optimized**: Enhanced touch controls and layouts for tablet and mobile users.
*   **Custom Feed Management**: Add, remove, and switch between different audio feeds.
*   **PWA-Ready**: Can be installed as a Progressive Web App on compatible devices.

## Project Structure

```plaintext
/
├── index.html              # Main HTML structure
├── styles/
│   └── style.css           # Styling for the player UI
├── scripts/
│   └── main.js             # Core application logic & playback
├── data/
│   └── feed.json           # Metadata for default audio feeds/tracks
├── sample_audio/           # Contains sample audio files (tracked by Git)
│   └── *.mp3, *.png        # Audio files and album art images
├── audio/                  # For **your** local audio files (ignored by Git)
│   └── .gitignore          # Ignores contents of audio/
├── run_server.py           # Simple Python HTTP server script
├── LICENSE                 # Project license (MIT)
└── README.md               # This file
```

## Quick Start

This section outlines how to set up the project structure and run the player locally.

### Initial Setup

1.  **Clone the Repository:** Clone this repository to your local machine.
2.  **Create Python Environment (Optional):** If you don't already have Python installed, you'll need it to run the local server.

### Local Development

1.  **Run the Server:** From the project directory, run the provided Python server script:
    ```bash
    python run_server.py
    ```

2.  **Access:** Open `http://localhost:8000/` in your browser.
3.  **Stop Server:** Press `Ctrl+C` in the terminal where the server is running.

### Deployment

This project consists of static HTML, CSS, and JavaScript files, making it ideal for deployment on [GitHub Pages](https://pages.github.com/).

1.  **Ensure code is committed:** Make sure all your latest changes (HTML, CSS, JS, `data/feed.json`, and `sample_audio/*` files) are committed to your local Git repository.
2.  **Create GitHub Repository:** Create a new repository on GitHub. Do *not* initialize it with a README, license, or .gitignore if you plan to push your existing repository.
3.  **Link Local Repo to GitHub:** Follow the instructions provided by GitHub after creating the repository to push your existing local repository to GitHub. This usually involves commands like:
    ```bash
    # Add the remote repository URL (replace with your actual URL)
    git remote add origin https://github.com/yourusername/your-repo-name.git 
    # Rename default branch to main (if needed)
    git branch -M main 
    # Push your code to GitHub
    git push -u origin main 
    ```
4.  **Enable GitHub Pages:**
    *   Go to your repository on GitHub.com.
    *   Click on the "Settings" tab.
    *   Navigate to the "Pages" section in the left sidebar.
    *   Under "Build and deployment", select "Deploy from a branch" as the Source.
    *   Choose the branch containing your code (usually `main`).
    *   Select `/ (root)` as the folder.
    *   Click "Save".
5.  **Access Site:** GitHub Pages will build and deploy your site. It might take a minute or two. The URL will be provided in the Pages settings section, typically in the format `https://yourusername.github.io/your-repo-name/`.

## JSON Feed Structure

The player expects a JSON file structured like this:

```json
{
  "feeds": [
    {
      "id": "default",
      "title": "Default Fun Stuff",
      "tracks": [
        {
          "id": "track1",
          "title": "Episode 1: Introduction",
          "description": "Welcome to our first episode.",
          "audioUrl": "sample_audio/episode1.mp3",
          "albumArt": "sample_audio/cover1.png",
          "duration": 3600  // Duration in seconds (optional)
        },
        {
          "id": "track2",
          "title": "Episode 2: Deep Dive",
          "description": "In this episode, we take a deeper look.",
          "audioUrl": "sample_audio/episode2.mp3",
          "albumArt": "sample_audio/cover2.png"
        }
      ]
    },
    {
      "id": "another_feed",
      "title": "Another Feed",
      "tracks": [
        ...
      ]
    }
  ]
}
```

## Adding Custom Feeds

You can add your own custom feeds in three ways:

1. **Edit data/feed.json**: Add your feeds directly to the default feed file.
2. **Add via UI**: Use the "Add Feed" form in the player interface by providing a URL to your feed JSON file.
3. **Local Files**: Place your MP3s in the `audio/` directory and update your feed JSON to reference them with relative paths.

## Sample Audio Content

The sample `data/feed.json` file included in this repository uses various audio files for demonstration purposes:

*   **Default Fun Stuff Feed**: Includes AI-generated audio content (created with OpenAI's audio generation technology) and other sample clips.
*   **Work Projects Audio Feed**: Uses publicly accessible audio samples for testing remote URL functionality.

When adding your own content, ensure you have the necessary rights or licenses for the audio files you use.

## Future Enhancements (Potential)

*   Drag-and-drop playlist reordering
*   Audio visualization
*   Dark/light theme toggle
*   Offline playback support
*   Audio bookmarks within tracks
*   Integration with podcast RSS feeds

## License

This project is licensed under the MIT License. See the `LICENSE` file for details. 