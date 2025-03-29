document.addEventListener('DOMContentLoaded', () => {
    const audioElement = document.getElementById('audio-element');
    const trackListElement = document.getElementById('track-list');
    const trackTitleElement = document.getElementById('track-title');
    const trackDescriptionElement = document.getElementById('track-description');

    let tracks = [];
    let currentTrackId = null;

    // --- Fetch and Populate Track List ---
    fetch('data/feed.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            tracks = data.tracks;
            populateTrackList(tracks);
            // Load last played track/position if available
            loadLastState();
        })
        .catch(error => {
            console.error('Error fetching or parsing feed:', error);
            trackListElement.innerHTML = '<li>Error loading tracks.</li>';
        });

    function populateTrackList(trackData) {
        trackListElement.innerHTML = ''; // Clear loading message
        trackData.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = track.title;
            li.dataset.trackId = track.id;
            li.dataset.index = index;
            li.addEventListener('click', () => {
                playTrack(track.id);
            });
            trackListElement.appendChild(li);
        });
    }

    // --- Playback Logic ---
    function playTrack(trackId) {
        const track = tracks.find(t => t.id === trackId);
        if (!track) {
            console.error('Track not found:', trackId);
            return;
        }

        currentTrackId = track.id;
        audioElement.src = track.audioUrl;
        trackTitleElement.textContent = track.title;
        trackDescriptionElement.textContent = track.description || ''; // Show description if available

        // Highlight the playing track
        updatePlayingClass(trackId);

        // Load saved position for this track, then play
        const savedTime = localStorage.getItem(`audio_pos_${track.id}`);
        if (savedTime) {
            audioElement.currentTime = parseFloat(savedTime);
        }
        audioElement.play().catch(e => console.error("Error playing audio:", e));
    }

    function updatePlayingClass(playingTrackId) {
        const items = trackListElement.querySelectorAll('li');
        items.forEach(item => {
            if (item.dataset.trackId === playingTrackId) {
                item.classList.add('playing');
            } else {
                item.classList.remove('playing');
            }
        });
    }

    // --- State Saving/Loading (Local Storage) ---
    audioElement.addEventListener('timeupdate', () => {
        if (currentTrackId) {
            localStorage.setItem(`audio_pos_${currentTrackId}`, audioElement.currentTime.toString());
            // Also save the ID of the track being played
            localStorage.setItem('last_played_track_id', currentTrackId);
        }
    });

    // Optional: Save state when the page is about to unload
    window.addEventListener('beforeunload', () => {
        if (currentTrackId && !audioElement.paused) {
             localStorage.setItem(`audio_pos_${currentTrackId}`, audioElement.currentTime.toString());
             localStorage.setItem('last_played_track_id', currentTrackId);
        }
    });

    function loadLastState() {
        const lastPlayedId = localStorage.getItem('last_played_track_id');
        if (lastPlayedId && tracks.some(t => t.id === lastPlayedId)) {
            const track = tracks.find(t => t.id === lastPlayedId);
            const savedTime = localStorage.getItem(`audio_pos_${lastPlayedId}`);
            
            // Set the source and info, but don't auto-play yet
            currentTrackId = lastPlayedId;
            audioElement.src = track.audioUrl;
            trackTitleElement.textContent = track.title;
            trackDescriptionElement.textContent = track.description || '';
            updatePlayingClass(lastPlayedId); // Highlight without playing

            if (savedTime) {
                // Set the time without playing immediately
                // Need to wait for metadata to load potentially
                audioElement.addEventListener('loadedmetadata', () => {
                    audioElement.currentTime = parseFloat(savedTime);
                }, { once: true }); // Ensure this runs only once per load
            }
            console.log(`Loaded last state: Track ${lastPlayedId} at ${savedTime || 0}s`);
        } else {
             console.log("No valid last state found.");
        }
    }

}); 