/**
 * Bounty Hunter Tracking Module
 * Handles scanning for bounty targets
 */

class BountyTracker {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.scanButton = document.getElementById('scan-button');
        this.scanStatus = document.getElementById('scan-status');
        this.resultsContainer = document.getElementById('bounty-results');
        this.isScanning = false;

        this.init();
    }

    init() {
        if (this.scanButton) {
            this.scanButton.addEventListener('click', () => this.performScan());
        }
    }

    async performScan() {
        if (this.isScanning) return;

        this.isScanning = true;
        this.scanButton.disabled = true;
        this.scanButton.textContent = 'SCANNING...';
        this.scanStatus.textContent = 'Scanning hyperspace frequencies...';
        this.scanStatus.style.color = 'var(--imperial-yellow)';

        // Add scanning animation
        this.resultsContainer.classList.add('scanning');

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/bounty/scan`);
            const data = await response.json();

            if (data.success && data.data.targets) {
                await this.displayResults(data.data);
            } else {
                this.showError('Scan failed: No data received');
            }
        } catch (error) {
            this.showError(`Scan error: ${error.message}`);
        } finally {
            this.isScanning = false;
            this.scanButton.disabled = false;
            this.scanButton.textContent = 'INITIATE SCAN';
            this.resultsContainer.classList.remove('scanning');
        }
    }

    async displayResults(data) {
        const targets = data.targets;

        if (targets.length === 0) {
            this.scanStatus.textContent = 'No targets detected in range';
            this.scanStatus.style.color = 'var(--text-dim)';
            return;
        }

        this.scanStatus.textContent = `${targets.length} target(s) detected`;
        this.scanStatus.style.color = 'var(--imperial-red)';

        // Clear previous results
        this.resultsContainer.innerHTML = '';

        // Add each target with staggered animation
        for (let i = 0; i < targets.length; i++) {
            await this.addTargetCard(targets[i], i * 200);
        }
    }

    addTargetCard(target, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                const card = document.createElement('div');
                card.className = 'bounty-target fade-in';
                card.innerHTML = `
                    <div class="bounty-header">
                        <div class="bounty-name">${target.name}</div>
                        <div class="bounty-threat ${target.threat}">${target.threat}</div>
                    </div>
                    <div class="bounty-details">
                        <div class="bounty-detail"><strong>Species:</strong> ${target.species}</div>
                        <div class="bounty-detail"><strong>Last Seen:</strong> ${target.last_seen}</div>
                        <div class="bounty-detail"><strong>Coordinates:</strong> ${target.coordinates}</div>
                        <div class="bounty-detail"><strong>Distance:</strong> ${target.distance} parsecs</div>
                        <div class="bounty-detail"><strong>Confidence:</strong> ${target.scan_confidence}%</div>
                    </div>
                    <div class="bounty-reward">💰 Reward: ${target.reward.toLocaleString()} credits</div>
                `;

                this.resultsContainer.appendChild(card);
                resolve();
            }, delay);
        });
    }

    showError(message) {
        this.scanStatus.textContent = message;
        this.scanStatus.style.color = 'var(--imperial-red)';
        this.resultsContainer.innerHTML = `
            <div class="bounty-placeholder">
                <p>⚠ SCAN ERROR</p>
                <p class="small">${message}</p>
            </div>
        `;
    }
}

// Export for use in main app
window.BountyTracker = BountyTracker;
