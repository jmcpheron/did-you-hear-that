document.addEventListener('DOMContentLoaded', () => {
    const audioElement = document.getElementById('audio-element');
    const trackListElement = document.getElementById('track-list');
    const trackTitleElement = document.getElementById('track-title');
    const trackDescriptionElement = document.getElementById('track-description');

    // New custom control elements
    const playPauseButton = document.getElementById('play-pause-button');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const totalDurationDisplay = document.getElementById('total-duration');

    let tracks = [];
    let currentTrackId = null;
    let currentTrackDuration = 0;
    let isSeeking = false; // Flag to prevent timeupdate conflicts while dragging seek bar

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
        // Reset seek bar and time displays initially
        seekBar.value = savedTime ? parseFloat(savedTime) : 0;
        currentTimeDisplay.textContent = savedTime ? formatTime(parseFloat(savedTime)) : '0:00';
        totalDurationDisplay.textContent = '--:--'; // Will be updated on loadedmetadata

        // Important: Play returns a Promise, handle potential errors/autoplay restrictions
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Playback started successfully
                updatePlayPauseButton(true); // Show pause icon
            }).catch(error => {
                // Autoplay was prevented.
                console.error("Playback error or autoplay prevented:", error);
                updatePlayPauseButton(false); // Show play icon
                // Optionally alert the user that they might need to click play manually
            });
        }
    }

    function togglePlayPause() {
        if (!currentTrackId) { // Don't do anything if no track is loaded
            // Maybe load the first track?
            if(tracks.length > 0) {
                playTrack(tracks[0].id);
            }
            return;
        }

        if (audioElement.paused || audioElement.ended) {
            audioElement.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing:", e));
        } else {
            audioElement.pause();
            updatePlayPauseButton(false);
        }
    }

    function updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            playPauseButton.textContent = '⏸️'; // Pause symbol
            playPauseButton.setAttribute('aria-label', 'Pause');
        } else {
            playPauseButton.textContent = '▶️'; // Play symbol
            playPauseButton.setAttribute('aria-label', 'Play');
        }
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
             // Get duration from audio element if possible, else from track data
             const duration = (audioElement.src === track?.audioUrl && audioElement.duration) 
                              ? audioElement.duration 
                              : (track?.duration || 0);
             updateProgressDisplay(previousTrackId, savedTime, duration);
        }
    }

    // --- Event Listeners ---
    audioElement.addEventListener('loadedmetadata', () => {
        // Duration is now available
        currentTrackDuration = audioElement.duration;
        seekBar.max = currentTrackDuration; // Set seek bar max value
        totalDurationDisplay.textContent = formatTime(currentTrackDuration);
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, audioElement.currentTime, currentTrackDuration);
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (!isSeeking && currentTrackId) { // Only update if user isn't actively dragging the seek bar
            const currentTime = audioElement.currentTime;
            seekBar.value = currentTime; // Update seek bar position
            currentTimeDisplay.textContent = formatTime(currentTime); // Update time display
            localStorage.setItem(`audio_pos_${currentTrackId}`, currentTime.toString());
            localStorage.setItem('last_played_track_id', currentTrackId);
            updateProgressDisplay(currentTrackId, currentTime, currentTrackDuration || audioElement.duration);
        }
    });

    audioElement.addEventListener('play', () => {
        updatePlayPauseButton(true);
    });

    audioElement.addEventListener('pause', () => {
        updatePlayPauseButton(false);
    });

    audioElement.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        seekBar.value = 0; // Reset seek bar
        currentTimeDisplay.textContent = formatTime(0);
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
            localStorage.setItem(`audio_pos_${currentTrackId}`, '0');
        }
        // Optionally play next track here
    });

    // Custom Control Listeners
    playPauseButton.addEventListener('click', togglePlayPause);

    seekBar.addEventListener('input', () => {
        // Show the time tooltip while dragging, but don't update audio yet
        isSeeking = true;
        currentTimeDisplay.textContent = formatTime(seekBar.value);
    });

    seekBar.addEventListener('change', () => {
        // User finished dragging/clicked the seek bar
        audioElement.currentTime = parseFloat(seekBar.value);
        isSeeking = false;
        if (audioElement.paused) {
             // If paused, play after seeking unless it was already at the end
            if (audioElement.currentTime < audioElement.duration) {
                togglePlayPause();
            }
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
            const numericTime = savedTime ? parseFloat(savedTime) : 0;

            currentTrackId = lastPlayedId;
            audioElement.src = track.audioUrl; // Set src first
            trackTitleElement.textContent = track.title;
            trackDescriptionElement.textContent = track.description || '';
            updatePlayingClass(lastPlayedId);

            // Set initial state of controls
            updatePlayPauseButton(false);
            currentTimeDisplay.textContent = formatTime(numericTime);

            const handleMetadata = () => {
                 currentTrackDuration = audioElement.duration;
                 seekBar.max = currentTrackDuration;
                 seekBar.value = numericTime;
                 totalDurationDisplay.textContent = formatTime(currentTrackDuration);
                 // Crucially, set the currentTime *after* metadata is loaded
                 audioElement.currentTime = numericTime;
                 updateProgressDisplay(lastPlayedId, numericTime, currentTrackDuration);
                 console.log(`Loaded last state: Track ${lastPlayedId} at ${numericTime}s. Duration: ${currentTrackDuration}s`);
            };

            // If metadata is already loaded (e.g., navigating back)
            if (audioElement.readyState >= 1) {
                handleMetadata();
            } else {
                 // Otherwise, wait for it
                audioElement.addEventListener('loadedmetadata', handleMetadata, { once: true });
            }

        } else {
            console.log("No valid last state found.");
            updatePlayPauseButton(false);
            currentTimeDisplay.textContent = '0:00';
            totalDurationDisplay.textContent = '--:--';
            seekBar.value = 0;
            seekBar.max = 0; // Ensure seek bar is reset
        }
    }

}); 