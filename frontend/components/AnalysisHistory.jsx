// src/components/AnalysisHistory.jsx
import React, { useState } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './AnalysisHistory.css';

const AnalysisHistory = () => {
  const { analysisHistory } = useAnalysis();
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'countries'

  const criteriaLabels = {
    costOfLiving: 'Cost of Living',
    universityRankings: 'University Rankings',
    languageBarrier: 'Language Barrier',
    visaProcess: 'Visa Process',
    jobProspects: 'Job Prospects',
    climateScore: 'Climate Score',
    safetyScore: 'Safety & Security'
  };

  const sortedHistory = [...analysisHistory].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else {
      return (b.results?.length || 0) - (a.results?.length || 0);
    }
  });

  const getPreferenceProfile = (preferences) => {
    const topPreferences = Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([key]) => criteriaLabels[key]);
    
    return topPreferences.join(' + ');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const exportAnalysis = (analysis) => {
    const csvContent = [
      ['Rank', 'Country', 'Overall Score', ...Object.values(criteriaLabels)],
      ...analysis.results.map((country, index) => [
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
    a.download = `analysis-${formatDate(analysis.timestamp).date.replace(/\//g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (analysisHistory.length === 0) {
    return (
      <div className="no-history">
        <div className="no-history-content">
          <div className="no-history-icon">📚</div>
          <h2>No Analysis History</h2>
          <p>Your analysis history will appear here once you start running country analyses.</p>
          <button className="btn btn-primary">
            Run Your First Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-history">
      {/* Header */}
      <section className="history-header">
        <div className="header-content">
          <h2>Analysis History</h2>
          <p>Track your decision-making journey and compare different preference settings over time.</p>
        </div>
        
        <div className="header-controls">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Date (Newest First)</option>
              <option value="countries">Number of Countries</option>
            </select>
          </div>
          
          <div className="history-stats">
            <span>📊 {analysisHistory.length} total analyses</span>
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="history-timeline">
        <div className="timeline-container">
          {sortedHistory.map((analysis, index) => {
            const dateInfo = formatDate(analysis.timestamp);
            const topCountries = analysis.results?.slice(0, 3) || [];
            const preferenceProfile = getPreferenceProfile(analysis.preferences);

            return (
              <div key={analysis.id} className="timeline-item">
                <div className="timeline-marker">
                  <span className="timeline-number">{index + 1}</span>
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-card">
                    <div className="card-header">
                      <div className="analysis-info">
                        <h3>Analysis #{analysisHistory.length - index}</h3>
                        <div className="analysis-meta">
                          <span className="analysis-date">
                            📅 {dateInfo.date} at {dateInfo.time}
                          </span>
                          <span className="analysis-countries">
                            🌍 {analysis.results?.length || 0} countries analyzed
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-actions">
                        <button 
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="btn btn-outline btn-sm"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => exportAnalysis(analysis)}
                          className="btn btn-outline btn-sm"
                        >
                          📥 Export
                        </button>
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="preferences-summary">
                        <h4>Focus Areas</h4>
                        <p className="preference-profile">{preferenceProfile}</p>
                        <div className="preference-bars">
                          {Object.entries(analysis.preferences).map(([key, value]) => (
                            <div key={key} className="mini-preference">
                              <span className="pref-label">{criteriaLabels[key]}</span>
                              <div className="pref-bar">
                                <div 
                                  className="pref-fill"
                                  style={{ width: `${(value / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="pref-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {topCountries.length > 0 && (
                        <div className="top-results">
                          <h4>Top Results</h4>
                          <div className="mini-results">
                            {topCountries.map((country, idx) => (
                              <div key={country.name} className="mini-result">
                                <span className="mini-rank">#{idx + 1}</span>
                                <span className="mini-flag">{country.flag || '🏳️'}</span>
                                <span className="mini-name">{country.name}</span>
                                <span className="mini-score">
                                  {(country.totalScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="analysis-modal-overlay" onClick={() => setSelectedAnalysis(null)}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>Analysis Details</h3>
                <p>{formatDate(selectedAnalysis.timestamp).date} at {formatDate(selectedAnalysis.timestamp).time}</p>
              </div>
              <button 
                className="modal-close"
                onClick={() => setSelectedAnalysis(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Preferences Used */}
              <div className="modal-section">
                <h4>Preferences Used</h4>
                <div className="preferences-grid">
                  {Object.entries(selectedAnalysis.preferences).map(([key, value]) => (
                    <div key={key} className="preference-detail">
                      <span className="pref-name">{criteriaLabels[key]}</span>
                      <div className="pref-visual">
                        <div className="pref-bar-full">
                          <div 
                            className="pref-fill-full"
                            style={{ width: `${(value / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="pref-value-full">{value}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="modal-section">
                <h4>Complete Results ({selectedAnalysis.results?.length || 0} countries)</h4>
                <div className="modal-results-table">
                  <div className="results-header">
                    <span>Rank</span>
                    <span>Country</span>
                    <span>Score</span>
                    <span>Grade</span>
                  </div>
                  <div className="results-body">
                    {(selectedAnalysis.results || []).map((country, index) => (
                      <div key={country.name} className="result-row">
                        <span className="result-rank">#{index + 1}</span>
                        <span className="result-country">
                          <span className="country-flag">{country.flag || '🏳️'}</span>
                          {country.name}
                        </span>
                        <span className="result-score">
                          {(country.totalScore * 100).toFixed(1)}%
                        </span>
                        <span className="result-grade">
                          {country.totalScore >= 0.9 ? 'A+' : 
                           country.totalScore >= 0.8 ? 'A' : 
                           country.totalScore >= 0.7 ? 'B+' : 
                           country.totalScore >= 0.6 ? 'B' : 'C+'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => exportAnalysis(selectedAnalysis)}
                className="btn btn-outline"
              >
                📥 Export Results
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedAnalysis(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Statistics */}
      <section className="history-stats">
        <h3>Your Analysis Journey</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>{analysisHistory.length}</h4>
              <p>Total Analyses</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>
                {analysisHistory.length > 0 ? 
                  Math.ceil((new Date() - new Date(analysisHistory[analysisHistory.length - 1].timestamp)) / (1000 * 60 * 60 * 24)) : 
                  0}
              </h4>
              <p>Days Since First Analysis</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-content">
              <h4>
                {analysisHistory.reduce((sum, analysis) => sum + (analysis.results?.length || 0), 0) / analysisHistory.length || 0}
              </h4>
              <p>Avg Countries Per Analysis</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h4>
                {analysisHistory.length > 0 && analysisHistory[0].results?.length > 0 ? 
                  analysisHistory[0].results[0].name : 
                  'None'}
              </h4>
              <p>Latest Top Choice</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisHistory;
