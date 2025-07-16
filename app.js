// Data from the application
const countriesData = [
    {
        name: "USA",
        cost_of_living: 1200,
        tuition_fees: 35000,
        university_ranking: 50,
        language_barrier: 5,
        visa_processing: 2,
        job_prospects: 5
    },
    {
        name: "UK",
        cost_of_living: 1100,
        tuition_fees: 25000,
        university_ranking: 45,
        language_barrier: 5,
        visa_processing: 3,
        job_prospects: 4
    },
    {
        name: "Canada",
        cost_of_living: 900,
        tuition_fees: 20000,
        university_ranking: 65,
        language_barrier: 5,
        visa_processing: 4,
        job_prospects: 4
    },
    {
        name: "Australia",
        cost_of_living: 1000,
        tuition_fees: 30000,
        university_ranking: 55,
        language_barrier: 5,
        visa_processing: 3,
        job_prospects: 4
    },
    {
        name: "Germany",
        cost_of_living: 800,
        tuition_fees: 500,
        university_ranking: 75,
        language_barrier: 2,
        visa_processing: 4,
        job_prospects: 3
    },
    {
        name: "Netherlands",
        cost_of_living: 1050,
        tuition_fees: 12000,
        university_ranking: 70,
        language_barrier: 3,
        visa_processing: 4,
        job_prospects: 4
    },
    {
        name: "Sweden",
        cost_of_living: 950,
        tuition_fees: 0,
        university_ranking: 80,
        language_barrier: 2,
        visa_processing: 4,
        job_prospects: 3
    },
    {
        name: "Singapore",
        cost_of_living: 1150,
        tuition_fees: 25000,
        university_ranking: 40,
        language_barrier: 5,
        visa_processing: 3,
        job_prospects: 4
    }
];

const criteriaInfo = {
    cost_of_living: {
        weight: 0.20,
        description: "Monthly living expenses (USD)",
        type: "cost",
        unit: "USD/month"
    },
    tuition_fees: {
        weight: 0.25,
        description: "Annual tuition fees (USD)",
        type: "cost",
        unit: "USD/year"
    },
    university_ranking: {
        weight: 0.15,
        description: "Average university ranking",
        type: "cost",
        unit: "rank"
    },
    language_barrier: {
        weight: 0.10,
        description: "Language support (1-5 scale)",
        type: "benefit",
        unit: "1-5"
    },
    visa_processing: {
        weight: 0.10,
        description: "Visa ease (1-5 scale)",
        type: "benefit",
        unit: "1-5"
    },
    job_prospects: {
        weight: 0.20,
        description: "Employment opportunities (1-5 scale)",
        type: "benefit",
        unit: "1-5"
    }
};

// Global variables
let currentWeights = {
    cost_of_living: 20,
    tuition_fees: 25,
    university_ranking: 15,
    language_barrier: 10,
    visa_processing: 10,
    job_prospects: 20
};

let rankedCountries = [];
let radarChart = null;
let sensitivityChart = null;

// Page navigation functions
function showPage(pageId) {
    console.log('Showing page:', pageId);
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('Page not found:', pageId);
    }
}

// Normalize values for SAW algorithm
function normalizeValue(value, type, criteriaValues) {
    if (type === 'cost') {
        // For cost criteria, lower is better (inverse normalization)
        const maxValue = Math.max(...criteriaValues);
        const minValue = Math.min(...criteriaValues);
        return maxValue === minValue ? 1 : (maxValue - value) / (maxValue - minValue);
    } else {
        // For benefit criteria, higher is better
        const maxValue = Math.max(...criteriaValues);
        const minValue = Math.min(...criteriaValues);
        return maxValue === minValue ? 1 : (value - minValue) / (maxValue - minValue);
    }
}

// Calculate SAW scores
function calculateSAWScores(weights) {
    const normalizedData = {};
    
    // Calculate normalized values for each criterion
    Object.keys(criteriaInfo).forEach(criterion => {
        const values = countriesData.map(country => country[criterion]);
        const type = criteriaInfo[criterion].type;
        
        normalizedData[criterion] = countriesData.map(country => 
            normalizeValue(country[criterion], type, values)
        );
    });
    
    // Calculate weighted scores
    const scores = countriesData.map((country, index) => {
        let totalScore = 0;
        
        Object.keys(criteriaInfo).forEach(criterion => {
            const weight = weights[criterion] / 100;
            const normalizedValue = normalizedData[criterion][index];
            totalScore += weight * normalizedValue;
        });
        
        return {
            ...country,
            score: totalScore
        };
    });
    
    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
}

// Update slider values display
function updateSliderDisplay() {
    Object.keys(currentWeights).forEach(key => {
        const slider = document.getElementById(key);
        const valueSpan = document.getElementById(key + '_value');
        if (slider && valueSpan) {
            slider.value = currentWeights[key];
            valueSpan.textContent = currentWeights[key] + '%';
        }
    });
    
    const total = Object.values(currentWeights).reduce((sum, weight) => sum + weight, 0);
    const totalWeightSpan = document.getElementById('totalWeight');
    if (totalWeightSpan) {
        totalWeightSpan.textContent = total + '%';
    }
}

// Handle slider changes
function handleSliderChange(criterionId, newValue) {
    const oldValue = currentWeights[criterionId];
    const difference = newValue - oldValue;
    
    // Update the changed criterion
    currentWeights[criterionId] = newValue;
    
    // Distribute the difference among other criteria
    if (difference !== 0) {
        const otherCriteria = Object.keys(currentWeights).filter(key => key !== criterionId);
        const redistributeAmount = -difference / otherCriteria.length;
        
        otherCriteria.forEach(key => {
            currentWeights[key] = Math.max(0, Math.min(50, currentWeights[key] + redistributeAmount));
        });
        
        // Ensure total is exactly 100
        const total = Object.values(currentWeights).reduce((sum, weight) => sum + weight, 0);
        if (total !== 100) {
            const adjustment = (100 - total) / otherCriteria.length;
            otherCriteria.forEach(key => {
                currentWeights[key] = Math.max(0, Math.min(50, currentWeights[key] + adjustment));
            });
        }
    }
    
    updateSliderDisplay();
}

// Display recommendations
function displayRecommendations() {
    rankedCountries = calculateSAWScores(currentWeights);
    const recommendationsList = document.getElementById('recommendationsList');
    
    if (!recommendationsList) return;
    
    recommendationsList.innerHTML = '';
    
    // Show top 5 countries
    rankedCountries.slice(0, 5).forEach((country, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        
        const scorePercentage = (country.score * 100).toFixed(1);
        
        card.innerHTML = `
            <div class="recommendation-header">
                <div class="recommendation-rank">
                    <div class="rank-badge">${index + 1}</div>
                    <div class="country-name">${country.name}</div>
                </div>
                <div class="recommendation-score">${scorePercentage}%</div>
            </div>
            <div class="score-bar">
                <div class="score-fill" style="width: ${scorePercentage}%"></div>
            </div>
        `;
        
        recommendationsList.appendChild(card);
    });
    
    // Update detailed table
    updateDetailedTable();
}

// Update detailed comparison table
function updateDetailedTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    rankedCountries.forEach((country) => {
        const row = document.createElement('tr');
        const scorePercentage = (country.score * 100).toFixed(1);
        
        row.innerHTML = `
            <td><strong>${country.name}</strong></td>
            <td><strong>${scorePercentage}%</strong></td>
            <td>$${country.cost_of_living.toLocaleString()}</td>
            <td>$${country.tuition_fees.toLocaleString()}</td>
            <td>${country.university_ranking}</td>
            <td>${country.language_barrier}/5</td>
            <td>${country.visa_processing}/5</td>
            <td>${country.job_prospects}/5</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Create radar chart for comparison
function createRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    if (radarChart) {
        radarChart.destroy();
    }
    
    const top3Countries = rankedCountries.slice(0, 3);
    const labels = ['Cost of Living', 'Tuition Fees', 'University Ranking', 'Language Barrier', 'Visa Processing', 'Job Prospects'];
    
    const datasets = top3Countries.map((country, index) => {
        const colors = ['#1FB8CD', '#FFC185', '#B4413C'];
        const color = colors[index];
        
        // Normalize values for radar chart (0-100 scale)
        const data = [
            Math.max(0, 100 - (country.cost_of_living / 15)), // Invert cost (lower is better)
            Math.max(0, 100 - (country.tuition_fees / 400)),  // Invert cost (lower is better)
            Math.max(0, 100 - country.university_ranking), // Invert ranking (lower rank number is better)
            country.language_barrier * 20,               // Convert 1-5 to 0-100
            country.visa_processing * 20,                // Convert 1-5 to 0-100
            country.job_prospects * 20                   // Convert 1-5 to 0-100
        ];
        
        return {
            label: country.name,
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: color
        };
    });
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update comparison table
function updateComparisonTable() {
    const top3Countries = rankedCountries.slice(0, 3);
    
    // Update headers
    top3Countries.forEach((country, index) => {
        const header = document.getElementById(`country${index + 1}Header`);
        if (header) {
            header.textContent = country.name;
        }
    });
    
    // Update table body
    const tableBody = document.getElementById('comparisonTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const criteria = [
        { key: 'cost_of_living', label: 'Cost of Living', unit: 'USD/month' },
        { key: 'tuition_fees', label: 'Tuition Fees', unit: 'USD/year' },
        { key: 'university_ranking', label: 'University Ranking', unit: 'rank' },
        { key: 'language_barrier', label: 'Language Barrier', unit: '1-5' },
        { key: 'visa_processing', label: 'Visa Processing', unit: '1-5' },
        { key: 'job_prospects', label: 'Job Prospects', unit: '1-5' }
    ];
    
    criteria.forEach(criterion => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${criterion.label}</strong></td>
            <td>${formatValue(top3Countries[0][criterion.key], criterion.unit)}</td>
            <td>${formatValue(top3Countries[1] ? top3Countries[1][criterion.key] : 'N/A', criterion.unit)}</td>
            <td>${formatValue(top3Countries[2] ? top3Countries[2][criterion.key] : 'N/A', criterion.unit)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Format values for display
function formatValue(value, unit) {
    if (value === 'N/A') return 'N/A';
    
    if (unit.includes('USD')) {
        return '$' + value.toLocaleString();
    } else if (unit === 'rank') {
        return value.toString();
    } else {
        return value + '/5';
    }
}

// Create sensitivity analysis chart
function createSensitivityChart(selectedCriterion) {
    const ctx = document.getElementById('sensitivityChart');
    if (!ctx) return;
    
    if (sensitivityChart) {
        sensitivityChart.destroy();
    }
    
    const weightValues = [0, 10, 20, 30, 40, 50];
    const datasets = [];
    
    // Calculate rankings for each weight value
    rankedCountries.slice(0, 5).forEach((country, index) => {
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];
        const color = colors[index];
        
        const rankData = weightValues.map(weight => {
            const testWeights = { ...currentWeights };
            testWeights[selectedCriterion] = weight;
            
            // Redistribute remaining weight proportionally
            const remainingWeight = 100 - weight;
            const otherCriteria = Object.keys(testWeights).filter(key => key !== selectedCriterion);
            const totalOtherWeight = otherCriteria.reduce((sum, key) => sum + currentWeights[key], 0);
            
            otherCriteria.forEach(key => {
                testWeights[key] = totalOtherWeight > 0 ? 
                    Math.round((currentWeights[key] / totalOtherWeight) * remainingWeight) : 
                    remainingWeight / otherCriteria.length;
            });
            
            const testRanking = calculateSAWScores(testWeights);
            const rank = testRanking.findIndex(c => c.name === country.name) + 1;
            return 6 - rank; // Invert for better visualization (higher is better)
        });
        
        datasets.push({
            label: country.name,
            data: rankData,
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.1
        });
    });
    
    sensitivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weightValues.map(w => w + '%'),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return 'Rank ' + (6 - value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Ranking Changes vs. ' + selectedCriterion.replace('_', ' ').toUpperCase() + ' Weight'
                }
            }
        }
    });
}

// Initialize the application
function initializeApp() {
    console.log('Initializing application...');
    
    // Navigation event listeners
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.onclick = function() {
            showPage('preferencesPage');
        };
    }
    
    const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
    if (backToWelcomeBtn) {
        backToWelcomeBtn.onclick = function() {
            showPage('welcomePage');
        };
    }
    
    const getRecommendationsBtn = document.getElementById('getRecommendationsBtn');
    if (getRecommendationsBtn) {
        getRecommendationsBtn.onclick = function() {
            displayRecommendations();
            showPage('resultsPage');
        };
    }
    
    const backToPreferencesBtn = document.getElementById('backToPreferencesBtn');
    if (backToPreferencesBtn) {
        backToPreferencesBtn.onclick = function() {
            showPage('preferencesPage');
        };
    }
    
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.onclick = function() {
            createRadarChart();
            updateComparisonTable();
            showPage('comparisonPage');
        };
    }
    
    const backToResultsBtn = document.getElementById('backToResultsBtn');
    if (backToResultsBtn) {
        backToResultsBtn.onclick = function() {
            showPage('resultsPage');
        };
    }
    
    const sensitivityBtn = document.getElementById('sensitivityBtn');
    if (sensitivityBtn) {
        sensitivityBtn.onclick = function() {
            const selectedCriterion = document.getElementById('sensitivityCriteria').value;
            createSensitivityChart(selectedCriterion);
            showPage('sensitivityPage');
        };
    }
    
    const backToResultsFromSensitivityBtn = document.getElementById('backToResultsFromSensitivityBtn');
    if (backToResultsFromSensitivityBtn) {
        backToResultsFromSensitivityBtn.onclick = function() {
            showPage('resultsPage');
        };
    }
    
    // Reset functionality
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.onclick = function() {
            currentWeights = {
                cost_of_living: 20,
                tuition_fees: 25,
                university_ranking: 15,
                language_barrier: 10,
                visa_processing: 10,
                job_prospects: 20
            };
            updateSliderDisplay();
            showPage('welcomePage');
        };
    }
    
    // Slider event listeners
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        slider.oninput = function() {
            handleSliderChange(this.id, parseInt(this.value));
        };
    });
    
    // Sensitivity analysis criterion change
    const sensitivityCriteria = document.getElementById('sensitivityCriteria');
    if (sensitivityCriteria) {
        sensitivityCriteria.onchange = function() {
            const sensitivityPage = document.getElementById('sensitivityPage');
            if (sensitivityPage && !sensitivityPage.classList.contains('hidden')) {
                createSensitivityChart(this.value);
            }
        };
    }
    
    // Initialize slider display
    updateSliderDisplay();
    
    console.log('Application initialized successfully');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}