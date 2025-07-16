/**
 * Dashboard JavaScript for Student Migration DSS
 * Handles analytics, charts, and data visualization
 */

// Dashboard configuration
const DASHBOARD_CONFIG = {
    apiBaseUrl: '/api/v1',
    refreshInterval: 30000, // 30 seconds
    chartColors: {
        primary: '#007bff',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8'
    }
};

// Global variables
let dashboardData = {};
let refreshTimer = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();
});

/**
 * Initialize the dashboard
 */
function initializeDashboard() {
    showLoadingSpinner();
    loadDashboardData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter change handlers
    document.getElementById('dateRange').addEventListener('change', updateDashboard);
    document.getElementById('countryFilter').addEventListener('change', updateDashboard);
    document.getElementById('metricType').addEventListener('change', updateDashboard);
    
    // Refresh button
    document.querySelector('[onclick="refreshDashboard()"]').addEventListener('click', refreshDashboard);
}

/**
 * Load dashboard data from API
 */
async function loadDashboardData() {
    try {
        const filters = getCurrentFilters();
        const response = await fetch(`${DASHBOARD_CONFIG.apiBaseUrl}/dashboard/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        dashboardData = await response.json();
        renderDashboard();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Failed to load dashboard data. Please try again.');
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Get current filter values
 */
function getCurrentFilters() {
    return {
        dateRange: document.getElementById('dateRange').value,
        country: document.getElementById('countryFilter').value,
        metricType: document.getElementById('metricType').value
    };
}

/**
 * Render the entire dashboard
 */
function renderDashboard() {
    updateKPICards();
    updateQuickStats();
    renderCountryChart();
    renderSuccessRateChart();
    renderTrendChart();
    updateActivityTable();
}

/**
 * Update KPI cards
 */
function updateKPICards() {
    const data = dashboardData.kpis || {};
    
    document.getElementById('totalApplications').textContent = data.totalApplications || 0;
    document.getElementById('successfulApplications').textContent = data.successfulApplications || 0;
    document.getElementById('avgProcessingTime').textContent = `${data.avgProcessingTime || 0} days`;
    document.getElementById('activeUsers').textContent = data.activeUsers || 0;
}

/**
 * Update quick stats sidebar
 */
function updateQuickStats() {
    const data = dashboardData.quickStats || {};
    
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('successRate').textContent = `${data.successRate || 0}%`;
    document.getElementById('avgSatisfaction').textContent = (data.avgSatisfaction || 0).toFixed(1);
}

/**
 * Render country applications chart
 */
function renderCountryChart() {
    const data = dashboardData.countryData || [];
    
    const trace = {
        x: data.map(d => d.country),
        y: data.map(d => d.applications),
        type: 'bar',
        marker: {
            color: DASHBOARD_CONFIG.chartColors.primary
        }
    };
    
    const layout = {
        title: '',
        xaxis: { title: 'Country' },
        yaxis: { title: 'Applications' },
        margin: { t: 30, b: 50, l: 50, r: 30 }
    };
    
    Plotly.newPlot('countryChart', [trace], layout, {responsive: true});
}

/**
 * Render success rate pie chart
 */
function renderSuccessRateChart() {
    const data = dashboardData.successRateData || [];
    
    const trace = {
        labels: data.map(d => d.country),
        values: data.map(d => d.successRate),
        type: 'pie',
        marker: {
            colors: [
                DASHBOARD_CONFIG.chartColors.success,
                DASHBOARD_CONFIG.chartColors.warning,
                DASHBOARD_CONFIG.chartColors.info,
                DASHBOARD_CONFIG.chartColors.primary,
                DASHBOARD_CONFIG.chartColors.danger
            ]
        }
    };
    
    const layout = {
        title: '',
        margin: { t: 30, b: 30, l: 30, r: 30 }
    };
    
    Plotly.newPlot('successRateChart', [trace], layout, {responsive: true});
}

/**
 * Render trend chart
 */
function renderTrendChart() {
    const data = dashboardData.trendData || [];
    
    const trace1 = {
        x: data.map(d => d.date),
        y: data.map(d => d.applications),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Applications',
        line: { color: DASHBOARD_CONFIG.chartColors.primary }
    };
    
    const trace2 = {
        x: data.map(d => d.date),
        y: data.map(d => d.successRate),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Success Rate (%)',
        yaxis: 'y2',
        line: { color: DASHBOARD_CONFIG.chartColors.success }
    };
    
    const layout = {
        title: '',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Applications' },
        yaxis2: {
            title: 'Success Rate (%)',
            overlaying: 'y',
            side: 'right'
        },
        margin: { t: 30, b: 50, l: 50, r: 50 }
    };
    
    Plotly.newPlot('trendChart', [trace1, trace2], layout, {responsive: true});
}

/**
 * Update activity table
 */
function updateActivityTable() {
    const data = dashboardData.recentActivity || [];
    const tbody = document.getElementById('activityTableBody');
    
    tbody.innerHTML = '';
    
    data.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.studentId}</td>
            <td>${activity.country}</td>
            <td>${formatDate(activity.applicationDate)}</td>
            <td>
                <span class="badge bg-${getStatusColor(activity.status)}">
                    ${activity.status}
                </span>
            </td>
            <td>${activity.successRate}%</td>
            <td>${activity.satisfaction}/5</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewDetails('${activity.studentId}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Get status color for badges
 */
function getStatusColor(status) {
    const colors = {
        'Completed': 'success',
        'In Progress': 'warning',
        'Failed': 'danger',
        'Pending': 'info'
    };
    return colors[status] || 'secondary';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Update dashboard with current filters
 */
function updateDashboard() {
    showLoadingSpinner();
    loadDashboardData();
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
    showLoadingSpinner();
    loadDashboardData();
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    refreshTimer = setInterval(() => {
        loadDashboardData();
    }, DASHBOARD_CONFIG.refreshInterval);
}

/**
 * Export dashboard data
 */
async function exportData() {
    try {
        const filters = getCurrentFilters();
        const response = await fetch(`${DASHBOARD_CONFIG.apiBaseUrl}/dashboard/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showErrorMessage('Failed to export data. Please try again.');
    }
}

/**
 * Download activity table as CSV
 */
function downloadTable() {
    const table = document.getElementById('activityTable');
    let csv = '';
    
    // Get headers
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    csv += headers.join(',') + '\n';
    
    // Get data rows
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => {
            // Clean up the cell content
            return td.textContent.trim().replace(/,/g, ';');
        });
        csv += cells.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_table_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * View student details
 */
function viewDetails(studentId) {
    // This would typically open a modal or navigate to a detail page
    alert(`View details for student: ${studentId}`);
}

/**
 * Show loading spinner
 */
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container-fluid').insertBefore(alertDiv, document.querySelector('.row'));
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

/**
 * Initialize sample data for testing
 */
function initializeSampleData() {
    dashboardData = {
        kpis: {
            totalApplications: 1250,
            successfulApplications: 892,
            avgProcessingTime: 18,
            activeUsers: 145
        },
        quickStats: {
            totalUsers: 1000,
            successRate: 71.4,
            avgSatisfaction: 4.2
        },
        countryData: [
            { country: 'Canada', applications: 350 },
            { country: 'USA', applications: 280 },
            { country: 'UK', applications: 220 },
            { country: 'Australia', applications: 200 },
            { country: 'Germany', applications: 200 }
        ],
        successRateData: [
            { country: 'Canada', successRate: 85 },
            { country: 'USA', successRate: 72 },
            { country: 'UK', successRate: 68 },
            { country: 'Australia', successRate: 78 },
            { country: 'Germany', successRate: 82 }
        ],
        trendData: [
            { date: '2024-01-01', applications: 45, successRate: 68 },
            { date: '2024-01-02', applications: 52, successRate: 71 },
            { date: '2024-01-03', applications: 38, successRate: 69 },
            { date: '2024-01-04', applications: 61, successRate: 74 },
            { date: '2024-01-05', applications: 47, successRate: 72 }
        ],
        recentActivity: [
            {
                studentId: 'STU001',
                country: 'Canada',
                applicationDate: '2024-01-15',
                status: 'Completed',
                successRate: 85,
                satisfaction: 4.5
            },
            {
                studentId: 'STU002',
                country: 'USA',
                applicationDate: '2024-01-14',
                status: 'In Progress',
                successRate: 72,
                satisfaction: 4.0
            }
        ]
    };
}

// Use sample data if API is not available
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // For local development, use sample data
    document.addEventListener('DOMContentLoaded', function() {
        initializeSampleData();
        setTimeout(renderDashboard, 100);
    });
}