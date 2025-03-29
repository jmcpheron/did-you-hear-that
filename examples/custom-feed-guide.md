# Creating Custom Feeds for "Did you hear that?"

Custom feeds allow you to add your own collection of audio tracks to the player. This guide walks you through creating and adding a custom feed.

## Feed Structure

A custom feed must be a JSON file with the following structure:

```json
{
  "feeds": [
    {
      "id": "unique-feed-id",     // Required: A unique identifier for this feed
      "title": "My Custom Feed",  // Required: The display name for this feed
      "tracks": [
        {
          "id": "track-1",        // Required: A unique ID within this feed
          "title": "Track Title", // Required: Display title of the track
          "audioUrl": "https://example.com/audio.mp3", // Required: URL to the audio file
          "description": "About this track" // Optional: Track description
        },
        // Add more tracks as needed...
      ]
    }
    // You can include multiple feeds in one file
  ]
}
```

## Key Requirements

1. **File Format**: Must be valid JSON and accessible via a URL
2. **Required Fields**: Each feed needs an `id`, `title`, and `tracks` array
3. **Track Fields**: Each track needs an `id`, `title`, and `audioUrl`
4. **Audio URLs**: Can be relative (for local files) or absolute (remote files)
5. **CORS**: For remote files, the server must allow cross-origin requests

## Example Feed

See our [sample custom feed](./sample-custom-feed.json) as a template.

## Adding a Custom Feed

1. Create your feed JSON file and host it somewhere accessible via URL
2. Copy the URL to your feed
3. Paste it into the "Add feed URL" input and click "Add Feed"
4. If everything is valid, your feed will appear in the dropdown

## Testing with Local Feeds

For testing, you can try our sample feed URL:

```
http://YOUR_HOST_URL/examples/sample-custom-feed.json
```

Replace `YOUR_HOST_URL` with wherever your site is hosted (e.g., your GitHub Pages URL).

## Troubleshooting

If you're having trouble adding a feed:

1. Verify your JSON is valid (use a JSON validator)
2. Check that your file is accessible at the URL you provided
3. For remote audio files, ensure CORS headers are set correctly
4. Open your browser's developer console (F12) for error details 