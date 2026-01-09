/**
 * YouTube Video Feed Module
 * Displays Star Wars YouTube videos with toggle between different content types
 * Fetches video IDs from secure Flask backend proxy
 */

// Video rotation interval: 5 minutes (in milliseconds)
const VIDEO_ROTATION_INTERVAL_MS = 300000;

class YouTubeFeed {
    constructor() {
        this.videoContainer = document.getElementById('youtube-video-container');
        this.currentCategory = 'scenery';
        this.currentVideoIndex = 0;
        this.rotationTimer = null;
        this.apiBaseUrl = window.location.origin;
        
        // Local cache for video IDs fetched from backend
        this.videoCache = {};
        
        // Fallback video IDs in case API fails
        // Verified working embeddable Star Wars videos
        this.fallbackVideos = {
            scenery: ['1k59gXTWf-A', 'fCUlgFKGF0c', 'SjC5bezSaWU'],
            battles: ['ns_PrdukHuM', '8Qn_spdM5Zg', 'r5h2dLMqbJA'],
            music: ['_D0ZQPqeJkk', '1gpXMGit4P8', 'W1937VEYguI'],
            lore: ['wEBiPGmTphY', 'XD9WWqdfzRs', 'BSqJBWvbFgY']
        };
        
        this.init();
    }

    init() {
        this.setupCategoryButtons();
        this.loadVideo();
        this.startVideoRotation();
    }

    setupCategoryButtons() {
        const buttons = document.querySelectorAll('.category-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                buttons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                // Update category and load new video
                this.currentCategory = e.target.dataset.category;
                this.currentVideoIndex = 0;
                this.loadVideo();
                // Restart video rotation timer
                this.startVideoRotation();
            });
        });
    }

    async fetchVideoIds(category) {
        /**
         * Fetch video IDs from the Flask backend proxy
         * Backend handles YouTube API calls securely with caching
         */
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/youtube/${category}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Cache the video IDs locally
                this.videoCache[category] = data.data;
                console.log(`Loaded ${data.data.length} videos for ${category} (source: ${data.source})`);
                return data.data;
            } else {
                throw new Error(data.error || 'No videos returned');
            }
        } catch (error) {
            console.error(`Failed to fetch videos for ${category}:`, error);
            return null;
        }
    }

    async getVideoIds(category) {
        /**
         * Get video IDs for category - uses local cache if available,
         * otherwise fetches from backend
         */
        // Check local cache first
        if (this.videoCache[category] && this.videoCache[category].length > 0) {
            return this.videoCache[category];
        }
        
        // Fetch from backend
        const videos = await this.fetchVideoIds(category);
        
        if (videos && videos.length > 0) {
            return videos;
        }
        
        // Fall back to hardcoded videos
        console.warn(`Using fallback videos for ${category}`);
        return this.fallbackVideos[category] || this.fallbackVideos.scenery;
    }

    async loadVideo() {
        /**
         * Load and display a video from the current category
         */
        // Show loading state
        this.showLoading();
        
        try {
            // Get video IDs (from cache, API, or fallback)
            const videoIds = await this.getVideoIds(this.currentCategory);
            
            if (!videoIds || videoIds.length === 0) {
                this.showError('No transmissions available');
                return;
            }
            
            // Ensure index is within bounds
            if (this.currentVideoIndex >= videoIds.length) {
                this.currentVideoIndex = 0;
            }
            
            const videoId = videoIds[this.currentVideoIndex];
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;
            
            this.videoContainer.innerHTML = `
                <iframe
                    width="100%"
                    height="100%"
                    src="${embedUrl}"
                    style="border: none;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    class="youtube-iframe"
                ></iframe>
            `;
        } catch (error) {
            console.error('Error loading video:', error);
            this.showError('Transmission feed offline');
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
            this.videoCache[this.currentCategory] = this.fallbackVideos[this.currentCategory];
            this.loadVideo();
        }, 3000);
    }

    cycleVideo() {
        /**
         * Cycle to the next video in the current category
         */
        const videoIds = this.videoCache[this.currentCategory] || this.fallbackVideos[this.currentCategory];
        this.currentVideoIndex = (this.currentVideoIndex + 1) % videoIds.length;
        this.loadVideo();
    }

    startVideoRotation() {
        /**
         * Start automatic video rotation every VIDEO_ROTATION_INTERVAL_MS
         * Clears any existing rotation timer before starting
         */
        // Clear existing timer if any
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        
        // Start new rotation timer
        this.rotationTimer = setInterval(() => {
            this.cycleVideo();
        }, VIDEO_ROTATION_INTERVAL_MS);
    }

    async refreshCategory(category) {
        /**
         * Force refresh video IDs for a specific category
         * Clears local cache and fetches fresh from backend
         */
        delete this.videoCache[category];
        if (category === this.currentCategory) {
            this.currentVideoIndex = 0;
            await this.loadVideo();
        }
    }
}

// Export for use in main app
window.YouTubeFeed = YouTubeFeed;
