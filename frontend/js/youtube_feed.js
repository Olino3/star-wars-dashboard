/**
 * YouTube Video Feed Module
 * Displays Star Wars YouTube videos with toggle between different content types
 */

class YouTubeFeed {
    constructor() {
        this.videoContainer = document.getElementById('youtube-video-container');
        
        // Validate that the video container exists
        if (!this.videoContainer) {
            console.error('YouTube video container not found in DOM');
            return;
        }
        
        this.currentCategory = 'scenery';
        
        // YouTube video IDs for different Star Wars content
        this.videos = {
            scenery: [
                'muAVrtg-rKs', // Star Wars Ambient Space
                '1k59gXTWf-A', // Star Wars Ambience
                'fCUlgFKGF0c'  // Star Wars Meditation
            ],
            battles: [
                'yHfLyMAHrQE', // Epic Battles
                'CbIZU8cQWXc', // Space Battles
                'wxL8bVJhXCM'  // Battle of Yavin
            ],
            music: [
                'S_VoxcEjfFI', // Star Wars Theme
                '_D0ZQPqeJkk', // Imperial March
                '1gpXMGit4P8'  // Cantina Band
            ],
            lore: [
                'wEBiPGmTphY', // Star Wars Lore
                'XD9WWqdfzRs', // History of Star Wars
                'BSqJBWvbFgY'  // Jedi vs Sith
            ]
        };
        
        this.currentVideoIndex = 0;
        this.videoRotationInterval = null;
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

    loadVideo() {
        // Validate container exists
        if (!this.videoContainer) {
            return;
        }
        
        // Validate category exists
        if (!this.videos[this.currentCategory]) {
            console.error(`Invalid category: ${this.currentCategory}`);
            this.currentCategory = 'scenery';
        }
        
        const videoId = this.videos[this.currentCategory][this.currentVideoIndex];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;
        
        this.videoContainer.innerHTML = `
            <iframe
                width="100%"
                height="100%"
                src="${embedUrl}"
                title="Star Wars YouTube Video Player"
                style="border: none;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="youtube-iframe"
            ></iframe>
        `;
    }

    startVideoRotation() {
        // Clear existing interval if any
        if (this.videoRotationInterval) {
            clearInterval(this.videoRotationInterval);
        }
        
        // Rotate to next video every 5 minutes (300000 ms)
        this.videoRotationInterval = setInterval(() => {
            this.cycleVideo();
        }, 300000);
    }

    cycleVideo() {
        const categoryVideos = this.videos[this.currentCategory];
        this.currentVideoIndex = (this.currentVideoIndex + 1) % categoryVideos.length;
        this.loadVideo();
    }
}

// Export for use in main app
window.YouTubeFeed = YouTubeFeed;
