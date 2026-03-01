/**
 * Kuat Systems Dashboard - Main Application
 * Handles data fetching and UI updates
 */

class KuatSystemsDashboard {
    constructor() {
        // API base URL (change if deploying to different server)
        this.apiBaseUrl = window.location.origin;

        // Update intervals (in milliseconds)
        this.chronoInterval = 1000;      // 1 second
        this.systemInterval = 5000;      // 5 seconds
        this.weatherInterval = 300000;   // 5 minutes
        this.newsInterval = 600000;      // 10 minutes
        this.subwayInterval = 60000;     // 1 minute

        // Initialize components
        this.youtubeFeed = null;
        this.init();
    }

    init() {
        console.log('Initializing Kuat Systems Dashboard...');

        // Set dashboard name from config
        this.setDashboardName();

        // Initialize YouTube feed
        try {
            this.youtubeFeed = new YouTubeFeed();
        } catch (error) {
            console.error('Failed to initialize YouTube feed:', error);
        }

        // Initial data fetch
        this.updateChronometer();
        this.updateSystemStats();
        this.updateWeather();
        this.updateNews();
        this.updateSubway();

        // Set up periodic updates
        setInterval(() => this.updateChronometer(), this.chronoInterval);
        setInterval(() => this.updateSystemStats(), this.systemInterval);
        setInterval(() => this.updateWeather(), this.weatherInterval);
        setInterval(() => this.updateNews(), this.newsInterval);
        setInterval(() => this.updateSubway(), this.subwayInterval);

        console.log('Dashboard initialized successfully');
    }

    setDashboardName() {
        // Set dashboard name from configuration (if available)
        if (typeof DASHBOARD_CONFIG !== 'undefined' && DASHBOARD_CONFIG.name) {
            const nameElement = document.getElementById('dashboard-name');
            if (nameElement) {
                nameElement.textContent = DASHBOARD_CONFIG.name;
            }
            // Also update page title
            document.title = DASHBOARD_CONFIG.name;
        }
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
                document.getElementById('weather-temp').textContent = `${weather.temperature}°F`;
                document.getElementById('weather-desc').textContent = weather.description;
                document.getElementById('feels-like').textContent = `${weather.feels_like}°F`;
                document.getElementById('humidity').textContent = `${weather.humidity}%`;
                document.getElementById('wind-speed').textContent = `${weather.wind_speed} mph`;
                document.getElementById('visibility').textContent = `${weather.visibility} mi`;

                // Update weather animation based on description and day/night
                this.updateWeatherAnimation(weather.description, weather.is_day);

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
            } else {
                // Display error state
                const errorMsg = data.error || 'Weather data unavailable';
                document.getElementById('weather-location').textContent = 'DATA UNAVAILABLE';
                document.getElementById('weather-temp').textContent = '--°F';
                document.getElementById('weather-desc').textContent = errorMsg;
                document.getElementById('feels-like').textContent = '--';
                document.getElementById('humidity').textContent = '--';
                document.getElementById('wind-speed').textContent = '--';
                document.getElementById('visibility').textContent = '--';

                const statusBadge = document.getElementById('atmospheric-status');
                statusBadge.textContent = 'SENSOR OFFLINE';
                statusBadge.className = 'status-badge degraded';
            }
        } catch (error) {
            console.error('Weather update error:', error);
            document.getElementById('weather-location').textContent = 'DATA UNAVAILABLE';
            document.getElementById('weather-temp').textContent = '--°F';
            document.getElementById('weather-desc').textContent = 'Connection error';
            document.getElementById('feels-like').textContent = '--';
            document.getElementById('humidity').textContent = '--';
            document.getElementById('wind-speed').textContent = '--';
            document.getElementById('visibility').textContent = '--';

            const statusBadge = document.getElementById('atmospheric-status');
            statusBadge.textContent = 'SENSOR OFFLINE';
            statusBadge.className = 'status-badge degraded';
        }
    }

    updateWeatherAnimation(description, isDay = true) {
        const weatherAnimation = document.getElementById('weather-animation');
        if (!weatherAnimation) return;

        const desc = description.toLowerCase();
        let weatherType = 'clear';

        if (desc.includes('thunder') || desc.includes('storm')) {
            weatherType = 'thunder';
        } else if (desc.includes('snow') || desc.includes('sleet') || desc.includes('blizzard')) {
            weatherType = 'snow';
        } else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
            weatherType = 'rain';
        } else if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze') || desc.includes('smoke')) {
            weatherType = 'fog';
        } else if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('partly')) {
            weatherType = 'clouds';
        } else if (desc.includes('clear') || desc.includes('sunny') || desc.includes('sun')) {
            weatherType = 'clear';
        }

        weatherAnimation.setAttribute('data-weather', weatherType);
        weatherAnimation.setAttribute('data-time', isDay ? 'day' : 'night');
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

                    // Create title div
                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'news-title';

                    // Create title with optional link using DOM APIs to prevent XSS
                    if (item.url) {
                        const link = document.createElement('a');
                        link.setAttribute('href', item.url);
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                        link.className = 'news-link';
                        link.textContent = item.title;
                        titleDiv.appendChild(link);
                    } else {
                        titleDiv.textContent = item.title;
                    }

                    // Create meta div
                    const metaDiv = document.createElement('div');
                    metaDiv.className = 'news-meta';

                    // Create source span
                    const sourceSpan = document.createElement('span');
                    sourceSpan.className = 'news-source';
                    sourceSpan.textContent = item.source;

                    // Create time span
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'news-time';
                    timeSpan.textContent = item.time;

                    // Assemble the structure
                    metaDiv.appendChild(sourceSpan);
                    metaDiv.appendChild(timeSpan);
                    newsItem.appendChild(titleDiv);
                    newsItem.appendChild(metaDiv);
                    newsFeed.appendChild(newsItem);
                });
            } else {
                // Display error state
                const newsFeed = document.getElementById('news-feed');
                const errorMsg = data.error || 'No news data available';
                newsFeed.innerHTML = '';
                const errorItem = document.createElement('div');
                errorItem.className = 'news-item';
                errorItem.innerHTML = `
                    <div class="news-title">HoloNet Feed Unavailable</div>
                    <div class="news-meta">
                        <span class="news-source">Error</span>
                        <span class="news-time">${errorMsg}</span>
                    </div>
                `;
                newsFeed.appendChild(errorItem);
            }
        } catch (error) {
            console.error('News update error:', error);
            const newsFeed = document.getElementById('news-feed');
            newsFeed.innerHTML = '';
            const errorItem = document.createElement('div');
            errorItem.className = 'news-item';
            errorItem.innerHTML = `
                <div class="news-title">HoloNet Feed Unavailable</div>
                <div class="news-meta">
                    <span class="news-source">Error</span>
                    <span class="news-time">Connection error</span>
                </div>
            `;
            newsFeed.appendChild(errorItem);
        }
    }

    async updateSubway() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/subway`);
            const data = await response.json();

            if (data.success) {
                const subway = data.data;

                // Update station name
                document.getElementById('subway-station').textContent = subway.station;

                // Update lines
                const linesContainer = document.getElementById('subway-lines');
                linesContainer.innerHTML = '';

                if (subway.lines && subway.lines.length > 0) {
                    subway.lines.forEach(line => {
                        const lineItem = document.createElement('div');
                        lineItem.className = 'subway-line-item fade-in';

                        // Format arrival times
                        const arrivalText = line.arrivals.map(min => {
                            if (min === 0) return 'Now';
                            if (min === 1) return '1 min';
                            return `${min} min`;
                        }).join(', ');

                        // Create delay indicator if needed
                        const delayIndicator = line.delayed ? 
                            '<span class="delay-indicator" title="Service Delays">⚠</span>' : '';

                        // Display format: Route (Direction): times
                        lineItem.innerHTML = `
                            <span class="route-badge route-${line.route}" style="background-color: ${line.color || '#808183'}">
                                ${line.route}
                            </span>
                            <span class="route-direction">(${line.direction})</span>
                            <span class="arrival-times">${arrivalText}</span>
                            ${delayIndicator}
                        `;

                        linesContainer.appendChild(lineItem);
                    });
                } else {
                    linesContainer.innerHTML = `
                        <div class="subway-placeholder">
                            <p>No upcoming trains</p>
                            <p class="small">Check back soon</p>
                        </div>
                    `;
                }

                // Update status badge
                const statusBadge = document.getElementById('subway-status');
                statusBadge.textContent = subway.status;

                // Set badge color based on status
                if (subway.status.includes('OPERATIONAL')) {
                    statusBadge.className = 'status-badge optimal';
                } else if (subway.status.includes('DELAY')) {
                    statusBadge.className = 'status-badge degraded';
                } else {
                    statusBadge.className = 'status-badge nominal';
                }
            }
        } catch (error) {
            console.error('Subway update error:', error);
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
        dashboard = new KuatSystemsDashboard();
    });
} else {
    dashboard = new KuatSystemsDashboard();
}
