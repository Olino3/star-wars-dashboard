/**
 * Food Map Module
 * Displays interactive map with nearby food establishments
 * Uses Leaflet.js with OpenStreetMap and Overpass API via backend
 */

// Map refresh interval: 10 minutes (food locations don't change frequently)
const FOOD_MAP_REFRESH_INTERVAL_MS = 600000;

class FoodMap {
    constructor() {
        this.mapContainer = document.getElementById('food-map');
        this.locationElement = document.getElementById('food-map-location');
        this.countElement = document.getElementById('food-map-count');
        this.statusElement = document.getElementById('food-map-status');
        this.apiBaseUrl = window.location.origin;

        this.map = null;
        this.markers = [];
        this.currentCenter = null;
        this.refreshTimer = null;

        this.init();
    }

    init() {
        this.showLoading();
        this.loadFoodMap();
        this.startAutoRefresh();
    }

    showLoading() {
        /**
         * Display loading state
         */
        if (this.statusElement) {
            this.statusElement.textContent = 'SCANNING';
            this.statusElement.className = 'status-badge nominal';
        }
    }

    showError(message) {
        /**
         * Display error state
         */
        if (this.mapContainer) {
            this.mapContainer.innerHTML = `
                <div class="food-map-placeholder">
                    <p>⚠️ SCAN DISRUPTED</p>
                    <p class="small">${message}</p>
                    <p class="small" style="margin-top: 1rem;">Retrying connection...</p>
                </div>
            `;
        }

        if (this.statusElement) {
            this.statusElement.textContent = 'ERROR';
            this.statusElement.className = 'status-badge critical';
        }

        // Retry after delay
        setTimeout(() => {
            this.loadFoodMap();
        }, 5000);
    }

    async getUserLocation() {
        /**
         * Try to get user's location via browser geolocation API
         * Falls back to IP-based detection via backend
         */
        return new Promise((resolve) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            source: 'gps'
                        });
                    },
                    () => {
                        // Geolocation denied or failed, backend will use IP detection
                        resolve(null);
                    },
                    { timeout: 5000 }
                );
            } else {
                resolve(null);
            }
        });
    }

    async fetchFoodPlaces() {
        /**
         * Fetch food places from backend API
         */
        try {
            // Try to get user location first
            const location = await this.getUserLocation();

            let url = `${this.apiBaseUrl}/api/food-map`;

            // Add coordinates to query if available
            if (location) {
                url += `?lat=${location.latitude}&lon=${location.longitude}&radius=1000`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to fetch food places');
            }
        } catch (error) {
            console.error('Error fetching food places:', error);
            throw error;
        }
    }

    initializeMap(center) {
        /**
         * Initialize Leaflet map if not already created
         */
        if (!this.map) {
            // Clear placeholder
            this.mapContainer.innerHTML = '';

            // Create map
            this.map = L.map('food-map', {
                zoomControl: true,
                attributionControl: true
            }).setView([center.latitude, center.longitude], 15);

            // Add OpenStreetMap tile layer with dark theme
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);

            // Add center marker (you are here)
            const centerIcon = L.divIcon({
                html: '<div style="background-color: #00ff41; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #003311; box-shadow: 0 0 10px #00ff41;"></div>',
                className: 'center-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            L.marker([center.latitude, center.longitude], { icon: centerIcon })
                .addTo(this.map)
                .bindPopup('<strong>📍 Your Location</strong><br>Scan origin point');
        } else {
            // Map exists, just update view
            this.map.setView([center.latitude, center.longitude], 15);
        }
    }

    clearMarkers() {
        /**
         * Remove all food place markers from map
         */
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    addFoodMarkers(places) {
        /**
         * Add markers for all food places
         */
        this.clearMarkers();

        places.forEach((place, index) => {
            // Skip if no valid coordinates
            if (!place.latitude || !place.longitude) return;

            // Create custom icon based on food type
            const iconColor = this.getFoodTypeColor(place.type);
            const iconHtml = `
                <div style="
                    background-color: ${iconColor};
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 8px ${iconColor};
                "></div>
            `;

            const foodIcon = L.divIcon({
                html: iconHtml,
                className: 'food-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                popupAnchor: [0, -6]
            });

            // Create marker
            const marker = L.marker([place.latitude, place.longitude], { icon: foodIcon })
                .addTo(this.map);

            // Create popup content
            let popupContent = `
                <div class="food-popup">
                    <strong>${place.display_type}</strong><br>
                    <span style="font-size: 1.1em; color: #00ff41;">${place.name}</span><br>
            `;

            if (place.cuisine) {
                popupContent += `<em>${place.cuisine}</em><br>`;
            }

            if (place.distance) {
                const distanceText = place.distance >= 1000
                    ? `${(place.distance / 1000).toFixed(1)} km`
                    : `${Math.round(place.distance)} m`;
                popupContent += `<small>📏 ${distanceText} away</small>`;
            }

            popupContent += '</div>';

            marker.bindPopup(popupContent);
            this.markers.push(marker);
        });
    }

    getFoodTypeColor(type) {
        /**
         * Get color for food type marker
         */
        const colorMap = {
            'restaurant': '#ff6b35',    // Orange
            'cafe': '#f7931e',          // Light orange
            'fast_food': '#e63946',     // Red
            'food_court': '#ffb703',    // Yellow
            'ice_cream': '#06ffa5',     // Cyan
            'pub': '#8338ec',           // Purple
            'bar': '#3a86ff'            // Blue
        };

        return colorMap[type] || '#00ff41'; // Default: imperial green
    }

    updateStats(data) {
        /**
         * Update location display and food count
         */
        if (this.locationElement) {
            const cityText = data.city || 'Unknown Sector';
            this.locationElement.textContent = `📍 ${cityText}`;
        }

        if (this.countElement) {
            const count = data.places ? data.places.length : 0;
            const plural = count === 1 ? '' : 's';
            this.countElement.textContent = `${count} establishment${plural} detected`;
        }

        if (this.statusElement) {
            const count = data.places ? data.places.length : 0;
            if (count > 0) {
                this.statusElement.textContent = 'SCAN COMPLETE';
                this.statusElement.className = 'status-badge optimal';
            } else {
                this.statusElement.textContent = 'NO TARGETS';
                this.statusElement.className = 'status-badge degraded';
            }
        }
    }

    async loadFoodMap() {
        /**
         * Main function to load and display food map
         */
        try {
            this.showLoading();

            // Fetch food places data
            const data = await this.fetchFoodPlaces();

            if (!data || !data.center) {
                throw new Error('Invalid data received from server');
            }

            // Initialize or update map
            this.initializeMap(data.center);
            this.currentCenter = data.center;

            // Add food place markers
            if (data.places && data.places.length > 0) {
                this.addFoodMarkers(data.places);
            }

            // Update stats display
            this.updateStats(data);

        } catch (error) {
            console.error('Error loading food map:', error);
            this.showError(error.message || 'Failed to load tactical scan');
        }
    }

    startAutoRefresh() {
        /**
         * Start automatic refresh of food data
         */
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            this.loadFoodMap();
        }, FOOD_MAP_REFRESH_INTERVAL_MS);
    }

    async refresh() {
        /**
         * Manually refresh the food map
         */
        await this.loadFoodMap();
    }
}

// Export for use in main app
window.FoodMap = FoodMap;
