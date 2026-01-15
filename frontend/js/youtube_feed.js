/**
 * YouTube Video Feed Module
 * Displays Star Wars scenery videos continuously
 * Fetches video IDs from secure Flask backend proxy
 * Only refetches when all videos have been played
 */

class YouTubeFeed {
    constructor() {
        this.videoContainer = document.getElementById('youtube-video-container');
        this.currentVideoIndex = 0;
        this.apiBaseUrl = window.location.origin;
        this.player = null;
        this.playerReady = false;

        // Track video IDs and playback
        this.videoIds = [];
        this.playedVideos = new Set();

        // Fallback video IDs in case API fails
        // Verified working embeddable Star Wars scenery videos
        this.fallbackVideos = ['1k59gXTWf-A', 'fCUlgFKGF0c', 'SjC5bezSaWU'];

        this.init();
    }

    init() {
        // Load YouTube IFrame API
        this.loadYouTubeAPI();
    }

    loadYouTubeAPI() {
        /**
         * Load YouTube IFrame API script
         */
        // Ensure a shared callback queue exists
        if (!window._ytApiReadyCallbacks) {
            window._ytApiReadyCallbacks = [];
        }

        const instanceCallback = () => {
            this.onAPIReady();
        };

        // If the API is already fully ready, call immediately
        if (window.YT && window.YT.Player) {
            instanceCallback();
            return;
        }

        // Otherwise, enqueue this instance's callback to be called when the API is ready
        window._ytApiReadyCallbacks.push(instanceCallback);

        // If the script tag is already present, assume it is loading and just rely on the global callback
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

        if (!existingScript) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Set up (or extend) the global callback for when the API is ready
        if (!window.onYouTubeIframeAPIReady) {
            window.onYouTubeIframeAPIReady = () => {
                const callbacks = window._ytApiReadyCallbacks || [];
                while (callbacks.length) {
                    const cb = callbacks.shift();
                    try {
                        cb();
                    } catch (e) {
                        console.error('Error in YouTube IFrame API ready callback:', e);
                    }
                }
            };
        } else {
            const previousCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                try {
                    previousCallback();
                } finally {
                    const callbacks = window._ytApiReadyCallbacks || [];
                    while (callbacks.length) {
                        const cb = callbacks.shift();
                        try {
                            cb();
                        } catch (e) {
                            console.error('Error in YouTube IFrame API ready callback:', e);
                        }
                    }
                }
            };
        }
    }

    async onAPIReady() {
        /**
         * Called when YouTube IFrame API is ready
         */
        console.log('YouTube IFrame API ready');
        await this.loadVideoList();
    }

    async fetchVideoIds() {
        /**
         * Fetch video IDs from the Flask backend proxy
         * Backend handles YouTube API calls securely with caching
         */
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/youtube/scenery`);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                console.log(`Loaded ${data.data.length} scenery videos (source: ${data.source})`);
                return data.data;
            } else {
                throw new Error(data.error || 'No videos returned');
            }
        } catch (error) {
            console.error('Failed to fetch scenery videos:', error);
            return null;
        }
    }

    async loadVideoList() {
        /**
         * Load the list of video IDs from backend
         * Only called when starting or when all videos have been played
         */
        this.showLoading();

        try {
            // Fetch from backend
            const videos = await this.fetchVideoIds();

            if (videos && videos.length > 0) {
                this.videoIds = videos;
            } else {
                // Fall back to hardcoded videos
                console.warn('Using fallback scenery videos');
                this.videoIds = this.fallbackVideos;
            }

            // Reset playback tracking
            this.playedVideos.clear();
            this.currentVideoIndex = 0;

            // Start playing the first video
            this.loadVideo();
        } catch (error) {
            console.error('Error loading video list:', error);
            this.showError('Transmission feed offline');
        } finally {
            this.hideLoading();
        }
    }

    hideLoading() {
        /**
         * Hide the loading state in the UI
         * This is a safe no-op if the loading element is not present.
         */
        const loadingElement = document.getElementById('youtube-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    loadVideo() {
        /**
         * Load and display the current video
         */
        if (!this.videoIds || this.videoIds.length === 0) {
            this.showError('No transmissions available');
            return;
        }

        // Check if all videos have been played
        if (this.playedVideos.size >= this.videoIds.length) {
            console.log('All videos played, refetching from backend...');
            this.loadVideoList();
            return;
        }

        // Find next unplayed video
        while (this.playedVideos.has(this.currentVideoIndex)) {
            this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videoIds.length;
        }

        const videoId = this.videoIds[this.currentVideoIndex];

        // Mark this video as played
        this.playedVideos.add(this.currentVideoIndex);

        console.log(`Loading video ${this.currentVideoIndex + 1}/${this.videoIds.length}: ${videoId}`);

        // Create or update player
        if (!this.player) {
            this.createPlayer(videoId);
        } else if (this.playerReady) {
            // Load new video in existing player
            this.player.loadVideoById(videoId);
        }
    }

    createPlayer(videoId) {
        /**
         * Create YouTube player instance with event handlers
         */
        // Create iframe container
        this.videoContainer.innerHTML = `
            <div id="youtube-player"></div>
        `;

        this.player = new YT.Player('youtube-player', {
            width: '100%',
            height: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                mute: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                'onReady': (event) => {
                    this.onPlayerReady(event);
                },
                'onStateChange': (event) => {
                    this.onPlayerStateChange(event);
                },
                'onError': (event) => {
                    this.onPlayerError(event);
                }
            }
        });
    }

    onPlayerReady(event) {
        /**
         * Called when player is ready
         */
        console.log('YouTube player ready');
        this.playerReady = true;
        event.target.playVideo();
    }

    onPlayerStateChange(event) {
        /**
         * Called when player state changes
         * YT.PlayerState: ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5
         */
        if (event.data === YT.PlayerState.ENDED) {
            console.log('Video ended, loading next video...');
            // Let loadVideo handle selecting the next video
            this.loadVideo();
        }
    }

    onPlayerError(event) {
        /**
         * Called when player encounters an error
         * Error codes: 2 = invalid param, 5 = HTML5 error, 100 = not found, 101/150 = not embeddable
         */
        console.error('YouTube player error:', event.data);

        // Try next video
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videoIds.length;

        // If we've tried all videos, show error
        if (this.playedVideos.size >= this.videoIds.length) {
            this.showError('Unable to play videos');
        } else {
            this.loadVideo();
        }
    }

    showLoading() {
        /**
         * Display loading state in video container
         */
        this.videoContainer.innerHTML = `
            <div class="youtube-placeholder">
                <p>⚡ ESTABLISHING HOLONET CONNECTION</p>
                <p class="small">Synchronizing transmission feed...</p>
            </div>
        `;
    }

    showError(message) {
        /**
         * Display error state with graceful message
         */
        this.videoContainer.innerHTML = `
            <div class="youtube-placeholder">
                <p>⚠️ TRANSMISSION DISRUPTED</p>
                <p class="small">${message}</p>
                <p class="small" style="margin-top: 1rem;">Attempting to restore connection...</p>
            </div>
        `;

        // Retry with fallback after delay
        setTimeout(() => {
            this.videoIds = this.fallbackVideos;
            this.playedVideos.clear();
            this.currentVideoIndex = 0;
            this.player = null;
            this.playerReady = false;
            this.loadVideo();
        }, 3000);
    }
}

// Export for use in main app
window.YouTubeFeed = YouTubeFeed;
