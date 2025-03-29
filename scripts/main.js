document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const audioElement = document.getElementById('audio-element');
    const trackListElement = document.getElementById('track-list');
    const trackTitleElement = document.getElementById('track-title');
    const trackDescriptionElement = document.getElementById('track-description');
    const playPauseButton = document.getElementById('play-pause-button');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const totalDurationDisplay = document.getElementById('total-duration');
    const feedSelect = document.getElementById('feed-select'); // New feed selector
    const speedControlsContainer = document.querySelector('.speed-controls');
    const speedButtons = document.querySelectorAll('.speed-button'); // Get all speed buttons

    // --- State Variables ---
    let allFeeds = []; // Holds the entire data structure {feeds: [...]} -> just the array
    let currentFeedId = null;
    let currentTracks = []; // Tracks of the currently selected feed
    let currentTrackId = null;
    let currentTrackDuration = 0;
    let isSeeking = false;

    // --- Helper Function ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- Initialization ---
    fetch('data/feed.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.feeds || !Array.isArray(data.feeds)) {
                throw new Error('Invalid feed structure: Missing top-level "feeds" array.');
            }
            allFeeds = data.feeds;
            populateFeedSelector(allFeeds);
            // Load last state (which includes selecting the last feed)
            loadLastState();
        })
        .catch(error => {
            console.error('Error fetching or parsing feed:', error);
            trackListElement.innerHTML = '<li>Error loading tracks.</li>';
            feedSelect.innerHTML = '<option value="">Error loading feeds</option>';
        });

    // --- Feed Handling ---
    function populateFeedSelector(feeds) {
        feedSelect.innerHTML = ''; // Clear loading message
        feeds.forEach(feed => {
            const option = document.createElement('option');
            option.value = feed.id;
            option.textContent = feed.title;
            feedSelect.appendChild(option);
        });
        feedSelect.addEventListener('change', handleFeedChange);
    }

    function handleFeedChange() {
        const selectedFeedId = feedSelect.value;
        switchFeed(selectedFeedId);
        localStorage.setItem('last_played_feed_id', selectedFeedId); // Save selected feed
    }

    function switchFeed(feedId) {
        const selectedFeed = allFeeds.find(f => f.id === feedId);
        if (!selectedFeed) {
            console.error('Selected feed not found:', feedId);
            currentTracks = [];
            populateTrackList(currentTracks);
            resetPlayerUI(); // Reset controls and info
            return;
        }

        currentFeedId = feedId;
        currentTracks = selectedFeed.tracks || []; // Ensure tracks is an array
        populateTrackList(currentTracks);

        // Reset player state when switching feeds
        resetPlayerUI();
        audioElement.pause();
        audioElement.removeAttribute('src'); // Remove source
        currentTrackId = null;
        
        // Optional: Load first track automatically?
        // if (currentTracks.length > 0) {
        //     loadTrack(currentTracks[0].id, false); // Load without playing
        // }
    }

    function populateTrackList(trackData) {
        trackListElement.innerHTML = ''; // Clear previous list
        if (!trackData || trackData.length === 0) {
             trackListElement.innerHTML = '<li>No tracks found in this feed.</li>';
             return;
        }
        trackData.forEach((track) => {
            const li = document.createElement('li');
            li.dataset.trackId = track.id;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = track.title;

            const progressSpan = document.createElement('span');
            progressSpan.className = 'track-progress';
            // Try to get saved progress for this specific track
            const savedTime = parseFloat(localStorage.getItem(getLocalStorageKey('pos', track.id)) || 0);
            const initialDuration = track.duration ? formatTime(track.duration) : '--:--'; // Duration from JSON if available
            const initialCurrentTime = formatTime(savedTime);
            progressSpan.textContent = ` (${initialCurrentTime} / ${initialDuration})`;
            progressSpan.dataset.trackId = track.id;

            li.appendChild(titleSpan);
            li.appendChild(progressSpan);

            li.addEventListener('click', () => {
                playTrack(track.id, true); // Play on click
            });
            trackListElement.appendChild(li);
        });
    }

    // --- Playback Logic ---
    // Combined load/play function
    function playTrack(trackId, shouldPlay = true) {
        const track = currentTracks.find(t => t.id === trackId);
        if (!track) {
            console.error('Track not found in current feed:', trackId);
            return;
        }

        const isNewTrack = currentTrackId !== trackId;
        if (isNewTrack) {
             resetPreviousTrackProgress(); // Reset old one before setting new ID
             currentTrackId = track.id;
             audioElement.src = track.audioUrl;
             trackTitleElement.textContent = track.title;
             trackDescriptionElement.textContent = track.description || '';
             updatePlayingClass(trackId);

             // Apply saved playback speed
             const savedSpeed = parseFloat(localStorage.getItem('last_playback_speed') || 1.0);
             audioElement.playbackRate = savedSpeed;
             updateSpeedButtonActiveState(savedSpeed);

             // Load saved position or default to 0
             const savedTime = localStorage.getItem(getLocalStorageKey('pos', track.id));
             audioElement.currentTime = savedTime ? parseFloat(savedTime) : 0;

             // Reset seek bar and time displays for the new track
             seekBar.value = audioElement.currentTime;
             currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
             totalDurationDisplay.textContent = '--:--'; // Will be updated on loadedmetadata

             localStorage.setItem(getLocalStorageKey('track_id'), track.id);
        }

        // Play if requested and necessary
        if (shouldPlay && (audioElement.paused || isNewTrack)) {
             const playPromise = audioElement.play();
             if (playPromise !== undefined) {
                 playPromise.then(_ => updatePlayPauseButton(true))
                          .catch(error => {
                              console.error("Playback error:", error);
                              updatePlayPauseButton(false);
                          });
             }
        } else if (!shouldPlay) {
             // If just loading, ensure button reflects paused state
             updatePlayPauseButton(false);
        }
    }

    function togglePlayPause() {
        if (!currentTrackId) {
            if(currentTracks.length > 0) {
                playTrack(currentTracks[0].id, true); // Play first track of current feed
            }
            return;
        }

        if (audioElement.paused || audioElement.ended) {
            audioElement.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing:", e));
        } else {
            audioElement.pause();
            // No need to call updatePlayPauseButton(false) here, handled by 'pause' event
        }
    }

    function updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            playPauseButton.textContent = '⏸️';
            playPauseButton.setAttribute('aria-label', 'Pause');
        } else {
            playPauseButton.textContent = '▶️';
            playPauseButton.setAttribute('aria-label', 'Play');
        }
    }

    function updatePlayingClass(playingTrackId) {
        const items = trackListElement.querySelectorAll('li');
        items.forEach(item => {
            const trackId = item.dataset.trackId;
            if (trackId === playingTrackId) {
                item.classList.add('playing');
            } else {
                item.classList.remove('playing');
            }
        });
    }

     function resetPlayerUI() {
         updatePlayPauseButton(false);
         trackTitleElement.textContent = 'No track selected';
         trackDescriptionElement.textContent = '';
         currentTimeDisplay.textContent = '0:00';
         totalDurationDisplay.textContent = '--:--';
         seekBar.value = 0;
         seekBar.max = 0;
         seekBar.style.setProperty('--seek-before-percent', '0%');
         updatePlayingClass(null);
     }

    // --- Progress & State Update ---
    function getProgressSpan(trackId) {
        return trackListElement.querySelector(`li[data-track-id="${trackId}"] span.track-progress`);
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
        if (currentTrackId) {
             const track = currentTracks.find(t => t.id === currentTrackId);
             const savedTime = parseFloat(localStorage.getItem(getLocalStorageKey('pos', currentTrackId)) || 0);
             const duration = currentTrackDuration || track?.duration || 0; // Use known duration if possible
             updateProgressDisplay(currentTrackId, savedTime, duration);
        }
    }

    // --- Playback Speed Handling ---
    function updateSpeedButtonActiveState(activeSpeed) {
        speedButtons.forEach(button => {
            const buttonSpeed = parseFloat(button.dataset.speed);
            if (buttonSpeed === activeSpeed) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    speedControlsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('speed-button')) {
            const newSpeed = parseFloat(event.target.dataset.speed);
            audioElement.playbackRate = newSpeed;
            localStorage.setItem('last_playback_speed', newSpeed); // Save selected speed
            updateSpeedButtonActiveState(newSpeed);
        }
    });

    // --- Event Listeners ---
    // Audio Element
    audioElement.addEventListener('loadedmetadata', () => {
        currentTrackDuration = audioElement.duration;
        seekBar.max = currentTrackDuration;
        totalDurationDisplay.textContent = formatTime(currentTrackDuration);
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, audioElement.currentTime, currentTrackDuration);
            // Update seek bar fill based on initial time
            const percentage = currentTrackDuration > 0 ? (audioElement.currentTime / currentTrackDuration) * 100 : 0;
            seekBar.style.setProperty('--seek-before-percent', `${percentage}%`);
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (!isSeeking && currentTrackId) {
            const currentTime = audioElement.currentTime;
            const duration = currentTrackDuration || audioElement.duration;
            seekBar.value = currentTime;
            currentTimeDisplay.textContent = formatTime(currentTime);
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), currentTime.toString());
            localStorage.setItem(getLocalStorageKey('track_id'), currentTrackId);
            updateProgressDisplay(currentTrackId, currentTime, duration);

            // Update seek bar fill percentage
            const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
            seekBar.style.setProperty('--seek-before-percent', `${percentage}%`);
        }
    });

    audioElement.addEventListener('play', () => updatePlayPauseButton(true));
    audioElement.addEventListener('pause', () => updatePlayPauseButton(false));
    audioElement.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        seekBar.value = 0;
        currentTimeDisplay.textContent = formatTime(0);
        seekBar.style.setProperty('--seek-before-percent', '0%'); // Reset fill
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), '0');
        }
    });

    // Custom Controls
    playPauseButton.addEventListener('click', togglePlayPause);
    seekBar.addEventListener('input', () => {
        isSeeking = true;
        currentTimeDisplay.textContent = formatTime(seekBar.value);
    });
    seekBar.addEventListener('change', () => {
        if (!currentTrackId) return; // Don't seek if no track loaded
        audioElement.currentTime = parseFloat(seekBar.value);
        isSeeking = false;
        if (audioElement.paused) {
             if (audioElement.currentTime < audioElement.duration) {
                 audioElement.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing after seek:", e));
             }
        }
    });

    // State Saving/Loading
    window.addEventListener('beforeunload', () => {
        if (currentFeedId) {
            localStorage.setItem('last_played_feed_id', currentFeedId);
             if (currentTrackId && !audioElement.paused) {
                localStorage.setItem(getLocalStorageKey('pos', currentTrackId), audioElement.currentTime.toString());
                localStorage.setItem(getLocalStorageKey('track_id'), currentTrackId);
             }
        }
    });

    // --- Local Storage Helpers ---
    function getLocalStorageKey(type, trackId = null) {
        const feedId = currentFeedId || localStorage.getItem('last_played_feed_id') || 'default'; // Use current or last known feed
        switch (type) {
            case 'feed_id': return 'last_played_feed_id';
            case 'track_id': return `last_played_track_id_${feedId}`;
            case 'pos': 
                if (!trackId) return null; // Need trackId for position
                return `audio_pos_${feedId}_${trackId}`;
            default: return null;
        }
    }

    function loadLastState() {
        const lastFeedId = localStorage.getItem('last_played_feed_id') || (allFeeds.length > 0 ? allFeeds[0].id : null);
        let successfullyLoadedFeed = false;
    
        if (lastFeedId && allFeeds.some(f => f.id === lastFeedId)) {
            feedSelect.value = lastFeedId;
            switchFeed(lastFeedId); // Populates currentTracks and sets currentFeedId
            successfullyLoadedFeed = true;
        } else if (allFeeds.length > 0) {
            // Default to the first feed if last one was invalid or not found
            feedSelect.value = allFeeds[0].id;
            switchFeed(allFeeds[0].id);
            successfullyLoadedFeed = true;
            console.log("Defaulting to first feed.");
        } else {
            console.log("No feeds available to load state from.");
            resetPlayerUI();
            return; // Exit if no feeds
        }
    
        // --- Apply Speed and Load Track (only if a feed was successfully loaded) ---
        if (successfullyLoadedFeed) {
            // Apply last saved speed
            const lastSpeed = parseFloat(localStorage.getItem('last_playback_speed') || 1.0);
            audioElement.playbackRate = lastSpeed;
            updateSpeedButtonActiveState(lastSpeed);
    
            // Try to load the last played track WITHIN the loaded feed
            // getLocalStorageKey now correctly uses currentFeedId set by switchFeed
            const lastTrackId = localStorage.getItem(getLocalStorageKey('track_id')); 
            const trackToLoad = lastTrackId ? currentTracks.find(t => t.id === lastTrackId) : null;
    
            if (trackToLoad) {
                console.log(`Loading last track state: ${lastTrackId} from feed ${currentFeedId}`);
                playTrack(lastTrackId, false); // Use existing function to load state without playing
            } else {
                console.log(`No specific last track saved or found for feed ${currentFeedId}.`);
                // No need to call resetPlayerUI() again, switchFeed already handled the reset initially.
            }
        }
    }

}); 