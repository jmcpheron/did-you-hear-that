document.addEventListener('DOMContentLoaded', () => {
    const audioElement = document.getElementById('audio-element');
    const trackListElement = document.getElementById('track-list');
    const trackTitleElement = document.getElementById('track-title');
    const trackDescriptionElement = document.getElementById('track-description');

    let tracks = [];
    let currentTrackId = null;
    let currentTrackDuration = 0;

    // --- Helper Function ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

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
        trackData.forEach((track) => {
            const li = document.createElement('li');
            li.dataset.trackId = track.id;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = track.title;

            const progressSpan = document.createElement('span');
            progressSpan.className = 'track-progress';
            // Use track.duration if available in JSON, otherwise wait for loadedmetadata
            const initialDuration = track.duration ? formatTime(track.duration) : '--:--';
            progressSpan.textContent = ` (0:00 / ${initialDuration})`;
            progressSpan.dataset.trackId = track.id; // Easier lookup

            li.appendChild(titleSpan);
            li.appendChild(progressSpan);

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

        // Reset progress text for the *previously* playing track (if any)
        resetPreviousTrackProgress();

        currentTrackId = track.id;
        audioElement.src = track.audioUrl;
        trackTitleElement.textContent = track.title;
        trackDescriptionElement.textContent = track.description || '';
        updatePlayingClass(trackId);

        const savedTime = localStorage.getItem(`audio_pos_${track.id}`);
        // Set current time *before* play, if loading saved state
        if (savedTime) {
            audioElement.currentTime = parseFloat(savedTime);
        }
        // Update display immediately based on potentially saved time
        updateProgressDisplay(trackId, audioElement.currentTime, audioElement.duration);

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

    function getProgressSpan(trackId) {
        return trackListElement.querySelector(`span.track-progress[data-track-id="${trackId}"]`);
    }

    function updateProgressDisplay(trackId, currentTime, duration) {
        const progressSpan = getProgressSpan(trackId);
        if (progressSpan) {
            const formattedCurrent = formatTime(currentTime);
            const formattedDuration = (duration && Number.isFinite(duration)) ? formatTime(duration) : '--:--';
            progressSpan.textContent = ` (${formattedCurrent} / ${formattedDuration})`;
        }
    }

    function resetPreviousTrackProgress() {
        const previousTrackId = currentTrackId; // Get the ID before changing it
        if (previousTrackId) {
             const track = tracks.find(t => t.id === previousTrackId);
             const savedTime = parseFloat(localStorage.getItem(`audio_pos_${previousTrackId}`) || 0);
             const duration = track?.duration || 0; // Use JSON duration if available
             updateProgressDisplay(previousTrackId, savedTime, duration);
        }
    }

    // --- Event Listeners ---
    audioElement.addEventListener('loadedmetadata', () => {
        // Duration is now available
        currentTrackDuration = audioElement.duration;
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, audioElement.currentTime, currentTrackDuration);
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (currentTrackId) {
            const currentTime = audioElement.currentTime;
            localStorage.setItem(`audio_pos_${currentTrackId}`, currentTime.toString());
            localStorage.setItem('last_played_track_id', currentTrackId);
            // Use the duration we stored on loadedmetadata if available
            updateProgressDisplay(currentTrackId, currentTime, currentTrackDuration || audioElement.duration);
        }
    });

     audioElement.addEventListener('ended', () => {
         // Optionally: Reset progress when track finishes or move to next
         if (currentTrackId) {
             updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
             localStorage.setItem(`audio_pos_${currentTrackId}`, '0'); // Reset saved pos
             // Add logic here to play next track if desired
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

            currentTrackId = lastPlayedId;
            audioElement.src = track.audioUrl;
            trackTitleElement.textContent = track.title;
            trackDescriptionElement.textContent = track.description || '';
            updatePlayingClass(lastPlayedId);

            if (savedTime) {
                const numericTime = parseFloat(savedTime);
                // Use a flag to prevent race condition with loadedmetadata setting time
                let timeSetFromStorage = false;

                const setInitialTime = () => {
                    if (!timeSetFromStorage) {
                         audioElement.currentTime = numericTime;
                         timeSetFromStorage = true;
                         // Update display after setting time
                         updateProgressDisplay(lastPlayedId, numericTime, audioElement.duration);
                    }
                };

                // Try setting time immediately if metadata might already be loaded
                if (audioElement.readyState >= 1) { // HAVE_METADATA or more
                   setInitialTime();
                }

                // Always listen for loadedmetadata as a fallback or for initial load
                audioElement.addEventListener('loadedmetadata', () => {
                     setInitialTime();
                     // Ensure duration is updated in display
                     updateProgressDisplay(lastPlayedId, audioElement.currentTime, audioElement.duration);
                 }, { once: true });

            } else {
                // Update display even if no saved time (shows 0:00 / --:--)
                updateProgressDisplay(lastPlayedId, 0, 0);
            }
            console.log(`Loaded last state: Track ${lastPlayedId} at ${savedTime || 0}s`);
        } else {
            console.log("No valid last state found.");
        }
    }

}); 