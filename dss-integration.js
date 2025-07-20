// DSS API Integration
class DSSIntegration {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.sessionId = this.generateSessionId();
        this.countries = [];
        this.currentResults = null;
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async makeAPICall(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Load countries on initialization
    async loadCountries() {
        try {
            const response = await this.makeAPICall('/data/countries');
            if (response.success) {
                this.countries = response.countries;
                return this.countries;
            }
            throw new Error('Failed to load countries');
        } catch (error) {
            console.error('Error loading countries:', error);
            return [];
        }
    }

    // Perform decision analysis
    async analyzeDecision(weights) {
        try {
            this.showLoading('Analyzing your preferences...');
            
            const response = await this.makeAPICall('/decision/analyze', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: this.sessionId,
                    ...weights
                })
            });

            if (response.success) {
                this.currentResults = response;
                this.displayResults(response);
                return response;
            }
            throw new Error('Analysis failed');
        } catch (error) {
            this.showError('Analysis failed: ' + error.message);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Perform sensitivity analysis
    async performSensitivityAnalysis(weights) {
        try {
            this.showLoading('Performing sensitivity analysis...');
            
            const response = await this.makeAPICall('/sensitivity/analyze', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: this.sessionId,
                    ...weights
                })
            });

            if (response.success) {
                this.displaySensitivityResults(response);
                return response;
            }
            throw new Error('Sensitivity analysis failed');
        } catch (error) {
            this.showError('Sensitivity analysis failed: ' + error.message);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Save user preferences
    async savePreferences(weights) {
        try {
            await this.makeAPICall('/preferences', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: this.sessionId,
                    ...weights
                })
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    // Display analysis results
    displayResults(results) {
        const resultsContainer = document.getElementById('results') || this.createResultsContainer();
        
        let html = '<div class="dss-results">';
        html += '<h2>Your Personalized Country Rankings</h2>';
        
        if (results.results && results.results.length > 0) {
            html += '<div class="rankings-grid">';
            
            results.results.slice(0, 5).forEach((result, index) => {
                html += `
                    <div class="ranking-card rank-${result.rank}">
                        <div class="rank-badge">#${result.rank}</div>
                        <h3>${result.country}</h3>
                        <div class="score-info">
                            <div class="score">Score: ${result.score.toFixed(2)}</div>
                            <div class="percentage">${result.percentage}%</div>
                        </div>
                        <button onclick="dss.showCountryDetails('${result.country}')" class="details-btn">
                            View Details
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Add action buttons
            html += `
                <div class="analysis-actions">
                    <button onclick="dss.performSensitivityAnalysis(dss.getCurrentWeights())" class="btn secondary">
                        Sensitivity Analysis
                    </button>
                    <button onclick="dss.compareTopCountries()" class="btn secondary">
                        Compare Top 3
                    </button>
                    <button onclick="dss.downloadResults()" class="btn secondary">
                        Download Report
                    </button>
                </div>
            `;
        } else {
            html += '<p>No results available. Please check your preferences and try again.</p>';
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    }

    // Show country details
    showCountryDetails(countryName) {
        const country = this.countries.find(c => c.name === countryName);
        if (!country) return;

        const modal = this.createModal();
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                <h2>${country.name}</h2>
                <div class="country-details">
                    <div class="detail-item">
                        <span class="label">Cost of Living:</span>
                        <span class="value">${country.cost_of_living}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">University Ranking:</span>
                        <span class="value">${country.university_ranking}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Language Barrier:</span>
                        <span class="value">${country.language_barrier}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Visa Difficulty:</span>
                        <span class="value">${country.visa_difficulty}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Job Prospects:</span>
                        <span class="value">${country.job_prospects}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Climate Score:</span>
                        <span class="value">${country.climate_score}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Safety Index:</span>
                        <span class="value">${country.safety_index}/10</span>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'block';
    }

    // Get current weights from sliders
    getCurrentWeights() {
        return {
            cost_weight: parseFloat(document.getElementById('costSlider')?.value || 1),
            ranking_weight: parseFloat(document.getElementById('rankingSlider')?.value || 1),
            language_weight: parseFloat(document.getElementById('languageSlider')?.value || 1),
            visa_weight: parseFloat(document.getElementById('visaSlider')?.value || 1),
            job_weight: parseFloat(document.getElementById('jobSlider')?.value || 1),
            climate_weight: parseFloat(document.getElementById('climateSlider')?.value || 1),
            safety_weight: parseFloat(document.getElementById('safetySlider')?.value || 1)
        };
    }

    // UI Helper methods
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('dss-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'dss-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <span class="loader-text">${message}</span>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.querySelector('.loader-text').textContent = message;
        loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.getElementById('dss-loader');
        if (loader) loader.style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dss-error';
        errorDiv.innerHTML = `
            <span class="error-message">${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    createResultsContainer() {
        let container = document.getElementById('results');
        if (!container) {
            container = document.createElement('div');
            container.id = 'results';
            document.body.appendChild(container);
        }
        return container;
    }

    createModal() {
        let modal = document.getElementById('dss-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dss-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        return modal;
    }
}

// Initialize DSS Integration
const dss = new DSSIntegration();

// Load countries when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await dss.loadCountries();
    console.log('DSS Integration ready with', dss.countries.length, 'countries');
});

// Enhanced slider functionality
function updateSliderValues() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueDisplay = document.getElementById(slider.id + 'Value');
        if (valueDisplay) {
            valueDisplay.textContent = slider.value;
        }
    });
    
    // Auto-save preferences
    dss.savePreferences(dss.getCurrentWeights());
}

// Enhanced analysis function
async function startDecisionProcess() {
    try {
        const weights = dss.getCurrentWeights();
        await dss.analyzeDecision(weights);
    } catch (error) {
        console.error('Decision analysis failed:', error);
    }
}
