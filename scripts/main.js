document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const CUSTOM_FEEDS_LS_KEY = 'custom_feed_urls';
    const DEFAULT_FEED_PATH = 'data/feed.json';
    
    // Global error handler for media elements
    window.addEventListener('error', function(e) {
        // Check if it's a media element error
        if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') {
            console.error('Media element error:', e);
            
            // For video elements, show error message
            if (e.target.tagName === 'VIDEO' && isCurrentTrackVideo) {
                const track = currentTracks.find(t => t.id === currentTrackId);
                if (track) {
                    handleVideoError({name: 'MediaError', message: 'Media error occurred'}, track.audioUrl);
                }
            }
            
            // Prevent default browser error handling
            e.preventDefault();
        }
    }, true);  // Use capture phase
    
    // Fallback for browsers that don't support specific media formats
    function setupMediaFallbacks() {
        const video = document.createElement('video');
        
        // Store browser capabilities for reference
        window.mediaSupport = {
            mp4: video.canPlayType('video/mp4'),
            webm: video.canPlayType('video/webm'),
            ogg: video.canPlayType('video/ogg'),
            h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
            vp8: video.canPlayType('video/webm; codecs="vp8"'),
            vp9: video.canPlayType('video/webm; codecs="vp9"')
        };
        
        console.log('Browser media format support:', window.mediaSupport);
        
        // Add polyfills for older browsers if needed
        if (!Element.prototype.requestFullscreen && Element.prototype.webkitRequestFullscreen) {
            Element.prototype.requestFullscreen = Element.prototype.webkitRequestFullscreen;
        }
    }
    
    // Run media fallback setup
    setupMediaFallbacks();
    
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
    const videoArtDisplay = document.getElementById('video-art-display');
    const trackList = document.getElementById('track-list');
    const currentTrackInfo = document.getElementById('current-track-info');
    const playPauseButton = document.getElementById('play-pause-button');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const speedControlsContainer = document.querySelector('.speed-controls');
    const speedButtons = document.querySelectorAll('.speed-button');
    const addFeedForm = document.getElementById('add-feed-form');
    const feedUrl = document.getElementById('feed-url');
    const addFeedButton = document.getElementById('add-feed-button');
    const sampleFeedLink = document.getElementById('sample-feed-link');
    const customFeedsContainer = document.getElementById('custom-feeds-container');
    const customFeedsList = document.getElementById('custom-feeds-list');
    const defaultAlbumArt = document.getElementById('default-album-art');
    const customAlbumArt = document.getElementById('custom-album-art');
    const trackInfoDefaultArt = document.getElementById('track-info-default-art');
    const trackInfoCustomArt = document.getElementById('track-info-custom-art');
    const trackInfoText = document.getElementById('track-info-text');
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('help-dialog');
    const closeHelpDialogButton = document.getElementById('close-help-dialog');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const feedSelectorCustom = document.getElementById('feed-selector-custom');
    const currentFeedButton = document.getElementById('current-feed-button');
    const currentFeedName = document.getElementById('current-feed-name');
    const feedOptionsList = document.getElementById('feed-options-list');
    const trackCount = document.getElementById('track-count');
    
    // Collapsible Settings Section elements
    const settingsSection = document.getElementById('settings-section');
    const toggleSettingsButton = document.getElementById('toggle-settings-button');
    const notificationArea = document.getElementById('notification-area');
    
    // Playlist Switcher elements
    const playlistSwitcher = document.getElementById('playlist-switcher');
    const playlistButtons = document.querySelector('.playlist-buttons');
    
    // Playlist toggle functionality
    const togglePlaylistsButton = document.getElementById('toggle-playlists-button');
    const playlistButtonsContainer = document.getElementById('playlist-buttons-container');

    // --- Initial safety check for album art ---
    // This ensures album art is in a correct state right from the start
    function initializeAlbumArt() {
        console.log('Initializing album art...');
        
        // Hide custom art and show default if no source is set
        if (customAlbumArt) {
            if (!customAlbumArt.src || customAlbumArt.src === window.location.href) {
                customAlbumArt.style.display = 'none';
                if (defaultAlbumArt) defaultAlbumArt.style.display = 'block';
                console.log('Initial state: Using default album art (no custom src)');
            }
            
            // Ensure album art container has correct z-index
            const albumArtContainer = document.getElementById('album-art');
            if (albumArtContainer) {
                albumArtContainer.style.zIndex = '1';
            }
        }
        
        // Same for track info art
        if (trackInfoCustomArt) {
            if (!trackInfoCustomArt.src || trackInfoCustomArt.src === window.location.href) {
                trackInfoCustomArt.style.display = 'none';
                if (trackInfoDefaultArt) trackInfoDefaultArt.style.display = 'block';
            }
        }
        
        // Ensure controls have higher z-index than album art
        const playerControls = document.getElementById('player-controls');
        if (playerControls) {
            playerControls.style.zIndex = '5';
        }
        
        const trackInfo = document.getElementById('current-track-info');
        if (trackInfo) {
            trackInfo.style.zIndex = '5';
        }
    }
    
    // Run the safety check right away
    initializeAlbumArt();

    // --- State Variables ---
    let allFeeds = [];
    let currentFeedId = null;
    let currentTracks = [];
    let currentTrackId = null;
    let isCurrentTrackVideo = false;
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

    // Check if a URL is a video based on extension or content type
    function isVideoUrl(url) {
        if (!url) return false;
        const lowercaseUrl = url.toLowerCase();
        
        // Check for common video file extensions
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.m4v'];
        if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
            return true;
        }
        
        // If URL contains query parameters, we need to check more carefully
        if (lowercaseUrl.includes('?') || lowercaseUrl.includes('#')) {
            const urlWithoutParams = lowercaseUrl.split(/[?#]/)[0];
            return videoExtensions.some(ext => urlWithoutParams.endsWith(ext));
        }
        
        return false;
    }
    
    // Check if the browser supports a specific video format
    function isVideoFormatSupported(format) {
        const video = document.createElement('video');
        
        // Check for basic video support first
        if (!video.canPlayType) {
            return false;
        }
        
        // Common MIME types for different formats
        const mimeTypes = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'ogg': 'video/ogg',
            'mov': 'video/quicktime',
            'm4v': 'video/mp4'
        };
        
        const mimeType = mimeTypes[format.toLowerCase()];
        if (!mimeType) return false;
        
        // Check if the browser can play this type (returns "", "maybe" or "probably")
        return video.canPlayType(mimeType) !== "";
    }
    
    // Extract file format from URL
    function getVideoFormat(url) {
        if (!url) return null;
        
        // Handle URLs with query parameters
        let cleanUrl = url.split(/[?#]/)[0];
        
        // Get the extension
        const extension = cleanUrl.split('.').pop().toLowerCase();
        return extension || null;
    }
    
    // Handle video errors with better reporting
    function handleVideoError(error, videoUrl) {
        console.error("Video playback error:", error);
        
        let errorMessage = "Video playback error";
        const format = getVideoFormat(videoUrl);
        
        // Check if it's a format support issue
        if (format && !isVideoFormatSupported(format)) {
            errorMessage = `Your browser doesn't support ${format.toUpperCase()} video format`;
        } 
        // Check for network/CORS issues
        else if (error && error.name === "MediaError") {
            switch(error.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorMessage = "Video playback aborted";
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorMessage = "Network error while loading video";
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorMessage = "Video decoding error";
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorMessage = "Video format not supported or CORS error";
                    break;
            }
        }
        
        showVideoError(errorMessage);
        return errorMessage;
    }
    
    // Display video error to user
    function showVideoError(errorMessage) {
        // Show error notification
        if (notificationArea) {
            showNotification(errorMessage, 'error');
        }
        
        // Create and display error overlay on video element
        const albumArt = document.getElementById('album-art');
        if (albumArt) {
            // Remove any existing error overlay
            const existingOverlay = albumArt.querySelector('.video-error-overlay');
            if (existingOverlay) {
                albumArt.removeChild(existingOverlay);
            }
            
            // Create new error overlay
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'video-error-overlay';
            errorOverlay.innerHTML = `<div class="error-message">${errorMessage}</div>`;
            albumArt.appendChild(errorOverlay);
        }
    }
    
    // Clear video error display
    function clearVideoError() {
        const albumArt = document.getElementById('album-art');
        if (albumArt) {
            const errorOverlay = albumArt.querySelector('.video-error-overlay');
            if (errorOverlay) {
                albumArt.removeChild(errorOverlay);
            }
        }
    }
    
    // Optimize video display based on aspect ratio
    function optimizeVideoDisplay(video) {
        if (!video || video.videoWidth === 0) return;
        
        // Get the video's aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const container = document.getElementById('album-art');
        
        if (container) {
            // Apply appropriate object-fit based on aspect ratio
            if (videoAspect > 1.3) { // Widescreen videos
                video.style.objectFit = 'contain';
                container.classList.add('widescreen-video');
            } else { // More square or vertical videos
                video.style.objectFit = 'cover';
                container.classList.remove('widescreen-video');
            }
        }
    }

    // Function to reload feeds
    async function reloadFeeds() {
        console.log("Reloading feeds...");
        reloadFeedsButton.disabled = true;
        reloadFeedsButton.style.opacity = 0.5;
        
        try {
            // Save current state - what track and feed were playing
            const lastTrackId = currentTrackId;
            const wasPlaying = !audioPlayer.paused;
            const currentTime = audioPlayer.currentTime;
            
            // Reset state temporarily to show reload in progress
            currentFeedName.textContent = "Reloading feeds...";
            
            // Clear existing feed data
            allFeeds = [];
            
            // Re-initialize with fresh data
            await initializeFeeds();
            
            // Also update the playlist switcher
            populatePlaylistSwitcher();
            
            // Restore prior state if possible
            if (lastTrackId && currentTrackId !== lastTrackId) {
                // Find if the track still exists in the reloaded feeds
                const feedWithTrack = allFeeds.find(feed => 
                    feed.tracks && feed.tracks.some(track => track.id === lastTrackId)
                );
                
                if (feedWithTrack) {
                    // Switch to the feed containing the track
                    switchFeed(feedWithTrack.id);
                    
                    // Try to restore track and position
                    try {
                        const track = feedWithTrack.tracks.find(t => t.id === lastTrackId);
                        if (track) {
                            playTrack(lastTrackId, wasPlaying);
                            
                            // Restore time position
                            if (currentTime > 0) {
                                audioPlayer.currentTime = currentTime;
                                if (isCurrentTrackVideo) {
                                    videoArtDisplay.currentTime = currentTime;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to restore previous track after reload:", e);
                    }
                }
            }
            
            showNotification("Feeds reloaded successfully", "success");
        } catch (error) {
            console.error("Error reloading feeds:", error);
            showNotification("Failed to reload feeds", "error");
        } finally {
            reloadFeedsButton.disabled = false;
            reloadFeedsButton.style.opacity = 1;
        }
    }
    
    // Show notification message with type support
    function showNotification(message, type = 'info', duration = 3000) {
        if (!notificationArea) return;
        
        notificationArea.innerHTML = '';
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationArea.appendChild(notification);
        
        // Make notification visible
        notificationArea.style.display = 'block';
        
        // Hide notification after duration
        setTimeout(() => {
            if (notificationArea.contains(notification)) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notificationArea.contains(notification)) {
                        notificationArea.removeChild(notification);
                        
                        // Hide notification area if empty
                        if (notificationArea.children.length === 0) {
                            notificationArea.style.display = 'none';
                        }
                    }
                }, 300);
            }
        }, duration);
    }

    // --- Initialization ---
    initializeFeeds();

    async function initializeFeeds() {
        console.log("Initializing feeds...");
        currentFeedName.textContent = 'Loading feeds...';
        feedOptionsList.innerHTML = '';
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
            populateCustomFeedSelector(allFeeds);
            // Add this line to populate the playlist switcher
            populatePlaylistSwitcher();
            loadLastState();
        } else {
            console.error("No feeds available to display.");
            currentFeedName.textContent = 'No feeds found';
            trackList.innerHTML = '<li>No feeds available. Add one using a URL.</li>';
        }
        
        updateCustomFeedsList();
    }

    // --- Feed Handling (using custom selector) ---
    function populateCustomFeedSelector(feeds) {
        feedOptionsList.innerHTML = '';
        feeds.forEach(feed => {
            const li = document.createElement('li');
            li.role = 'option';
            li.dataset.feedId = feed.id;
            li.textContent = feed.title;
            if (feed.id === currentFeedId) {
                li.classList.add('selected');
                li.setAttribute('aria-selected', 'true');
                currentFeedName.textContent = feed.title;
            } else {
                li.setAttribute('aria-selected', 'false');
            }
            li.addEventListener('click', () => {
                handleCustomFeedSelection(feed.id, feed.title);
            });
            feedOptionsList.appendChild(li);
        });
        if (!currentFeedId && feeds.length > 0) {
             currentFeedName.textContent = feeds[0].title;
        }
    }

    function handleCustomFeedSelection(feedId, feedTitle) {
        currentFeedName.textContent = feedTitle;
        toggleFeedOptionsList(false);
        switchFeed(feedId);
        localStorage.setItem('last_played_feed_id', feedId);
        
        // Update selected state in the list
        const items = feedOptionsList.querySelectorAll('li');
        items.forEach(item => {
            if (item.dataset.feedId === feedId) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }
    
    function toggleFeedOptionsList(show) {
        const expanded = typeof show === 'boolean' ? show : currentFeedButton.getAttribute('aria-expanded') === 'false';
        currentFeedButton.setAttribute('aria-expanded', expanded);
        feedOptionsList.classList.toggle('hidden', !expanded);
    }

    currentFeedButton.addEventListener('click', () => toggleFeedOptionsList());

    document.addEventListener('click', (event) => {
        if (!feedSelectorCustom.contains(event.target)) {
            toggleFeedOptionsList(false);
        }
    });

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
        
        // Ensure each track has feed information for metadata consistency
        currentTracks = (selectedFeed.tracks || []).map(track => ({
            ...track,
            feedId: selectedFeed.id,
            feedTitle: selectedFeed.title
        }));
        
        populateTrackList(currentTracks);

        resetPlayerUI();
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        currentTrackId = null;

        if (selectedFeed) {
             currentFeedName.textContent = selectedFeed.title;
             const items = feedOptionsList.querySelectorAll('li');
             items.forEach(item => {
                 const isSelected = item.dataset.feedId === feedId;
                 item.classList.toggle('selected', isSelected);
                 item.setAttribute('aria-selected', String(isSelected));
             });
             
             // Update playlist switcher
             const buttons = document.querySelectorAll('.playlist-button');
             buttons.forEach(button => {
                 const isSelected = button.dataset.feedId === feedId;
                 button.classList.toggle('active', isSelected);
             });
        } else {
            currentFeedName.textContent = 'Select Feed';
        }
    }

    // Add the missing populateTrackList function
    function populateTrackList(trackData) {
        trackList.innerHTML = '';
        
        if (!trackData || trackData.length === 0) {
            trackList.innerHTML = '<li>No tracks found in this feed.</li>';
            if (trackCount) trackCount.textContent = '(0)';
            return;
        }
        
        if (trackCount) trackCount.textContent = `(${trackData.length})`;
        
        trackData.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.trackId = track.id;
            
            // Also store feed information in the list item for easy access
            if (track.feedId) li.dataset.feedId = track.feedId;
            if (track.feedTitle) li.dataset.feedTitle = track.feedTitle;

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

    // --- Load Last State --- 
    function loadLastState() {
        const lastFeedId = localStorage.getItem('last_played_feed_id') || (allFeeds.length > 0 ? allFeeds[0].id : null);
        let successfullyLoadedFeed = false;
    
        if (lastFeedId && allFeeds.some(f => f.id === lastFeedId)) {
            currentFeedId = lastFeedId;
            switchFeed(lastFeedId);
            successfullyLoadedFeed = true;
        } else if (allFeeds.length > 0) {
            currentFeedId = allFeeds[0].id;
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
            videoArtDisplay.playbackRate = lastSpeed;
            updateSpeedButtonActiveState(lastSpeed);
    
            const lastTrackId = localStorage.getItem(getLocalStorageKey('track_id')); 
            const trackToLoad = lastTrackId ? currentTracks.find(t => t.id === lastTrackId) : null;
    
            if (trackToLoad) {
                console.log(`Loading last track state: ${lastTrackId} from feed ${currentFeedId}`);
                playTrack(lastTrackId, false);
            } else {
                console.log(`No specific last track saved or found for feed ${currentFeedId}.`);
                resetPlayerUI();
            }
        }
        updatePrevNextButtonStates();
    }

    // --- Update Prev/Next Button States ---
    function updatePrevNextButtonStates() {
        const canNavigate = currentTracks && currentTracks.length > 1;
        prevButton.disabled = !canNavigate;
        nextButton.disabled = !canNavigate;
    }
    
    // --- Navigate to Previous Track ---
    function playPreviousTrack() {
        if (!currentTrackId || !currentTracks || currentTracks.length <= 1) {
            return; // Can't navigate if no current track or not enough tracks
        }
        
        // Find the index of the current track
        const currentIndex = currentTracks.findIndex(track => track.id === currentTrackId);
        if (currentIndex === -1) {
            return; // Current track not found in the list
        }
        
        // Calculate the previous track index (circular navigation)
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : currentTracks.length - 1;
        
        // Play the previous track
        playTrack(currentTracks[previousIndex].id, true);
    }
    
    // --- Navigate to Next Track ---
    function playNextTrack() {
        if (!currentTrackId || !currentTracks || currentTracks.length <= 1) {
            return; // Can't navigate if no current track or not enough tracks
        }
        
        // Find the index of the current track
        const currentIndex = currentTracks.findIndex(track => track.id === currentTrackId);
        if (currentIndex === -1) {
            return; // Current track not found in the list
        }
        
        // Calculate the next track index (circular navigation)
        const nextIndex = (currentIndex + 1) % currentTracks.length;
        
        // Play the next track
        playTrack(currentTracks[nextIndex].id, true);
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
                deleteBtn.className = 'delete-feed';
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
        
        populateCustomFeedSelector(allFeeds);
        
        showFeedNotification('Custom feed deleted successfully.', 'success');
        
        if (isCurrentFeedRemoved && allFeeds.length > 0) {
            const firstFeed = allFeeds[0];
            handleCustomFeedSelection(firstFeed.id, firstFeed.title);
        } else if (allFeeds.length === 0) {
            currentFeedName.textContent = 'No feeds available';
            currentFeedId = null;
            currentTracks = [];
            populateTrackList(currentTracks);
            resetPlayerUI();
        } else if (isCurrentFeedRemoved) {
            currentFeedName.textContent = 'Select Feed';
        }
        
        updateCustomFeedsList();
    }
    
    // --- Add Feed Form Handling ---
    addFeedForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleAddFeed();
    });

    async function handleAddFeed() {
        const url = feedUrl.value.trim();
        if (!url) {
            showFeedNotification('Please enter a valid feed URL', 'error');
            return;
        }

        // Check if URL already exists
        const currentUrls = getCustomFeedUrls();
        if (currentUrls.includes(url)) {
            showFeedNotification('This feed URL is already added', 'error');
            return;
        }

        try {
            new URL(url);
        } catch (_) {
            showFeedNotification("Invalid URL format.", 'error');
            return;
        }

        addFeedButton.disabled = true;
        addFeedButton.textContent = 'Checking...';
        let feedData = null;
        let errorDetail = '';
        let feedAddedCount = 0;
        let addedFeedId = null;

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

                populateCustomFeedSelector(allFeeds);

                if (addedFeedId) {
                    handleCustomFeedSelection(addedFeedId, allFeeds.find(f => f.id === addedFeedId)?.title || 'New Feed');
                }
            } else {
                showFeedNotification("No new feeds added (all IDs already exist).", 'error');
            }
        } catch (error) {
            console.error('Error adding feed:', error);
            showFeedNotification('Failed to add feed. Check the URL and try again.', 'error');
        } finally {
            addFeedButton.disabled = false;
            addFeedButton.textContent = 'Add Feed';
        }
    }

    sampleFeedLink.addEventListener('click', () => {
        const existingSampleFeed = allFeeds.find(feed => feed.id === 'sample-custom');
        
        if (existingSampleFeed) {
            handleCustomFeedSelection('sample-custom', 'Sample Custom Feed');
            showFeedNotification('Switched to sample feed!', 'success');
        } else {
            const newFeeds = SAMPLE_FEED_DATA.feeds;
            
            let addedCount = 0;
            
            newFeeds.forEach(newFeed => {
                if (allFeeds.some(existingFeed => existingFeed.id === newFeed.id)) {
                    console.warn(`Sample feed with ID '${newFeed.id}' already exists.`);
                } else {
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
                const currentUrls = getCustomFeedUrls();
                if (!currentUrls.includes('embedded-sample-feed')) {
                    const newUrls = [...currentUrls, 'embedded-sample-feed'];
                    saveCustomFeedUrls(newUrls);
                }
                
                populateCustomFeedSelector(allFeeds);
                
                handleCustomFeedSelection('sample-custom', 'Sample Custom Feed');
                showFeedNotification('Sample feed added successfully!', 'success');
            } else {
                handleCustomFeedSelection('sample-custom', 'Sample Custom Feed');
                showFeedNotification('Switched to sample feed!', 'success');
            }
        }
    });

    // --- Help Dialog ---
    helpButton.addEventListener('click', (event) => {
        event.preventDefault();
        helpDialog.classList.remove('hidden');
    });

    closeHelpDialogButton.addEventListener('click', () => {
        helpDialog.classList.add('hidden');
    });

    // Close dialog by clicking outside content
    helpDialog.addEventListener('click', (event) => {
        if (event.target === helpDialog) {
            helpDialog.classList.add('hidden');
        }
    });

    // --- Consolidated Album Art Update Function (for static images only) ---
    function updateAlbumArtDisplay(imageUrl) {
        console.log('Updating STATIC album art with URL:', imageUrl);
        
        const hasValidImageUrl = !!imageUrl && typeof imageUrl === 'string';
        
        // Main Album Art
        if (customAlbumArt && defaultAlbumArt) {
            if (hasValidImageUrl) {
                // Set up error handling in case the image can't be loaded
                const img = new Image();
                img.onload = function() {
                    customAlbumArt.src = imageUrl;
                    customAlbumArt.style.display = 'block';
                    defaultAlbumArt.style.display = 'none';
                };
                img.onerror = function() {
                    console.warn('Error loading album art image:', imageUrl);
                    customAlbumArt.src = '';
                    customAlbumArt.style.display = 'none';
                    defaultAlbumArt.style.display = 'block';
                };
                img.src = imageUrl;
            } else {
                customAlbumArt.src = '';
                customAlbumArt.style.display = 'none';
                defaultAlbumArt.style.display = 'block';
            }
        }

        // Track Info Album Art
        if (trackInfoCustomArt && trackInfoDefaultArt) {
            if (hasValidImageUrl) {
                // Also setup error handling for track info art
                const img = new Image();
                img.onload = function() {
                    trackInfoCustomArt.src = imageUrl;
                    trackInfoCustomArt.style.display = 'block';
                    trackInfoDefaultArt.style.display = 'none';
                };
                img.onerror = function() {
                    trackInfoCustomArt.src = '';
                    trackInfoCustomArt.style.display = 'none';
                    trackInfoDefaultArt.style.display = 'block';
                };
                img.src = imageUrl;
            } else {
                trackInfoCustomArt.src = '';
                trackInfoCustomArt.style.display = 'none';
                trackInfoDefaultArt.style.display = 'block';
            }
        }
    }

    // --- Playback Logic ---
    function playTrack(trackId, shouldPlay = true) {
        const track = currentTracks.find(t => t.id === trackId);
        if (!track) {
            console.error('Track not found in current feed:', trackId);
            return;
        }

        // Ensure track has complete metadata including feed information
        const enhancedTrack = ensureTrackMetadata(track);

        const isNewTrack = currentTrackId !== trackId;
        isCurrentTrackVideo = isVideoUrl(enhancedTrack.audioUrl);
        
        if (isNewTrack) {
            resetPreviousTrackProgress();
            currentTrackId = enhancedTrack.id;
            
            // Set source for audio player regardless of type
            audioPlayer.src = enhancedTrack.audioUrl; 
            
            updateTrackInfo(enhancedTrack);
            updatePlayingClass(trackId);
            
            // Clear any previous video errors
            clearVideoError();
                       
            // Handle visual display (Video or Static Art)
            if (isCurrentTrackVideo) {
                console.log("Loading video track:", enhancedTrack.title);
                
                // Check if video format is supported by browser
                const format = getVideoFormat(enhancedTrack.audioUrl);
                if (format && !isVideoFormatSupported(format)) {
                    console.warn(`Browser may not support ${format} video format`);
                    showNotification(`Note: Your browser might have limited support for ${format.toUpperCase()} videos`, "warning");
                }
                
                videoArtDisplay.src = enhancedTrack.audioUrl;
                videoArtDisplay.style.display = 'block';
                
                // Apply video-active class to album art container
                const albumArt = document.getElementById('album-art');
                if (albumArt) {
                    albumArt.classList.add('video-active');
                }
                
                // Show video controls overlay
                const videoControls = document.getElementById('video-controls-overlay');
                if (videoControls) {
                    videoControls.style.display = 'flex';
                }
                
                // Set video to unmuted (volume controlled by audio player)
                videoArtDisplay.muted = false;
                
                // Hide static album art
                customAlbumArt.style.display = 'none';
                defaultAlbumArt.style.display = 'none';
            } else {
                console.log("Loading MP3/Audio track:", enhancedTrack.title);
                videoArtDisplay.style.display = 'none';
                videoArtDisplay.src = '';
                
                // Remove video-active class from album art container
                const albumArt = document.getElementById('album-art');
                if (albumArt) {
                    albumArt.classList.remove('video-active');
                }
                
                // Hide video controls overlay
                const videoControls = document.getElementById('video-controls-overlay');
                if (videoControls) {
                    videoControls.style.display = 'none';
                }
                
                updateAlbumArtDisplay(enhancedTrack.albumArt || null);
            }

            const savedSpeed = parseFloat(localStorage.getItem('last_playback_speed') || 1.0);
            audioPlayer.playbackRate = savedSpeed;
            videoArtDisplay.playbackRate = savedSpeed;
            updateSpeedButtonActiveState(savedSpeed);

            const savedTime = localStorage.getItem(getLocalStorageKey('pos', track.id));
            const targetTime = savedTime ? parseFloat(savedTime) : 0;
            audioPlayer.currentTime = targetTime;
            if (isCurrentTrackVideo) {
                 videoArtDisplay.currentTime = targetTime;
                 console.log(`Attempting to set initial video time to: ${targetTime}`);
            }
            
            seekBar.value = targetTime;
            currentTimeDisplay.textContent = formatTime(targetTime);
            durationDisplay.textContent = '--:--';

            localStorage.setItem(getLocalStorageKey('track_id'), track.id);
        }

        if (shouldPlay && (audioPlayer.paused || isNewTrack)) {
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    updatePlayPauseButton(true);
                    if (isCurrentTrackVideo) {
                        videoArtDisplay.play()
                            .catch(e => {
                                handleVideoError(e, enhancedTrack.audioUrl);
                                // Try to continue audio playback even if video fails
                                console.log("Continuing with audio-only playback...");
                            }); 
                    }
                })
                .catch(error => {
                    console.error("Audio playback error:", error);
                    updatePlayPauseButton(false);
                    if (isCurrentTrackVideo) {
                        videoArtDisplay.pause();
                        handleVideoError(error, enhancedTrack.audioUrl);
                    }
                });
            }
        } else if (!shouldPlay && !audioPlayer.paused) {
             audioPlayer.pause(); 
             if (isCurrentTrackVideo) {
                videoArtDisplay.pause();
             }
             updatePlayPauseButton(false);
        } else if (!shouldPlay && audioPlayer.paused) {
             updatePlayPauseButton(false);
        }
               
        updatePrevNextButtonStates();
    }

    function togglePlayPause() {
        if (!currentTrackId) {
            if(currentTracks.length > 0) {
                playTrack(currentTracks[0].id, true);
            }
            return;
        }

        if (audioPlayer.paused || audioPlayer.ended) {
            audioPlayer.play().catch(e => console.error("Error playing:", e));
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
         
         // Use consolidated function to reset static art
         updateAlbumArtDisplay(null);
         videoArtDisplay.style.display = 'none';
         videoArtDisplay.src = '';
         isCurrentTrackVideo = false;
         
         // Reset video-specific UI elements
         const albumArt = document.getElementById('album-art');
         if (albumArt) {
             albumArt.classList.remove('video-active');
         }
         
         // Hide video controls overlay
         const videoControls = document.getElementById('video-controls-overlay');
         if (videoControls) {
             videoControls.style.display = 'none';
         }

         currentTimeDisplay.textContent = '0:00';
         durationDisplay.textContent = '--:--';
         seekBar.value = 0;
         seekBar.max = 0;
         seekBar.style.setProperty('--seek-before-percent', '0%');
         updatePlayingClass(null);
     }

    // --- Update Track Info with enhanced metadata handling ---
    function updateTrackInfo(track) {
        if (trackInfoText) {
            // Ensure track has complete metadata
            const trackWithMetadata = ensureTrackMetadata(track);
            
            // Use feed title as fallback for artist
            const artistText = trackWithMetadata.artist || trackWithMetadata.feedTitle || 'Unknown Feed';
            
            trackInfoText.innerHTML = `
                <h2>${trackWithMetadata.title || 'Unknown Title'}</h2>
                <p>${artistText}</p>
            `;
        }
        // Album art update is handled by updateAlbumArtDisplay
    }
    
    // Helper function to ensure track metadata is complete
    function ensureTrackMetadata(track) {
        if (!track) return { title: 'Unknown Track' };
        
        // Create a copy to avoid modifying the original
        const enhancedTrack = { ...track };
        
        // If feed info is missing but we know the current feed, add it
        if (!enhancedTrack.feedId && currentFeedId) {
            enhancedTrack.feedId = currentFeedId;
            
            // Find feed to get its title
            const currentFeed = allFeeds.find(f => f.id === currentFeedId);
            if (currentFeed) {
                enhancedTrack.feedTitle = currentFeed.title;
            }
        }
        
        return enhancedTrack;
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

    // --- Event listeners for speed button clicks
    speedButtons.forEach(button => {
        button.addEventListener('click', function() {
            const newSpeed = parseFloat(this.dataset.speed);
            audioPlayer.playbackRate = newSpeed;
            if (isCurrentTrackVideo) {
                videoArtDisplay.playbackRate = newSpeed;
            }
            updateSpeedButtonActiveState(newSpeed);
        });
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
            
            if (isCurrentTrackVideo && Math.abs(videoArtDisplay.currentTime - currentTime) > 0.2) {
                 videoArtDisplay.currentTime = currentTime;
            }
        }
    });

    audioPlayer.addEventListener('play', () => {
        updatePlayPauseButton(true);
        if (isCurrentTrackVideo) {
            videoArtDisplay.play().catch(e => console.error("Video play sync error:", e));
        }
    });
    audioPlayer.addEventListener('pause', () => {
        updatePlayPauseButton(false);
        if (isCurrentTrackVideo) {
            videoArtDisplay.pause();
        }
    });
    audioPlayer.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        seekBar.value = 0;
        currentTimeDisplay.textContent = formatTime(0);
        seekBar.style.setProperty('--seek-before-percent', '0%');
        
        if (isCurrentTrackVideo) {
            videoArtDisplay.pause();
            videoArtDisplay.currentTime = 0; 
        }
            
        if (currentTrackId) {
            updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
            localStorage.setItem(getLocalStorageKey('pos', currentTrackId), '0');
            
            setTimeout(() => playNextTrack(), 300);
        }
    });

    // Custom Controls
    playPauseButton.addEventListener('click', togglePlayPause);
    prevButton.addEventListener('click', playPreviousTrack);
    nextButton.addEventListener('click', playNextTrack);
    
    seekBar.addEventListener('input', () => {
        isSeeking = true;
        currentTimeDisplay.textContent = formatTime(seekBar.value);
    });
    seekBar.addEventListener('change', () => {
        if (!currentTrackId) return;
        const seekTime = parseFloat(seekBar.value);
        audioPlayer.currentTime = seekTime;
        if (isCurrentTrackVideo) {
             videoArtDisplay.currentTime = seekTime;
        }
           
        isSeeking = false;
        if (audioPlayer.paused) {
             if (audioPlayer.currentTime < audioPlayer.duration) {
                 audioPlayer.play().then(() => updatePlayPauseButton(true)).catch(e => console.error("Error playing after seek:", e));
             }
        }
    });
    
    videoArtDisplay.addEventListener('timeupdate', () => {
        // Intentionally left blank for performance reasons
    });
    
    videoArtDisplay.addEventListener('loadedmetadata', () => {
        console.log(`Video metadata loaded. Duration: ${videoArtDisplay.duration}`);
        // Optimize video display based on aspect ratio
        optimizeVideoDisplay(videoArtDisplay);
    });
    
    videoArtDisplay.addEventListener('error', (e) => {
        console.error("Video element error:", e);
        if (isCurrentTrackVideo && currentTrackId) {
            const track = currentTracks.find(t => t.id === currentTrackId);
            if (track) {
                handleVideoError(e.target.error, track.audioUrl);
            }
        }
    });
    
    videoArtDisplay.addEventListener('canplay', () => {
        if (isCurrentTrackVideo) {
            console.log("Video can play now");
            clearVideoError();  // Clear any existing error messages
        }
    });
    
    // Add support for full-screen toggle on video double-click
    videoArtDisplay.addEventListener('dblclick', () => {
        if (isCurrentTrackVideo) {
            toggleFullscreen();
        }
    });
    
    // Add keyboard shortcuts for fullscreen
    document.addEventListener('keydown', (e) => {
        if (isCurrentTrackVideo && e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    // Video Controls Implementation
    const videoFullscreenBtn = document.getElementById('video-fullscreen');
    const videoControlsOverlay = document.getElementById('video-controls-overlay');
    
    if (videoFullscreenBtn) {
        videoFullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Toggle fullscreen for video
    function toggleFullscreen() {
        if (!isCurrentTrackVideo) return;
        
        if (!document.fullscreenElement) {
            if (videoArtDisplay.requestFullscreen) {
                videoArtDisplay.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else if (videoArtDisplay.webkitRequestFullscreen) { // Safari
                videoArtDisplay.webkitRequestFullscreen();
            } else if (videoArtDisplay.msRequestFullscreen) { // IE11
                videoArtDisplay.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
            }
        }
    }
    
    // Show video controls when hovering over video
    if (videoControlsOverlay) {
        let controlsTimeout;
        
        function showVideoControls() {
            if (!isCurrentTrackVideo) return;
            
            clearTimeout(controlsTimeout);
            videoControlsOverlay.classList.add('active');
        }
        
        function hideVideoControls() {
            if (!isCurrentTrackVideo) return;
            
            controlsTimeout = setTimeout(() => {
                videoControlsOverlay.classList.remove('active');
            }, 2000);
        }
        
        const albumArt = document.getElementById('album-art');
        if (albumArt) {
            albumArt.addEventListener('mouseenter', showVideoControls);
            albumArt.addEventListener('mouseleave', hideVideoControls);
        }
        
        // Keep controls visible while hovering over them
        videoControlsOverlay.addEventListener('mouseenter', showVideoControls);
        videoControlsOverlay.addEventListener('mouseleave', hideVideoControls);
    }

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

    // --- Toggle Settings Section Functionality ---
    toggleSettingsButton.addEventListener('click', () => {
        const isExpanded = toggleSettingsButton.getAttribute('aria-expanded') === 'true';
        toggleSettingsButton.setAttribute('aria-expanded', !isExpanded);
        settingsSection.classList.toggle('hidden');
        
        if (isExpanded) {
            toggleFeedOptionsList(false);
        }
    });

    // --- Clear Cache Button Functionality ---
    const clearCacheButton = document.getElementById('clear-cache-button');
    if (clearCacheButton) {
        clearCacheButton.addEventListener('click', () => {
            const confirmClear = confirm('⚠️ WARNING: This will delete ALL saved playback positions and timestamps. This action cannot be undone. Continue?');
            
            if (confirmClear) {
                // Get all localStorage keys
                const keys = Object.keys(localStorage);
                let deletedCount = 0;
                
                // Find and delete all playback position keys
                keys.forEach(key => {
                    // Delete position keys (audio_pos_*)
                    if (key.startsWith('audio_pos_')) {
                        localStorage.removeItem(key);
                        deletedCount++;
                    }
                    
                    // Delete last played track IDs
                    if (key.startsWith('last_played_track_id_')) {
                        localStorage.removeItem(key);
                        deletedCount++;
                    }
                });
                
                // Show notification
                showNotification(`Deleted ${deletedCount} saved playback position entries`, 'success');
                
                // Reset UI for current track if playing
                if (currentTrackId) {
                    // Update track progress display to 0
                    updateProgressDisplay(currentTrackId, 0, currentTrackDuration);
                }
            }
        });
    }

    // --- Handle Reload Feeds button click ---
    const reloadFeedsButton = document.getElementById('reload-feeds-button');
    if (reloadFeedsButton) {
        reloadFeedsButton.addEventListener('click', function() {
            reloadFeeds();
        });
    }
    
    // Add Feed form submission
    addFeedForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await handleAddFeed();
    });

    // --- Playlist Switcher UI ---
    function populatePlaylistSwitcher() {
        if (!playlistButtons) return;
        
        // Clear existing buttons
        playlistButtons.innerHTML = '';
        
        // Create a button for each feed
        allFeeds.forEach(feed => {
            const button = document.createElement('button');
            button.classList.add('playlist-button');
            button.dataset.feedId = feed.id;
            
            // If this is the currently active feed, mark it as active
            if (feed.id === currentFeedId) {
                button.classList.add('active');
            }
            
            // Choose icon based on feed id/content
            let iconSvg = '';
            if (feed.id === 'classic-cartoons') {
                iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 4v1h-2V4c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v1H6V4c0-.55-.45-1-1-1s-1 .45-1 1v16c0 .55.45 1 1 1s1-.45 1-1v-1h2v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1h2v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1s-1 .45-1 1zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                </svg>`;
            } else if (feed.id === 'default') {
                iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
                </svg>`;
            } else if (feed.id === 'work') {
                iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>`;
            }
            
            // Create the button structure
            button.innerHTML = `
                <div class="playlist-icon">${iconSvg}</div>
                <span class="playlist-name">${feed.title}</span>
                <span class="playlist-tracks">${feed.tracks ? feed.tracks.length : 0} tracks</span>
            `;
            
            // Add click handler
            button.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.playlist-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Switch to this feed
                switchFeed(feed.id);
                localStorage.setItem('last_played_feed_id', feed.id);
            });
            
            // Add to container
            playlistButtons.appendChild(button);
        });
    }

    // Playlist toggle functionality
    if (togglePlaylistsButton && playlistButtonsContainer) {
        // Set initial state (expanded by default)
        togglePlaylistsButton.setAttribute('aria-expanded', 'true');
        playlistButtonsContainer.classList.remove('collapsed');
        
        togglePlaylistsButton.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Toggle the aria-expanded state
            this.setAttribute('aria-expanded', !isExpanded);
            
            // Toggle the collapsed class on the container
            playlistButtonsContainer.classList.toggle('collapsed', isExpanded);
        });
    }
}); 