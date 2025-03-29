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
         updatePlayingClass(null); // Clear highlight
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

    // --- Event Listeners ---
    // Audio Element
    audioElement.addEventListener('loadedmetadata', () => {
        currentTrackDuration = audioElement.duration;
        seekBar.max = currentTrackDuration;
        totalDurationDisplay.textContent = formatTime(currentTrackDuration);
        if (currentTrackId) {
            // Update list item progress too, ensuring duration is shown
            updateProgressDisplay(currentTrackId, audioElement.currentTime, currentTrackDuration);
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (!isSeeking && currentTrackId) {
            const currentTime = audioElement.currentTime;
            seekBar.value = currentTime;
            currentTimeDisplay.textContent = formatTime(currentTime);
            // Save feed-specific progress
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), currentTime.toString());
            localStorage.setItem(getLocalStorageKey('track_id'), currentTrackId); // Save last track within feed
            updateProgressDisplay(currentTrackId, currentTime, currentTrackDuration || audioElement.duration);
        }
    });

    audioElement.addEventListener('play', () => updatePlayPauseButton(true));
    audioElement.addEventListener('pause', () => updatePlayPauseButton(false));
    audioElement.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        seekBar.value = 0;
        currentTimeDisplay.textContent = formatTime(0);
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), '0');
        }
        // Add logic here for auto-play next track if desired
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
        const lastFeedId = localStorage.getItem(getLocalStorageKey('feed_id')) || (allFeeds.length > 0 ? allFeeds[0].id : null);
        
        if (lastFeedId && allFeeds.some(f => f.id === lastFeedId)) {
            // Set the dropdown value and trigger the feed switch logic
            feedSelect.value = lastFeedId;
            switchFeed(lastFeedId); // This populates currentTracks

            // Now try to load the last played track WITHIN that feed
            const lastTrackIdInFeed = localStorage.getItem(getLocalStorageKey('track_id'));
            if (lastTrackIdInFeed && currentTracks.some(t => t.id === lastTrackIdInFeed)) {
                // Load the track details but don't auto-play
                const track = currentTracks.find(t => t.id === lastTrackIdInFeed);
                const savedTime = localStorage.getItem(getLocalStorageKey('pos', lastTrackIdInFeed));
                const numericTime = savedTime ? parseFloat(savedTime) : 0;

                currentTrackId = lastTrackIdInFeed; // Set current track ID
                trackTitleElement.textContent = track.title;
                trackDescriptionElement.textContent = track.description || '';
                updatePlayingClass(lastTrackIdInFeed);
                updatePlayPauseButton(false); // Start paused
                currentTimeDisplay.textContent = formatTime(numericTime);

                // Set src to allow metadata loading
                audioElement.src = track.audioUrl;
                
                const handleMetadata = () => {
                    currentTrackDuration = audioElement.duration;
                    seekBar.max = currentTrackDuration;
                    seekBar.value = numericTime;
                    totalDurationDisplay.textContent = formatTime(currentTrackDuration);
                    // Set time AGAIN after metadata ensures it sticks
                    audioElement.currentTime = numericTime;
                    updateProgressDisplay(lastTrackIdInFeed, numericTime, currentTrackDuration);
                    console.log(`Loaded last state: Feed ${lastFeedId}, Track ${lastTrackIdInFeed} at ${numericTime}s`);
                };

                 if (audioElement.readyState >= 1) {
                     handleMetadata();
                 } else {
                     audioElement.addEventListener('loadedmetadata', handleMetadata, { once: true });
                 }

            } else {
                 console.log(`No last played track found for feed ${lastFeedId}.`);
                 resetPlayerUI(); // Reset if no specific track saved
            }
        } else {
            console.log("No valid last feed found or feeds not loaded.");
            if (allFeeds.length > 0) {
                // Default to the first feed if no state saved
                feedSelect.value = allFeeds[0].id;
                 switchFeed(allFeeds[0].id);
            }
             resetPlayerUI();
        }
    }

}); 