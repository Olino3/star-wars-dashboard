/**
 * Hyperspace Screensaver
 * Renders a Star Wars-style hyperspace effect
 */

class HyperspaceScreensaver {
    constructor() {
        this.canvas = document.getElementById('hyperspace-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.stars = [];
        this.numStars = 200;
        this.speed = 2;
        this.isActive = false;
        this.animationId = null;

        // Screensaver timeout (10 minutes = 600000ms)
        this.timeout = 600000;
        this.timeoutId = null;

        if (this.canvas && this.ctx) {
            this.init();
        }
    }

    init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Create initial stars
        this.createStars();

        // Setup screensaver activation
        this.setupScreensaverTrigger();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push(this.createStar());
        }
    }

    createStar() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.max(this.canvas.width, this.canvas.height);

        return {
            x: this.centerX + Math.cos(angle) * distance,
            y: this.centerY + Math.sin(angle) * distance,
            z: Math.random() * this.canvas.width,
            prevX: this.centerX,
            prevY: this.centerY
        };
    }

    updateStars() {
        for (let star of this.stars) {
            // Store previous position
            star.prevX = star.x;
            star.prevY = star.y;

            // Move star towards viewer
            star.z -= this.speed;

            // Reset star if it goes behind viewer
            if (star.z <= 0) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * Math.max(this.canvas.width, this.canvas.height);
                star.x = this.centerX + Math.cos(angle) * distance;
                star.y = this.centerY + Math.sin(angle) * distance;
                star.z = this.canvas.width;
            }

            // Project 3D to 2D
            const k = 128.0 / star.z;
            star.x = (star.x - this.centerX) * k + this.centerX;
            star.y = (star.y - this.centerY) * k + this.centerY;
        }
    }

    drawStars() {
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let star of this.stars) {
            // Calculate star size based on depth
            const size = (1 - star.z / this.canvas.width) * 3;

            // Draw star trail
            this.ctx.beginPath();
            this.ctx.moveTo(star.prevX, star.prevY);
            this.ctx.lineTo(star.x, star.y);

            // Color based on depth (closer = brighter)
            const brightness = Math.floor(255 * (1 - star.z / this.canvas.width));
            this.ctx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            this.ctx.lineWidth = size;
            this.ctx.stroke();
        }
    }

    animate() {
        if (!this.isActive) return;

        this.updateStars();
        this.drawStars();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isActive = true;
        document.getElementById('screensaver').classList.add('active');
        document.getElementById('dashboard').style.display = 'none';
        this.createStars(); // Recreate stars for fresh start
        this.animate();
    }

    stop() {
        this.isActive = false;
        document.getElementById('screensaver').classList.remove('active');
        document.getElementById('dashboard').style.display = 'flex';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    setupScreensaverTrigger() {
        // Reset timer on user activity
        const resetTimer = () => {
            if (this.isActive) {
                this.stop();
            }
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => this.start(), this.timeout);
        };

        // Listen for user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Start initial timer
        resetTimer();
    }
}

// Initialize screensaver when DOM is ready
let screensaver;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        screensaver = new HyperspaceScreensaver();
    });
} else {
    screensaver = new HyperspaceScreensaver();
}
