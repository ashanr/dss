// src/components/DashboardHome.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnalysis } from '../contexts/AnalysisContext';
import './DashboardHome.css';

const DashboardHome = () => {
  const { 
    analysisResults, 
    analysisHistory, 
    countries, 
    preferences,
    runAnalysis 
  } = useAnalysis();

  const quickStats = {
    totalAnalyses: analysisHistory.length,
    countriesEvaluated: countries.length,
    topCountry: analysisResults.length > 0 ? analysisResults[0]?.name : 'None',
    lastAnalysis: analysisHistory.length > 0 ? 
      new Date(analysisHistory[0].timestamp).toLocaleDateString() : 'Never'
  };

  const handleQuickAnalysis = () => {
    runAnalysis(preferences);
  };

  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome to Your Migration Decision Support System</h2>
          <p>Make informed decisions about your study abroad destination using our advanced multi-criteria analysis.</p>
          
          <div className="quick-actions">
            <button 
              className="btn btn-primary"
              onClick={handleQuickAnalysis}
            >
              🚀 Start New Analysis
            </button>
            <Link to="/comparison" className="btn btn-secondary">
              ⚖️ Compare Countries
            </Link>
          </div>
        </div>
        
        <div className="welcome-visual">
          <div className="stats-preview">
            <div className="stat-card">
              <span className="stat-number">{countries.length}</span>
              <span className="stat-label">Countries Available</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">7</span>
              <span className="stat-label">Analysis Criteria</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <h3>Your Analysis Overview</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-value">{quickStats.totalAnalyses}</span>
              <span className="stat-title">Total Analyses</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🌍</div>
            <div className="stat-info">
              <span className="stat-value">{quickStats.countriesEvaluated}</span>
              <span className="stat-title">Countries Evaluated</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="stat-value">{quickStats.topCountry}</span>
              <span className="stat-title">Top Recommendation</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-value">{quickStats.lastAnalysis}</span>
              <span className="stat-title">Last Analysis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="navigation-section">
        <h3>Explore System Features</h3>
        <div className="nav-cards-grid">
          <Link to="/analysis" className="nav-card">
            <div className="card-icon">📊</div>
            <h4>Country Analysis</h4>
            <p>Run comprehensive analysis using our SAW algorithm to find your ideal study destination.</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/comparison" className="nav-card">
            <div className="card-icon">⚖️</div>
            <h4>Country Comparison</h4>
            <p>Compare multiple countries side-by-side across all evaluation criteria.</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/preferences" className="nav-card">
            <div className="card-icon">⚙️</div>
            <h4>Preferences</h4>
            <p>Customize your analysis by adjusting the importance weights for each criterion.</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/results" className="nav-card">
            <div className="card-icon">📋</div>
            <h4>Analysis Results</h4>
            <p>View detailed results from your latest country analysis with scores and rankings.</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/history" className="nav-card">
            <div className="card-icon">📚</div>
            <h4>Analysis History</h4>
            <p>Browse through your previous analyses and track how your preferences have evolved.</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/profile" className="nav-card">
            <div className="card-icon">👤</div>
            <h4>Profile Settings</h4>
            <p>Manage your personal information and system preferences.</p>
            <span className="card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      {analysisHistory.length > 0 && (
        <section className="recent-activity">
          <h3>Recent Analysis Activity</h3>
          <div className="activity-list">
            {analysisHistory.slice(0, 3).map((analysis, index) => (
              <div key={analysis.id} className="activity-item">
                <div className="activity-icon">📊</div>
                <div className="activity-content">
                  <p className="activity-title">
                    Analysis completed with {analysis.results?.length || 0} countries evaluated
                  </p>
                  <p className="activity-date">
                    {new Date(analysis.timestamp).toLocaleDateString()} at {new Date(analysis.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Link to="/results" className="activity-link">View</Link>
              </div>
            ))}
          </div>
          
          {analysisHistory.length > 3 && (
            <Link to="/history" className="view-all-link">
              View All History ({analysisHistory.length} total)
            </Link>
          )}
        </section>
      )}
    </div>
  );
};

export default DashboardHome;
