# Did you hear that?

A fun, lightweight web player for your personal collection of interesting audio clips, podcasts, AI-generated summaries, and other sound bites you want to keep track of. It uses JSON feeds and saves your progress locally.

## MVP Features

*   **MP3 Playback**: Stream audio files defined in a JSON feed.
*   **JSON Metadata**: Load track information (title, URL, duration) from a `feed.json` file.
*   **Playback Progress Saving**: Uses browser local storage to remember the playback position for each track.
*   **Simple UI**: Basic HTML/CSS/JavaScript interface for playback controls.

## Project Structure

```plaintext
/
├── index.html              # Main HTML structure
├── styles/
│   └── style.css           # Basic styling
├── scripts/
│   └── main.js             # Core application logic & playback
├── data/
│   └── feed.json           # Metadata for audio feeds/tracks
├── sample_audio/           # Contains sample audio files (tracked by Git)
│   └── *.mp3
├── audio/                  # For **your** local audio files (ignored by Git)
│   └── .gitignore          # Ignores contents of audio/
├── run_server.py           # Simple Python HTTP server script
├── LICENSE                 # Project license (MIT)
└── README.md               # This file
```

## Quick Start

This section outlines how to set up the project structure and run the player locally once the initial files are created.

### Initial Setup

1.  **Create Project Directory:** Make a new folder for your project.
2.  **Create Files:** Inside the project folder, create the basic files and directories outlined in the **Project Structure** section above (`index.html`, `styles/style.css`, `scripts/main.js`, `data/feed.json`, `sample_audio/*`, `audio/.gitignore`).
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

**Note:** Since this project loads files like `data/feed.json` and `sample_audio/*` using relative paths, simply pushing these files to your GitHub repository makes them accessible to the deployed site. The `audio/` directory is ignored by Git by default and is intended for your private, local files.

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

## Sample Audio Content

The sample `data/feed.json` file included in this repository uses audio from different sources for demonstration purposes. Some tracks reference files within the `sample_audio/` directory.

*   **Default Fun Stuff Feed:** The audio files referenced in this feed (e.g., `sample_audio/openai-fm-coral-sports-coach.mp3`) were generated using a demo of OpenAI's audio generation technology, with permission according to their content generation guidelines. **Note:** As per OpenAI's terms, this audio content is AI-generated.
*   **Work Projects Audio Feed:** This feed uses publicly accessible audio samples for testing CDN/remote URL functionality:
    *   "Test Beep Sound": From [SoundJay.com](https://www.soundjay.com/) (check their specific license terms if using long-term).
    *   "MDN Roar Sample": From [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#examples) under a CC0 license.

When adding your own content, you can:
*   Place your MP3s in the `audio/` directory (they won't be tracked by Git) and update `data/feed.json` to point to them using relative paths like `"audio/your_file.mp3"`.
*   Use full URLs to files hosted on a CDN or elsewhere.
*   Ensure you have the necessary rights or licenses for the audio files you use.

## Future Enhancements (Potential)

*   Playback speed controls
*   Skip forward/backward buttons
*   Visual indication of played tracks
*   Support for multiple feeds/books

## License

This project is licensed under the MIT License. See the `LICENSE` file for details (you may need to create this file). 