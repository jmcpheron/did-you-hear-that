# Simple Audio Player

A lightweight, web-based player for audiobooks or podcasts hosted via JSON feeds. This MVP focuses on core playback functionality and progress saving using local storage.

## MVP Features

*   **MP3 Playback**: Stream audio files defined in a JSON feed.
*   **JSON Metadata**: Load track information (title, URL, duration) from a `feed.json` file.
*   **Playback Progress Saving**: Uses browser local storage to remember the playback position for each track.
*   **Simple UI**: Basic HTML/CSS/JavaScript interface for playback controls.

## Project Structure

```plaintext
/
├── index.html          # Main HTML structure
├── styles/
│   └── style.css       # Basic styling
├── scripts/
│   └── main.js         # Core application logic & playback
└── data/
    └── feed.json       # Metadata for audio tracks
```

## Quick Start

This section outlines how to set up the project structure and run the player locally once the initial files are created.

### Initial Setup

1.  **Create Project Directory:** Make a new folder for your project.
2.  **Create Files:** Inside the project folder, create the basic files and directories outlined in the **Project Structure** section above (`index.html`, `styles/style.css`, `scripts/main.js`, `data/feed.json`).
3.  **Populate `data/feed.json`:** Add metadata for your audio tracks according to the **JSON Feed Structure** example.

### Local Development (After Setup)

1.  **Activate Environment:** Open your terminal in the project directory and activate the Python virtual environment:
    *   On macOS/Linux: `source .venv/bin/activate`
    *   On Windows (Command Prompt): `.venv\Scripts\activate.bat`
    *   On Windows (PowerShell): `.venv\Scripts\Activate.ps1`
    *(Note: If using VS Code with the Python extension, opening the integrated terminal might automatically activate the environment configured in `.vscode/settings.json`.)*

2.  **Run the Server:** With the environment active, run the provided Python server script:
    ```bash
    python run_server.py
    ```

3.  **Access:** The script will output the address. Open `http://localhost:8000/` in your browser.
4.  **Stop Server:** Press `Ctrl+C` in the terminal where the server is running.

### Deployment (Once Developed)

This project is simple enough to be deployed easily to platforms like GitHub Pages:

1.  Initialize a Git repository in your project folder and commit your files.
2.  Push your code to a new GitHub repository.
3.  Enable GitHub Pages in your repository settings (Settings → Pages → Source). Choose the appropriate branch.
4.  Your player will be live at `https://yourusername.github.io/your-repo-name/`.

## JSON Feed Structure (`data/feed.json`)

The player expects a JSON file structured like this:

```json
{
  "tracks": [
    {
      "id": "track1",
      "title": "Chapter 1: The Beginning",
      "audioUrl": "https://your-hosting.com/path/to/audio1.mp3",
      "duration": 3600  // Duration in seconds (optional but helpful)
    },
    {
      "id": "track2",
      "title": "Chapter 2: The Middle",
      "audioUrl": "https://your-hosting.com/path/to/audio2.mp3",
      "duration": 4250
    }
    // Add more tracks as needed
  ]
}
```

## Future Enhancements (Potential)

*   Playback speed controls
*   Skip forward/backward buttons
*   Visual indication of played tracks
*   Support for multiple feeds/books

## License

This project is licensed under the MIT License. See the `LICENSE` file for details (you may need to create this file). 