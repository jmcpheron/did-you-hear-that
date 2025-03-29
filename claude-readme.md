# AudioBook Player

A fully-featured web-based audiobook and podcast player built with HTML, CSS, and JavaScript.

## Features

- **Media Playback**: Stream and play MP3 audiobooks and podcasts
- **Progress Tracking**: Remembers where you left off in each book/episode
- **Library Management**: Organize your audiobooks and podcasts
- **Metadata Support**: Display book/episode information, chapters, and artwork
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Local storage for tracking progress and settings
- **Cloud Integration**: Support for loading content from S3/CDN via JSON feeds

## Project Structure

```
audiobook-player/
├── index.html              # Main application page
├── css/
│   └── styles.css          # Application styling
├── js/
│   ├── app.js              # Main application logic
│   ├── player.js           # Audio player functionality
│   ├── storage.js          # Local storage handling
│   └── feed.js             # JSON feed handling
├── assets/
│   ├── icons/              # Application icons
│   └── demo/               # Demo audio files for development
├── data/
│   ├── books.json          # Sample audiobook metadata
│   └── feeds.json          # Sample feed configuration
└── README.md               # This file
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/audiobook-player.git
   cd audiobook-player
   ```

2. Open `index.html` in your browser for local development.

3. To deploy to GitHub Pages:
   - Push your code to a GitHub repository
   - Go to repository Settings > Pages
   - Select the main branch as the source
   - Your site will be published at `https://yourusername.github.io/audiobook-player/`

## Development Notes

### Local Storage Structure

The application uses browser local storage to save:
- Playback position for each audio file
- Playback speed preferences
- Recently played items
- User library organization

### JSON Feed Format

Books/podcasts are loaded from JSON feeds with this structure:

```json
{
  "title": "Book Title",
  "author": "Author Name",
  "cover": "cover-image-url.jpg",
  "description": "Book description text",
  "tracks": [
    {
      "title": "Chapter 1",
      "file": "https://cdn-url.com/book/chapter1.mp3",
      "duration": 1234
    },
    ...
  ]
}
```

### Adding Demo Content

For development, place MP3 files in the `assets/demo/` directory and update the `data/books.json` file with corresponding metadata.

## Future Enhancements

- User accounts for cloud sync across devices
- Bookmarking functionality
- Variable playback speed
- Sleep timer
- Chapter navigation
- Playlists and queues

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Acknowledgments

- [HTML5 Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)