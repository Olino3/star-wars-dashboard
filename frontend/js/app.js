/**
 * Galactic Command Dashboard - Main Application
 * Handles data fetching and UI updates
 */

class GalacticDashboard {
    constructor() {
        // API base URL (change if deploying to different server)
        this.apiBaseUrl = window.location.origin;

        // Update intervals (in milliseconds)
        this.chronoInterval = 1000;      // 1 second
        this.systemInterval = 5000;      // 5 seconds
        this.weatherInterval = 300000;   // 5 minutes
        this.newsInterval = 600000;      // 10 minutes

        // Initialize components
        this.bountyTracker = null;
        this.init();
    }

    init() {
        console.log('Initializing Galactic Command Dashboard...');

        // Initialize bounty tracker
        this.bountyTracker = new BountyTracker(this.apiBaseUrl);

        // Initial data fetch
        this.updateChronometer();
        this.updateSystemStats();
        this.updateWeather();
        this.updateNews();

        // Set up periodic updates
        setInterval(() => this.updateChronometer(), this.chronoInterval);
        setInterval(() => this.updateSystemStats(), this.systemInterval);
        setInterval(() => this.updateWeather(), this.weatherInterval);
        setInterval(() => this.updateNews(), this.newsInterval);

        console.log('Dashboard initialized successfully');
    }

    async updateChronometer() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chronometer`);
            const data = await response.json();

            if (data.success) {
                const chrono = data.data;
                document.getElementById('galactic-time').textContent = chrono.galactic_standard;
                document.getElementById('earth-time').textContent =
                    `${chrono.earth_date} ${chrono.earth_time}`;

                // Update last update time in footer
                const now = new Date();
                document.getElementById('last-update').textContent =
                    `Last Update: ${now.toLocaleTimeString()}`;
            }
        } catch (error) {
            console.error('Chronometer update error:', error);
        }
    }

    async updateSystemStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/system`);
            const data = await response.json();

            if (data.success) {
                const stats = data.data;

                // Reactor Core
                this.updateReactorCore(stats.reactor_core);

                // Memory Banks
                this.updateMemoryBanks(stats.memory_banks);

                // Storage Systems
                this.updateStorageSystems(stats.storage_systems);
            }
        } catch (error) {
            console.error('System stats update error:', error);
        }
    }

    updateReactorCore(reactor) {
        document.getElementById('reactor-temp').textContent = `${reactor.temperature}°C`;
        document.getElementById('reactor-stability').textContent = `${reactor.stability}%`;
        document.getElementById('reactor-stability-bar').style.width = `${reactor.stability}%`;

        const statusBadge = document.getElementById('reactor-status');
        statusBadge.textContent = reactor.status;
        statusBadge.className = `status-badge ${reactor.status.toLowerCase()}`;

        // Alert if temperature is critical
        if (reactor.alert) {
            statusBadge.style.animation = 'pulse 1s infinite';
        } else {
            statusBadge.style.animation = 'none';
        }

        // Update bar color based on stability
        const bar = document.getElementById('reactor-stability-bar');
        if (reactor.stability >= 70) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-green) 0%, var(--imperial-blue) 100%)';
        } else if (reactor.stability >= 40) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-yellow) 0%, var(--imperial-orange) 100%)';
        } else {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-red) 0%, var(--imperial-orange) 100%)';
        }
    }

    updateMemoryBanks(memory) {
        document.getElementById('memory-integrity').textContent = `${memory.integrity}%`;
        document.getElementById('memory-integrity-bar').style.width = `${memory.integrity}%`;
        document.getElementById('memory-usage').textContent =
            `${memory.used_gb} / ${memory.total_gb} GB`;

        const statusBadge = document.getElementById('memory-status');
        statusBadge.textContent = memory.status;
        statusBadge.className = `status-badge ${memory.status.toLowerCase()}`;

        // Update bar color
        const bar = document.getElementById('memory-integrity-bar');
        if (memory.integrity >= 70) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-green) 0%, var(--imperial-blue) 100%)';
        } else if (memory.integrity >= 40) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-yellow) 0%, var(--imperial-orange) 100%)';
        } else {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-red) 0%, var(--imperial-orange) 100%)';
        }
    }

    updateStorageSystems(storage) {
        document.getElementById('storage-capacity').textContent = `${storage.capacity}%`;
        document.getElementById('storage-capacity-bar').style.width = `${storage.capacity}%`;
        document.getElementById('storage-usage').textContent =
            `${storage.used_gb} / ${storage.total_gb} GB`;

        const statusBadge = document.getElementById('storage-status');
        statusBadge.textContent = storage.status;
        statusBadge.className = `status-badge ${storage.status.toLowerCase()}`;

        // Update bar color
        const bar = document.getElementById('storage-capacity-bar');
        if (storage.capacity >= 70) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-green) 0%, var(--imperial-blue) 100%)';
        } else if (storage.capacity >= 40) {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-yellow) 0%, var(--imperial-orange) 100%)';
        } else {
            bar.style.background = 'linear-gradient(90deg, var(--imperial-red) 0%, var(--imperial-orange) 100%)';
        }
    }

    async updateWeather() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/weather`);
            const data = await response.json();

            if (data.success) {
                const weather = data.data;

                document.getElementById('weather-location').textContent = weather.location;
                document.getElementById('weather-temp').textContent = `${weather.temperature}°C`;
                document.getElementById('weather-desc').textContent = weather.description;
                document.getElementById('feels-like').textContent = `${weather.feels_like}°C`;
                document.getElementById('humidity').textContent = `${weather.humidity}%`;
                document.getElementById('wind-speed').textContent = `${weather.wind_speed} km/h`;
                document.getElementById('visibility').textContent = `${weather.visibility} km`;

                const statusBadge = document.getElementById('atmospheric-status');
                statusBadge.textContent = weather.atmospheric_status;

                // Set badge color based on weather status
                if (weather.atmospheric_status.includes('OPTIMAL') || weather.atmospheric_status.includes('CLEAR')) {
                    statusBadge.className = 'status-badge optimal';
                } else if (weather.atmospheric_status.includes('STORM') || weather.atmospheric_status.includes('REDUCED')) {
                    statusBadge.className = 'status-badge degraded';
                } else {
                    statusBadge.className = 'status-badge nominal';
                }
            }
        } catch (error) {
            console.error('Weather update error:', error);
        }
    }

    async updateNews() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/news`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const newsFeed = document.getElementById('news-feed');
                newsFeed.innerHTML = '';

                data.data.forEach(item => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'news-item fade-in';
                    newsItem.innerHTML = `
                        <div class="news-title">${item.title}</div>
                        <div class="news-meta">
                            <span class="news-source">${item.source}</span>
                            <span class="news-time">${item.time}</span>
                        </div>
                    `;
                    newsFeed.appendChild(newsItem);
                });
            }
        } catch (error) {
            console.error('News update error:', error);
        }
    }

    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, duration);
    }
}

// Initialize dashboard when DOM is ready
let dashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new GalacticDashboard();
    });
} else {
    dashboard = new GalacticDashboard();
}
