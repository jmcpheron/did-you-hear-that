document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const CUSTOM_FEEDS_LS_KEY = 'custom_feed_urls';
    const DEFAULT_FEED_PATH = 'data/feed.json';
    
    // Fallback feed data for when fetch fails
    const FALLBACK_FEED_DATA = {
        "feeds": [
            {
                "id": "default",
                "title": "Default Feed",
                "tracks": [
                    {
                        "id": "track1",
                        "title": "Test Beep Sound",
                        "description": "A short beep sound effect from SoundJay.",
                        "audioUrl": "https://www.soundjay.com/buttons/beep-07a.mp3"
                    },
                    {
                        "id": "track2",
                        "title": "T-Rex Roar Sample",
                        "description": "A T-Rex roar audio sample from MDN (CC0 license).",
                        "audioUrl": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
                        "albumArt": "https://picsum.photos/200/200?random=1"
                    }
                ]
            }
        ]
    };

    // Sample feed data embedded directly in JavaScript
    const SAMPLE_FEED_DATA = {
        "feeds": [
            {
                "id": "sample-custom",
                "title": "Sample Custom Feed",
                "tracks": [
                    {
                        "id": "sample-track-1",
                        "title": "Getting Started with Custom Feeds",
                        "description": "This is an example of how to create your own feed for this player.",
                        "audioUrl": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
                        "albumArt": "https://picsum.photos/200/200?random=1"
                    },
                    {
                        "id": "sample-track-2",
                        "title": "Another Example Track",
                        "description": "Just showing that a feed can have multiple tracks.",
                        "audioUrl": "https://www.soundjay.com/buttons/beep-07a.mp3",
                        "albumArt": "https://picsum.photos/200/200?random=2"
                    }
                ]
            }
        ]
    };

    // --- DOM Elements ---
    const audioPlayer = document.getElementById('audio-player');
    const trackList = document.getElementById('track-list');
    const currentTrackInfo = document.getElementById('current-track-info');
    const playPauseButton = document.getElementById('play-pause-button');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const feedSelect = document.getElementById('feed-select');
    const speedControlsContainer = document.querySelector('.speed-controls');
    const speedButtons = document.querySelectorAll('.speed-button');
    const feedUrl = document.getElementById('feed-url');
    const addFeedButton = document.getElementById('add-feed-button');
    const sampleFeedLink = document.getElementById('sample-feed-link');
    const customFeedsContainer = document.getElementById('custom-feeds-container');
    const customFeedsList = document.getElementById('custom-feeds-list');
    const toggleCustomFeedsBtn = document.getElementById('toggle-custom-feeds-btn');
    const defaultAlbumArt = document.getElementById('default-album-art');
    const customAlbumArt = document.getElementById('custom-album-art');
    const feedNotification = document.getElementById('feed-notification');
    const trackInfoDefaultArt = document.getElementById('track-info-default-art');
    const trackInfoCustomArt = document.getElementById('track-info-custom-art');
    const trackInfoText = document.querySelector('.track-info-text');
    const toggleFeedSectionButton = document.getElementById('toggle-feed-section');
    const feedManagementSection = document.getElementById('feed-management-section');
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('help-dialog');
    const closeHelpDialogButton = document.getElementById('close-help-dialog');

    // --- State Variables ---
    let allFeeds = [];
    let currentFeedId = null;
    let currentTracks = [];
    let currentTrackId = null;
    let currentTrackDuration = 0;
    let isSeeking = false;
    let isPlaying = false;
    let currentFeedUrl = '';
    let customFeeds = {};

    // --- Helper Function ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- Initialization ---
    initializeFeeds();

    async function initializeFeeds() {
        console.log("Initializing feeds...");
        feedSelect.innerHTML = '<option value="">Loading feeds...</option>';
        trackList.innerHTML = '<li>Loading...</li>';
        resetPlayerUI();

        let defaultFeeds = [];
        let customFeeds = [];

        // 1. Fetch Default Feed
        try {
            const response = await fetch(DEFAULT_FEED_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error fetching default feed! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.feeds || !Array.isArray(data.feeds)) {
                throw new Error('Invalid default feed structure: Missing top-level "feeds" array.');
            }
            defaultFeeds = data.feeds;
            console.log("Default feeds loaded:", defaultFeeds);
        } catch (error) {
            console.error('Error loading default feed:', error);
            console.log("Using fallback feed data instead");
            defaultFeeds = FALLBACK_FEED_DATA.feeds;
        }

        // 2. Fetch Custom Feeds
        const customFeedUrls = getCustomFeedUrls();
        console.log("Custom feed URLs found:", customFeedUrls);

        if (customFeedUrls.length > 0) {
            const feedPromises = customFeedUrls.map(url => 
                fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error fetching custom feed! status: ${response.status}, URL: ${url}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (!data.feeds || !Array.isArray(data.feeds)) {
                             throw new Error(`Invalid custom feed structure for URL: ${url}`);
                        }
                        data.feeds.forEach(feed => feed.sourceUrl = url); 
                        return { status: 'fulfilled', value: data.feeds, url: url }; 
                    })
                    .catch(error => {
                        return { status: 'rejected', reason: error, url: url };
                    })
            );

            const results = await Promise.all(feedPromises);

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    console.log(`Successfully loaded custom feed from ${result.url}:`, result.value);
                    customFeeds.push(...result.value);
                } else {
                    console.error(`Failed to load or parse custom feed from ${result.url}:`, result.reason);
                }
            });
        }

        // 3. Combine Feeds
        allFeeds = [...defaultFeeds, ...customFeeds];
        console.log("All feeds combined:", allFeeds);

        // 4. Populate UI and Load State
        if (allFeeds.length > 0) {
            populateFeedSelector(allFeeds);
            loadLastState();
        } else {
            console.error("No feeds available to display.");
            feedSelect.innerHTML = '<option value="">No feeds found</option>';
            trackList.innerHTML = '<li>No feeds available. Add one using a URL.</li>';
        }
        
        updateCustomFeedsList();
    }

    // --- Feed Handling ---
    function populateFeedSelector(feeds) {
        feedSelect.innerHTML = '';
        feeds.forEach(feed => {
            const option = document.createElement('option');
            option.value = feed.id;
            option.textContent = feed.title;
            feedSelect.appendChild(option);
        });
        
        feedSelect.removeEventListener('change', handleFeedChange);
        feedSelect.addEventListener('change', handleFeedChange);
    }

    function handleFeedChange() {
        const selectedFeedId = feedSelect.value;
        switchFeed(selectedFeedId);
        localStorage.setItem('last_played_feed_id', selectedFeedId);
    }

    function switchFeed(feedId) {
        const selectedFeed = allFeeds.find(f => f.id === feedId);
        if (!selectedFeed) {
            console.error('Selected feed not found:', feedId);
            currentTracks = [];
            populateTrackList(currentTracks);
            resetPlayerUI();
            return;
        }

        currentFeedId = feedId;
        currentTracks = selectedFeed.tracks || [];
        populateTrackList(currentTracks);

        resetPlayerUI();
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        currentTrackId = null;
    }

    function populateTrackList(trackData) {
        trackList.innerHTML = '';
        const trackCount = document.getElementById('track-count');
        
        if (!trackData || trackData.length === 0) {
             trackList.innerHTML = '<li>No tracks found in this feed.</li>';
             if (trackCount) trackCount.textContent = '(0)';
             return;
        }
        
        if (trackCount) trackCount.textContent = `(${trackData.length})`;
        
        trackData.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.trackId = track.id;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = track.title;

            const progressSpan = document.createElement('span');
            progressSpan.className = 'track-progress';
            const savedTime = parseFloat(localStorage.getItem(getLocalStorageKey('pos', track.id)) || 0);
            const initialDuration = track.duration ? formatTime(track.duration) : '--:--';
            const initialCurrentTime = formatTime(savedTime);
            progressSpan.textContent = ` (${initialCurrentTime} / ${initialDuration})`;
            progressSpan.dataset.trackId = track.id;

            li.appendChild(titleSpan);
            li.appendChild(progressSpan);

            li.addEventListener('click', () => {
                playTrack(track.id, true);
            });
            trackList.appendChild(li);
        });
    }

    // --- Playback Logic ---
    function playTrack(trackId, shouldPlay = true) {
        const track = currentTracks.find(t => t.id === trackId);
        if (!track) {
            console.error('Track not found in current feed:', trackId);
            return;
        }

        const isNewTrack = currentTrackId !== trackId;
        if (isNewTrack) {
             resetPreviousTrackProgress();
             currentTrackId = track.id;
             audioPlayer.src = track.audioUrl;
             updateTrackInfo(track);
             updatePlayingClass(trackId);
             
             updateAlbumArt(track.albumArt || null);

             const savedSpeed = parseFloat(localStorage.getItem('last_playback_speed') || 1.0);
             audioPlayer.playbackRate = savedSpeed;
             updateSpeedButtonActiveState(savedSpeed);

             const savedTime = localStorage.getItem(getLocalStorageKey('pos', track.id));
             audioPlayer.currentTime = savedTime ? parseFloat(savedTime) : 0;

             seekBar.value = audioPlayer.currentTime;
             currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
             durationDisplay.textContent = '--:--';

             localStorage.setItem(getLocalStorageKey('track_id'), track.id);
        }

        if (shouldPlay && (audioPlayer.paused || isNewTrack)) {
             const playPromise = audioPlayer.play();
             if (playPromise !== undefined) {
                 playPromise.then(_ => updatePlayPauseButton(true))
                          .catch(error => {
                              console.error("Playback error:", error);
                              updatePlayPauseButton(false);
                          });
             }
        } else if (!shouldPlay) {
             updatePlayPauseButton(false);
        }
    }

    function togglePlayPause() {
        if (!currentTrackId) {
            if(currentTracks.length > 0) {
                playTrack(currentTracks[0].id, true);
            }
            return;
        }

        if (audioPlayer.paused || audioPlayer.ended) {
            audioPlayer.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing:", e));
        } else {
            audioPlayer.pause();
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
        const items = trackList.querySelectorAll('li');
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
         if (trackInfoText) {
             trackInfoText.innerHTML = `
                 <h2>No Track Selected</h2>
                 <p>Select a track from the list below to start playing.</p>
             `;
         }
         if (trackInfoCustomArt && trackInfoDefaultArt) {
             trackInfoCustomArt.src = '';
             trackInfoCustomArt.style.display = 'none';
             trackInfoDefaultArt.style.display = 'block';
         }
         currentTimeDisplay.textContent = '0:00';
         durationDisplay.textContent = '--:--';
         seekBar.value = 0;
         seekBar.max = 0;
         seekBar.style.setProperty('--seek-before-percent', '0%');
         updatePlayingClass(null);
         updateAlbumArt(null);
     }

    // --- Album Art Handling ---
    function updateAlbumArt(imageUrl) {
        if (imageUrl) {
            customAlbumArt.src = imageUrl;
            customAlbumArt.style.display = 'block';
            defaultAlbumArt.style.display = 'none';
        } else {
            customAlbumArt.src = '';
            customAlbumArt.style.display = 'none';
            defaultAlbumArt.style.display = 'block';
        }
    }

    // --- Progress & State Update ---
    function getProgressSpan(trackId) {
        return trackList.querySelector(`li[data-track-id="${trackId}"] span.track-progress`);
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
             const duration = currentTrackDuration || track?.duration || 0;
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
            audioPlayer.playbackRate = newSpeed;
            localStorage.setItem('last_playback_speed', newSpeed);
            updateSpeedButtonActiveState(newSpeed);
        }
    });

    // --- Event Listeners ---
    audioPlayer.addEventListener('loadedmetadata', () => {
        currentTrackDuration = audioPlayer.duration;
        seekBar.max = currentTrackDuration;
        durationDisplay.textContent = formatTime(currentTrackDuration);
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, audioPlayer.currentTime, currentTrackDuration);
            const percentage = currentTrackDuration > 0 ? (audioPlayer.currentTime / currentTrackDuration) * 100 : 0;
            seekBar.style.setProperty('--seek-before-percent', `${percentage}%`);
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (!isSeeking && currentTrackId) {
            const currentTime = audioPlayer.currentTime;
            const duration = currentTrackDuration || audioPlayer.duration;
            seekBar.value = currentTime;
            currentTimeDisplay.textContent = formatTime(currentTime);
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), currentTime.toString());
            localStorage.setItem(getLocalStorageKey('track_id'), currentTrackId);
            updateProgressDisplay(currentTrackId, currentTime, duration);

            const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
            seekBar.style.setProperty('--seek-before-percent', `${percentage}%`);
        }
    });

    audioPlayer.addEventListener('play', () => updatePlayPauseButton(true));
    audioPlayer.addEventListener('pause', () => updatePlayPauseButton(false));
    audioPlayer.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        seekBar.value = 0;
        currentTimeDisplay.textContent = formatTime(0);
        seekBar.style.setProperty('--seek-before-percent', '0%');
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
        if (!currentTrackId) return;
        audioPlayer.currentTime = parseFloat(seekBar.value);
        isSeeking = false;
        if (audioPlayer.paused) {
             if (audioPlayer.currentTime < audioPlayer.duration) {
                 audioPlayer.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing after seek:", e));
             }
        }
    });

    // State Saving/Loading
    window.addEventListener('beforeunload', () => {
        if (currentFeedId) {
            localStorage.setItem('last_played_feed_id', currentFeedId);
             if (currentTrackId && !audioPlayer.paused) {
                localStorage.setItem(getLocalStorageKey('pos', currentTrackId), audioPlayer.currentTime.toString());
                localStorage.setItem(getLocalStorageKey('track_id'), currentTrackId);
             }
        }
    });

    // --- Local Storage Helpers ---
    function getLocalStorageKey(type, trackId = null) {
        const feedId = currentFeedId || localStorage.getItem('last_played_feed_id') || 'default';
        switch (type) {
            case 'feed_id': return 'last_played_feed_id';
            case 'track_id': return `last_played_track_id_${feedId}`;
            case 'pos': 
                if (!trackId) return null;
                return `audio_pos_${feedId}_${trackId}`;
            default: return null;
        }
    }

    function loadLastState() {
        const lastFeedId = localStorage.getItem('last_played_feed_id') || (allFeeds.length > 0 ? allFeeds[0].id : null);
        let successfullyLoadedFeed = false;
    
        if (lastFeedId && allFeeds.some(f => f.id === lastFeedId)) {
            feedSelect.value = lastFeedId;
            switchFeed(lastFeedId);
            successfullyLoadedFeed = true;
        } else if (allFeeds.length > 0) {
            feedSelect.value = allFeeds[0].id;
            switchFeed(allFeeds[0].id);
            successfullyLoadedFeed = true;
            console.log("Defaulting to first feed.");
        } else {
            console.log("No feeds available to load state from.");
            resetPlayerUI();
            return;
        }
    
        if (successfullyLoadedFeed) {
            const lastSpeed = parseFloat(localStorage.getItem('last_playback_speed') || 1.0);
            audioPlayer.playbackRate = lastSpeed;
            updateSpeedButtonActiveState(lastSpeed);
    
            const lastTrackId = localStorage.getItem(getLocalStorageKey('track_id')); 
            const trackToLoad = lastTrackId ? currentTracks.find(t => t.id === lastTrackId) : null;
    
            if (trackToLoad) {
                console.log(`Loading last track state: ${lastTrackId} from feed ${currentFeedId}`);
                playTrack(lastTrackId, false);
            } else {
                console.log(`No specific last track saved or found for feed ${currentFeedId}.`);
            }
        }
    }

    // --- Custom Feed Management ---
    function getCustomFeedUrls() {
        const storedUrls = localStorage.getItem(CUSTOM_FEEDS_LS_KEY);
        try {
            return storedUrls ? JSON.parse(storedUrls) : [];
        } catch (e) {
            console.error("Error parsing custom feed URLs from Local Storage:", e);
            localStorage.removeItem(CUSTOM_FEEDS_LS_KEY);
            return [];
        }
    }

    function saveCustomFeedUrls(urls) {
        if (Array.isArray(urls) && urls.every(item => typeof item === 'string')) {
            localStorage.setItem(CUSTOM_FEEDS_LS_KEY, JSON.stringify(urls));
            updateCustomFeedsList();
        } else {
            console.error("Attempted to save invalid data format for custom feed URLs.");
        }
    }
    
    function updateCustomFeedsList() {
        const customUrls = getCustomFeedUrls();
        
        if (customUrls.length > 0) {
            customFeedsContainer.style.display = 'block';
            
            customFeedsList.innerHTML = '';
            
            const feedsByUrl = {};
            
            allFeeds.forEach(feed => {
                if (feed.sourceUrl && customUrls.includes(feed.sourceUrl)) {
                    if (!feedsByUrl[feed.sourceUrl]) {
                        feedsByUrl[feed.sourceUrl] = [];
                    }
                    feedsByUrl[feed.sourceUrl].push(feed);
                }
            });
            
            customUrls.forEach(url => {
                const li = document.createElement('li');
                const feedsFromThisUrl = feedsByUrl[url] || [];
                
                const feedInfo = document.createElement('div');
                feedInfo.className = 'feed-info';
                
                const titleElement = document.createElement('div');
                titleElement.className = 'feed-title';
                
                if (feedsFromThisUrl.length > 0) {
                    titleElement.textContent = feedsFromThisUrl
                        .map(feed => feed.title)
                        .join(', ');
                } else {
                    titleElement.textContent = 'Custom Feed';
                }
                
                const urlElement = document.createElement('div');
                urlElement.className = 'feed-url';
                urlElement.textContent = url;
                
                feedInfo.appendChild(titleElement);
                feedInfo.appendChild(urlElement);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.setAttribute('aria-label', 'Delete feed');
                deleteBtn.dataset.url = url;
                deleteBtn.addEventListener('click', handleDeleteFeed);
                
                li.appendChild(feedInfo);
                li.appendChild(deleteBtn);
                customFeedsList.appendChild(li);
            });
        } else {
            customFeedsContainer.style.display = 'none';
            customFeedsList.innerHTML = '<li class="empty-message">No custom feeds added yet.</li>';
        }
    }
    
    async function handleDeleteFeed(event) {
        const urlToDelete = event.currentTarget.dataset.url;
        
        if (!urlToDelete) return;
        
        if (!confirm(`Are you sure you want to delete this feed?\n\n${urlToDelete}`)) {
            return;
        }
        
        const currentUrls = getCustomFeedUrls();
        const newUrls = currentUrls.filter(url => url !== urlToDelete);
        
        saveCustomFeedUrls(newUrls);
        
        const feedsToRemove = allFeeds.filter(feed => feed.sourceUrl === urlToDelete);
        const feedIdsToRemove = feedsToRemove.map(feed => feed.id);
        
        const isCurrentFeedRemoved = feedIdsToRemove.includes(currentFeedId);
        
        allFeeds = allFeeds.filter(feed => feed.sourceUrl !== urlToDelete);
        
        populateFeedSelector(allFeeds);
        
        showFeedNotification('Custom feed deleted successfully.', 'success');
        
        if (isCurrentFeedRemoved && allFeeds.length > 0) {
            feedSelect.value = allFeeds[0].id;
            handleFeedChange();
        }
        
        updateCustomFeedsList();
    }
    
    toggleCustomFeedsBtn.addEventListener('click', () => {
        const isExpanded = toggleCustomFeedsBtn.getAttribute('aria-expanded') === 'true';
        toggleCustomFeedsBtn.setAttribute('aria-expanded', !isExpanded);
        customFeedsList.classList.toggle('hidden');
    });

    function showFeedNotification(message, type = 'error') {
        feedNotification.textContent = message;
        feedNotification.className = type;
        feedNotification.style.display = 'block';

        setTimeout(() => {
            feedNotification.style.display = 'none';
            feedNotification.textContent = '';
            feedNotification.className = '';
        }, 5000);
    }

    async function handleAddFeed() {
        feedNotification.style.display = 'none';

        const url = feedUrl.value.trim();
        if (!url) {
            showFeedNotification("Please enter a feed URL.", 'error');
            return;
        }

        try {
            new URL(url);
        } catch (_) {
            showFeedNotification("Invalid URL format.", 'error');
            return;
        }

        const currentUrls = getCustomFeedUrls();
        if (currentUrls.includes(url)) {
            showFeedNotification("This feed URL has already been added.", 'error');
            return;
        }

        addFeedButton.disabled = true;
        addFeedButton.textContent = 'Checking...';
        let feedData = null;
        let errorDetail = '';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
            const data = await response.json();
            if (!data.feeds || !Array.isArray(data.feeds) || data.feeds.length === 0) {
                throw new Error("Invalid feed structure (missing or empty 'feeds' array)");
            }
            const firstFeed = data.feeds[0];
            if (!firstFeed.id || !firstFeed.title || !firstFeed.tracks) {
                 throw new Error("Invalid feed structure (feed missing id, title, or tracks)");
            }
            if (firstFeed.tracks.length > 0) {
                 const firstTrack = firstFeed.tracks[0];
                 if (!firstTrack.id || !firstTrack.title || !firstTrack.audioUrl) {
                     throw new Error("Invalid feed structure (track missing id, title, or audioUrl)");
                 }
            }
            feedData = data;
        } catch (error) {
            console.error("Error validating feed URL:", error);
            errorDetail = error.message;
        }
        addFeedButton.disabled = false;
        addFeedButton.textContent = 'Add Feed';

        if (!feedData) {
            showFeedNotification(`Failed to load or validate feed: ${errorDetail}. Check URL and format.`, 'error');
            return;
        }

        let addedFeedId = null;
        let feedAddedCount = 0;

        feedData.feeds.forEach(newFeed => {
            if (allFeeds.some(existingFeed => existingFeed.id === newFeed.id)) {
                console.warn(`Skipping feed with duplicate ID '${newFeed.id}' from URL ${url}`);
            } else {
                newFeed.sourceUrl = url;
                allFeeds.push(newFeed);
                
                const option = document.createElement('option');
                option.value = newFeed.id;
                option.textContent = newFeed.title;
                feedSelect.appendChild(option);
                
                addedFeedId = newFeed.id;
                feedAddedCount++;
                console.log(`Added new feed: ${newFeed.title} (ID: ${newFeed.id})`);
            }
        });

        if (feedAddedCount > 0) {
             const newUrls = [...currentUrls, url];
             saveCustomFeedUrls(newUrls);
             feedUrl.value = '';
             showFeedNotification(`${feedAddedCount} feed(s) added successfully!`, 'success');

             if (addedFeedId) {
                 feedSelect.value = addedFeedId;
                 handleFeedChange();
             }
        } else {
             showFeedNotification("No new feeds added (all IDs already exist).", 'error');
        }
    }

    addFeedButton.addEventListener('click', handleAddFeed);
    
    sampleFeedLink.addEventListener('click', () => {
        // Check if the sample feed is already added
        const existingSampleFeed = allFeeds.find(feed => feed.id === 'sample-custom');
        
        if (existingSampleFeed) {
            // If it already exists, just switch to it
            feedSelect.value = 'sample-custom';
            handleFeedChange();
            showFeedNotification('Switched to sample feed!', 'success');
        } else {
            // Otherwise, add the sample feed directly without fetching an external file
            const newFeeds = SAMPLE_FEED_DATA.feeds;
            
            let addedCount = 0;
            
            newFeeds.forEach(newFeed => {
                if (allFeeds.some(existingFeed => existingFeed.id === newFeed.id)) {
                    console.warn(`Sample feed with ID '${newFeed.id}' already exists.`);
                } else {
                    // Set a source URL just for identification purposes
                    newFeed.sourceUrl = 'embedded-sample-feed';
                    allFeeds.push(newFeed);
                    
                    const option = document.createElement('option');
                    option.value = newFeed.id;
                    option.textContent = newFeed.title;
                    feedSelect.appendChild(option);
                    
                    addedCount++;
                }
            });
            
            if (addedCount > 0) {
                // Save this source URL in local storage for persistence
                const currentUrls = getCustomFeedUrls();
                if (!currentUrls.includes('embedded-sample-feed')) {
                    const newUrls = [...currentUrls, 'embedded-sample-feed'];
                    saveCustomFeedUrls(newUrls);
                }
                
                // Switch to the sample feed
                feedSelect.value = 'sample-custom';
                handleFeedChange();
                showFeedNotification('Sample feed added successfully!', 'success');
            } else {
                showFeedNotification('Sample feed already exists.', 'info');
            }
        }
    });

    // --- Collapsible Feed Management Section ---
    toggleFeedSectionButton.addEventListener('click', () => {
        const isExpanded = toggleFeedSectionButton.getAttribute('aria-expanded') === 'true';
        toggleFeedSectionButton.setAttribute('aria-expanded', !isExpanded);
        
        if (isExpanded) {
            // Hide the section
            feedManagementSection.classList.add('hidden');
        } else {
            // Show the section
            feedManagementSection.classList.remove('hidden');
        }
    });

    // --- Help Dialog ---
    helpButton.addEventListener('click', () => {
        helpDialog.classList.remove('hidden');
    });

    closeHelpDialogButton.addEventListener('click', () => {
        helpDialog.classList.add('hidden');
    });

    // Close dialog when clicking outside the content
    helpDialog.addEventListener('click', (event) => {
        if (event.target === helpDialog) {
            helpDialog.classList.add('hidden');
        }
    });

    // Close dialog with ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !helpDialog.classList.contains('hidden')) {
            helpDialog.classList.add('hidden');
        }
    });

    // --- Update Track Info (modified to include small art) ---
    function updateTrackInfo(track) {
        // Update text content
        if (trackInfoText) {
            trackInfoText.innerHTML = `
                <h2>${track.title || 'Unknown Track'}</h2>
                <p>${track.description || 'No description available'}</p>
            `;
        }
        
        // Update small album art in track info
        const imageUrl = track.albumArt || null;
        if (trackInfoCustomArt && trackInfoDefaultArt) {
            if (imageUrl) {
                trackInfoCustomArt.src = imageUrl;
                trackInfoCustomArt.style.display = 'block';
                trackInfoDefaultArt.style.display = 'none';
            } else {
                trackInfoCustomArt.src = '';
                trackInfoCustomArt.style.display = 'none';
                trackInfoDefaultArt.style.display = 'block';
            }
        }
    }
}); 