# Scripts for "Did You Hear That?"

This directory contains utility scripts for managing the "Did You Hear That?" application.

## import_feed.py

This script allows you to import feeds from a JSON file into the main `data/feed.json` file.

### Usage

```bash
python3 scripts/import_feed.py <source_file> [--target <target_file>] [--replace]
```

#### Arguments

- `source_file`: Path to the source JSON file containing feeds to import
- `--target`: (Optional) Path to the target feed.json file (default: data/feed.json)
- `--replace`: (Optional) Replace existing feeds instead of merging them

#### Examples

Import feeds from a new file:
```bash
python3 scripts/import_feed.py examples/new-simple-feed.json
```

Import feeds to a different target file:
```bash
python3 scripts/import_feed.py examples/new-simple-feed.json --target data/custom-feed.json
```

Replace existing feeds instead of merging:
```bash
python3 scripts/import_feed.py examples/new-simple-feed.json --replace
```

### JSON Format

The source file should have the following format:

```json
{
  "feeds": [
    {
      "id": "feed-id",
      "title": "Feed Title",
      "tracks": [
        {
          "id": "track-id",
          "title": "Track Title",
          "audioUrl": "https://example.com/audio.mp3",
          "description": "Track description"
        }
      ]
    }
  ]
}
```

Each feed must have an `id` and each track must have an `id` for the merge process to work correctly. 