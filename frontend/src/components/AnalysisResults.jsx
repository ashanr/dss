// src/components/AnalysisResults.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalysis } from '../contexts/AnalysisContext';
import './AnalysisResults.css';

const AnalysisResults = () => {
  const { analysisResults, preferences, loading } = useAnalysis();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const criteriaLabels = {
    costOfLiving: 'Cost of Living',
    universityRankings: 'University Rankings',
    languageBarrier: 'Language Barrier',
    visaProcess: 'Visa Process',
    jobProspects: 'Job Prospects',
    climateScore: 'Climate Score',
    safetyScore: 'Safety & Security'
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    if (score >= 0.4) return '#f97316';
    return '#ef4444';
  };

  const getScoreGrade = (score) => {
    if (score >= 0.9) return 'A+';
    if (score >= 0.8) return 'A';
    if (score >= 0.7) return 'B+';
    if (score >= 0.6) return 'B';
    if (score >= 0.5) return 'C+';
    if (score >= 0.4) return 'C';
    return 'D';
  };

  const exportResults = () => {
    const csvContent = [
      ['Rank', 'Country', 'Overall Score', ...Object.values(criteriaLabels)],
      ...analysisResults.map((country, index) => [
        index + 1,
        country.name,
        (country.totalScore * 100).toFixed(1) + '%',
        ...Object.keys(criteriaLabels).map(key => 
          ((country.normalizedScores?.[key] || 0) * 100).toFixed(1) + '%'
        )
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `country-analysis-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing countries based on your preferences...</p>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-content">
          <div className="no-results-icon">📊</div>
          <h2>No Analysis Results Available</h2>
          <p>Run a country analysis first to see your personalized recommendations.</p>
          <Link to="/analysis" className="btn btn-primary">
            Start Analysis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-results">
      {/* Results Header */}
      <section className="results-header">
        <div className="header-content">
          <h2>Your Country Analysis Results</h2>
          <p>
            Based on your preferences, here are the top-ranked countries for your study abroad journey.
          </p>
          
          <div className="results-meta">
            <span>📊 {analysisResults.length} countries analyzed</span>
            <span>⏰ Generated {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              🔳 Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📋 Table
            </button>
          </div>
          
          <button onClick={exportResults} className="btn btn-outline">
            📥 Export CSV
          </button>
        </div>
      </section>

      {/* Top 3 Recommendations */}
      <section className="top-recommendations">
        <h3>🏆 Your Top 3 Recommendations</h3>
        <div className="podium">
          {analysisResults.slice(0, 3).map((country, index) => (
            <div key={country.name} className={`podium-item rank-${index + 1}`}>
              <div className="podium-rank">#{index + 1}</div>
              <div className="podium-flag">{country.flag || '🏳️'}</div>
              <h4>{country.name}</h4>
              <div className="podium-score">
                {(country.totalScore * 100).toFixed(1)}%
              </div>
              <div className="podium-grade">
                Grade: {getScoreGrade(country.totalScore)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Results Display */}
      {viewMode === 'grid' ? (
        <section className="results-grid">
          <div className="countries-grid">
            {analysisResults.map((country, index) => (
              <div 
                key={country.name} 
                className="country-result-card"
                onClick={() => setSelectedCountry(country)}
              >
                <div className="card-header">
                  <div className="country-rank">#{index + 1}</div>
                  <div className="country-info">
                    <div className="country-flag">{country.flag || '🏳️'}</div>
                    <h3>{country.name}</h3>
                  </div>
                  <div 
                    className="overall-score"
                    style={{ color: getScoreColor(country.totalScore) }}
                  >
                    <span className="score-value">
                      {(country.totalScore * 100).toFixed(1)}%
                    </span>
                    <span className="score-grade">
                      {getScoreGrade(country.totalScore)}
                    </span>
                  </div>
                </div>

                <div className="criteria-breakdown">
                  {Object.entries(criteriaLabels).map(([key, label]) => {
                    const score = country.normalizedScores?.[key] || 0;
                    const preference = preferences[key] || 1;
                    
                    return (
                      <div key={key} className="criteria-row">
                        <div className="criteria-info">
                          <span className="criteria-name">{label}</span>
                          <span className="preference-weight">
                            Weight: {preference}/5
                          </span>
                        </div>
                        <div className="criteria-bar">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${score * 100}%`,
                              backgroundColor: getScoreColor(score)
                            }}
                          ></div>
                        </div>
                        <span className="criteria-score">
                          {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="card-footer">
                  <button className="view-details-btn">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="results-table">
          <div className="table-container">
            <table className="results-data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Country</th>
                  <th>Overall Score</th>
                  <th>Grade</th>
                  {Object.values(criteriaLabels).map(label => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysisResults.map((country, index) => (
                  <tr key={country.name}>
                    <td className="rank-cell">#{index + 1}</td>
                    <td className="country-cell">
                      <span className="country-flag">{country.flag || '🏳️'}</span>
                      <span className="country-name">{country.name}</span>
                    </td>
                    <td 
                      className="score-cell"
                      style={{ color: getScoreColor(country.totalScore) }}
                    >
                      {(country.totalScore * 100).toFixed(1)}%
                    </td>
                    <td className="grade-cell">
                      <span 
                        className="grade-badge"
                        style={{ backgroundColor: getScoreColor(country.totalScore) }}
                      >
                        {getScoreGrade(country.totalScore)}
                      </span>
                    </td>
                    {Object.keys(criteriaLabels).map(key => {
                      const score = country.normalizedScores?.[key] || 0;
                      return (
                        <td key={key} className="criteria-cell">
                          <span 
                            className="criteria-value"
                            style={{ color: getScoreColor(score) }}
                          >
                            {(score * 100).toFixed(0)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Country Detail Modal */}
      {selectedCountry && (
        <div className="country-modal-overlay" onClick={() => setSelectedCountry(null)}>
          <div className="country-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-country-info">
                <span className="modal-flag">{selectedCountry.flag || '🏳️'}</span>
                <h3>{selectedCountry.name}</h3>
              </div>
              <button 
                className="modal-close"
                onClick={() => setSelectedCountry(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-score-section">
                <h4>Overall Performance</h4>
                <div className="modal-overall-score">
                  <span 
                    className="big-score"
                    style={{ color: getScoreColor(selectedCountry.totalScore) }}
                  >
                    {(selectedCountry.totalScore * 100).toFixed(1)}%
                  </span>
                  <span className="score-grade">
                    Grade: {getScoreGrade(selectedCountry.totalScore)}
                  </span>
                </div>
              </div>

              <div className="modal-criteria-section">
                <h4>Detailed Breakdown</h4>
                <div className="modal-criteria-list">
                  {Object.entries(criteriaLabels).map(([key, label]) => {
                    const score = selectedCountry.normalizedScores?.[key] || 0;
                    const preference = preferences[key] || 1;
                    
                    return (
                      <div key={key} className="modal-criteria-item">
                        <div className="criteria-header">
                          <span className="criteria-label">{label}</span>
                          <span className="criteria-score-text">
                            {(score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="criteria-details">
                          <div className="criteria-bar-container">
                            <div 
                              className="criteria-bar-fill"
                              style={{ 
                                width: `${score * 100}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                          </div>
                          <span className="preference-indicator">
                            Your preference weight: {preference}/5
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <Link 
                to="/comparison" 
                className="btn btn-outline"
                onClick={() => setSelectedCountry(null)}
              >
                Compare Countries
              </Link>
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedCountry(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <section className="analysis-summary">
        <h3>Analysis Summary</h3>
        <div className="summary-stats">
          <div className="stat-card">
            <h4>Your Preferences</h4>
            <div className="preference-list">
              {Object.entries(preferences)
                .sort(([,a], [,b]) => b - a)
                .map(([key, value]) => (
                  <div key={key} className="preference-item">
                    <span className="pref-name">{criteriaLabels[key]}</span>
                    <span className="pref-value">{value}/5</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="stat-card">
            <h4>Score Distribution</h4>
            <div className="score-distribution">
              <div className="score-range">
                <span className="range-label">Excellent (80-100%)</span>
                <span className="range-count">
                  {analysisResults.filter(c => c.totalScore >= 0.8).length} countries
                </span>
              </div>
              <div className="score-range">
                <span className="range-label">Good (60-79%)</span>
                <span className="range-count">
                  {analysisResults.filter(c => c.totalScore >= 0.6 && c.totalScore < 0.8).length} countries
                </span>
              </div>
              <div className="score-range">
                <span className="range-label">Fair (40-59%)</span>
                <span className="range-count">
                  {analysisResults.filter(c => c.totalScore >= 0.4 && c.totalScore < 0.6).length} countries
                </span>
              </div>
              <div className="score-range">
                <span className="range-label">Poor (0-39%)</span>
                <span className="range-count">
                  {analysisResults.filter(c => c.totalScore < 0.4).length} countries
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisResults;
