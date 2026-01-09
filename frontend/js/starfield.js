/**
 * KSE Starfield Particle System
 * "Slow-Shift Deep Space" Effect
 * Optimized for Raspberry Pi performance
 */

class KSEStarfield {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Starfield canvas not found, creating dynamically');
            this.createCanvas();
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.nebulaClouds = [];
        
        // Performance-optimized settings for Raspberry Pi
        this.config = {
            starCount: 120,           // Reduced for Pi performance
            nebulaCount: 3,           // Subtle nebula clouds
            baseSpeed: 0.02,          // Very slow drift
            maxSpeed: 0.08,
            parallaxLayers: 3,
            refreshRate: 30,          // 30 FPS target for Pi
            colors: {
                starPrimary: '#FFFFFF',
                starSecondary: '#87CEEB',
                starDim: '#4A5568',
                kuatGold: '#C9A227',
                nebulaBlue: 'rgba(0, 180, 216, 0.03)',
                nebulaPurple: 'rgba(139, 92, 246, 0.02)'
            }
        };
        
        this.lastTime = 0;
        this.frameInterval = 1000 / this.config.refreshRate;
        this.isRunning = false;
        
        this.init();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'starfield-canvas';
        this.canvas.className = 'starfield-layer';
        document.body.insertBefore(this.canvas, document.body.firstChild);
    }
    
    init() {
        this.resize();
        this.generateStars();
        this.generateNebulae();
        
        window.addEventListener('resize', () => this.resize());
        
        this.start();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    generateStars() {
        this.stars = [];
        
        for (let i = 0; i < this.config.starCount; i++) {
            // Parallax layer determines size and speed
            const layer = Math.floor(Math.random() * this.config.parallaxLayers);
            const layerMultiplier = (layer + 1) / this.config.parallaxLayers;
            
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                
                // Multi-directional drift vectors
                vx: (Math.random() - 0.5) * this.config.baseSpeed * layerMultiplier,
                vy: (Math.random() - 0.5) * this.config.baseSpeed * layerMultiplier * 0.5,
                
                // Size based on layer (distant = smaller)
                radius: 0.3 + (layerMultiplier * 1.2),
                
                // Color selection
                color: this.getStarColor(layer),
                
                // Twinkle properties
                twinkleSpeed: 0.005 + Math.random() * 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                baseOpacity: 0.3 + (layerMultiplier * 0.7),
                
                layer: layer
            });
        }
    }
    
    getStarColor(layer) {
        const rand = Math.random();
        
        // Rare Kuat Gold stars (navigation beacons)
        if (rand < 0.03) {
            return this.config.colors.kuatGold;
        }
        
        // Layer-based coloring
        if (layer === 0) {
            return this.config.colors.starDim;     // Distant: dim
        } else if (layer === 1) {
            return rand < 0.5 ? this.config.colors.starSecondary : this.config.colors.starPrimary;
        } else {
            return this.config.colors.starPrimary;  // Close: bright white
        }
    }
    
    generateNebulae() {
        this.nebulaClouds = [];
        
        for (let i = 0; i < this.config.nebulaCount; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 150 + Math.random() * 200,
                color: i % 2 === 0 
                    ? this.config.colors.nebulaBlue 
                    : this.config.colors.nebulaPurple,
                vx: (Math.random() - 0.5) * 0.01,
                vy: (Math.random() - 0.5) * 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.002
            });
        }
    }
    
    update(deltaTime) {
        // Update stars
        for (const star of this.stars) {
            // Slow drift movement
            star.x += star.vx * deltaTime;
            star.y += star.vy * deltaTime;
            
            // Update twinkle phase
            star.twinklePhase += star.twinkleSpeed * deltaTime;
            
            // Wrap around screen edges
            if (star.x < -10) star.x = this.canvas.width + 10;
            if (star.x > this.canvas.width + 10) star.x = -10;
            if (star.y < -10) star.y = this.canvas.height + 10;
            if (star.y > this.canvas.height + 10) star.y = -10;
        }
        
        // Update nebulae
        for (const nebula of this.nebulaClouds) {
            nebula.x += nebula.vx * deltaTime;
            nebula.y += nebula.vy * deltaTime;
            nebula.pulsePhase += nebula.pulseSpeed * deltaTime;
            
            // Wrap nebulae
            if (nebula.x < -nebula.radius) nebula.x = this.canvas.width + nebula.radius;
            if (nebula.x > this.canvas.width + nebula.radius) nebula.x = -nebula.radius;
            if (nebula.y < -nebula.radius) nebula.y = this.canvas.height + nebula.radius;
            if (nebula.y > this.canvas.height + nebula.radius) nebula.y = -nebula.radius;
        }
    }
    
    draw() {
        // Clear with deep space black
        this.ctx.fillStyle = '#0A0A0A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle vignette for curved display optimization
        this.drawVignette();
        
        // Draw nebulae (background layer)
        this.drawNebulae();
        
        // Draw stars by layer (back to front)
        for (let layer = 0; layer < this.config.parallaxLayers; layer++) {
            const layerStars = this.stars.filter(s => s.layer === layer);
            this.drawStarLayer(layerStars);
        }
    }
    
    drawVignette() {
        // Subtle vignette to guide eye to center on curved display
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 
            Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0)');
        gradient.addColorStop(0.7, 'rgba(10, 10, 10, 0)');
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0.4)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawNebulae() {
        for (const nebula of this.nebulaClouds) {
            const pulseFactor = 0.8 + Math.sin(nebula.pulsePhase) * 0.2;
            const currentRadius = nebula.radius * pulseFactor;
            
            const gradient = this.ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, currentRadius
            );
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(nebula.x, nebula.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawStarLayer(stars) {
        for (const star of stars) {
            // Calculate twinkle opacity
            const twinkleFactor = 0.6 + Math.sin(star.twinklePhase) * 0.4;
            const opacity = star.baseOpacity * twinkleFactor;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            
            // Core glow
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = opacity;
            this.ctx.fill();
            
            // Outer glow for brighter stars
            if (star.layer === this.config.parallaxLayers - 1 && star.radius > 1) {
                const glowGradient = this.ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.radius * 3
                );
                glowGradient.addColorStop(0, star.color);
                glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = glowGradient;
                this.ctx.globalAlpha = opacity * 0.3;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        
        // Frame rate limiting for Pi performance
        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime / 16.67); // Normalize to ~60fps base
            this.draw();
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
        }
        
        requestAnimationFrame((t) => this.animate(t));
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.animate(t));
    }
    
    stop() {
        this.isRunning = false;
    }
    
    // Pause when dashboard is not visible (save Pi resources)
    handleVisibilityChange() {
        if (document.hidden) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// Initialize starfield when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kseStarfield = new KSEStarfield('starfield-canvas');
    
    // Handle visibility changes for performance
    document.addEventListener('visibilitychange', () => {
        window.kseStarfield.handleVisibilityChange();
    });
});
