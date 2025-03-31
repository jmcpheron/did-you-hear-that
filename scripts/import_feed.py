#!/usr/bin/env python3
import json
import argparse
import os
from pathlib import Path

def load_json_file(filepath):
    """Load JSON data from a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading JSON file {filepath}: {e}")
        return None

def save_json_file(filepath, data):
    """Save JSON data to a file."""
    try:
        with open(filepath, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print(f"Successfully saved data to {filepath}")
        return True
    except Exception as e:
        print(f"Error saving to {filepath}: {e}")
        return False

def merge_feeds(main_data, new_data, replace_existing=False):
    """Merge new feeds into main data."""
    if not main_data or 'feeds' not in main_data:
        print("Main data is invalid or missing 'feeds' key")
        return None
    
    if not new_data or 'feeds' not in new_data:
        print("New data is invalid or missing 'feeds' key")
        return None
    
    # Get existing feed IDs for quick lookup
    existing_feed_ids = {feed['id']: i for i, feed in enumerate(main_data['feeds'])}
    
    # Process each new feed
    for new_feed in new_data['feeds']:
        feed_id = new_feed.get('id')
        if not feed_id:
            print(f"Skipping feed without ID: {new_feed.get('title', 'Unknown')}")
            continue
        
        # Check if feed already exists
        if feed_id in existing_feed_ids:
            if replace_existing:
                print(f"Replacing existing feed: {feed_id}")
                main_data['feeds'][existing_feed_ids[feed_id]] = new_feed
            else:
                print(f"Merging tracks for feed: {feed_id}")
                existing_feed = main_data['feeds'][existing_feed_ids[feed_id]]
                
                # Get existing track IDs
                existing_track_ids = {track['id'] for track in existing_feed.get('tracks', [])}
                
                # Add new tracks that don't exist yet
                for new_track in new_feed.get('tracks', []):
                    track_id = new_track.get('id')
                    if not track_id:
                        print(f"  Skipping track without ID in feed {feed_id}")
                        continue
                    
                    if track_id not in existing_track_ids:
                        if 'tracks' not in existing_feed:
                            existing_feed['tracks'] = []
                        existing_feed['tracks'].append(new_track)
                        print(f"  Added new track: {track_id}")
                    else:
                        print(f"  Track already exists: {track_id}")
        else:
            print(f"Adding new feed: {feed_id}")
            main_data['feeds'].append(new_feed)
    
    return main_data

def main():
    parser = argparse.ArgumentParser(description='Import feeds from a JSON file into the main feed.json')
    parser.add_argument('source_file', help='Path to the source JSON file containing feeds to import')
    parser.add_argument('--target', default='data/feed.json', help='Path to the target feed.json file (default: data/feed.json)')
    parser.add_argument('--replace', action='store_true', help='Replace existing feeds instead of merging them')
    
    args = parser.parse_args()
    
    # Resolve paths
    source_path = Path(args.source_file)
    target_path = Path(args.target)
    
    # Check if source file exists
    if not source_path.exists():
        print(f"Error: Source file {source_path} does not exist")
        return
    
    # Create target directory if it doesn't exist
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Load data from source file
    new_data = load_json_file(source_path)
    if not new_data:
        return
        
    # Load existing data or create new structure
    if target_path.exists():
        main_data = load_json_file(target_path)
        if not main_data:
            return
    else:
        print(f"Target file {target_path} doesn't exist. Creating new feed file.")
        main_data = {'feeds': []}
    
    # Merge the feeds
    updated_data = merge_feeds(main_data, new_data, args.replace)
    if not updated_data:
        return
    
    # Save the updated data
    success = save_json_file(target_path, updated_data)
    if success:
        print(f"Successfully imported feeds from {source_path} to {target_path}")
    
if __name__ == "__main__":
    main() 