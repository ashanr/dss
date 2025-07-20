// src/components/CountryAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './CountryAnalysis.css';

const CountryAnalysis = () => {
  const { 
    preferences, 
    countries, 
    analysisResults, 
    loading, 
    error,
    runAnalysis, 
    updatePreferences 
  } = useAnalysis();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const criteriaLabels = {
    costOfLiving: 'Cost of Living',
    universityRankings: 'University Rankings',
    languageBarrier: 'Language Barrier',
    visaProcess: 'Visa Process',
    jobProspects: 'Job Prospects',
    climateScore: 'Climate Score',
    safetyScore: 'Safety & Security'
  };

  const criteriaDescriptions = {
    costOfLiving: 'Lower costs are better (accommodation, food, transportation)',
    universityRankings: 'Higher rankings indicate better educational quality',
    languageBarrier: 'Lower barrier means easier communication',
    visaProcess: 'Simpler visa processes are preferable',
    jobProspects: 'Better job opportunities after graduation',
    climateScore: 'More favorable climate conditions',
    safetyScore: 'Higher safety and security levels'
  };

  const handlePreferenceChange = (criterion, value) => {
    const newPreferences = { ...localPreferences, [criterion]: parseInt(value) };
    setLocalPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
    setHasChanges(false);
  };

  const handleRunAnalysis = async () => {
    if (hasChanges) {
      updatePreferences(localPreferences);
      setHasChanges(false);
    }
    await runAnalysis(localPreferences);
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    if (score >= 0.4) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="country-analysis">
      {/* Preferences Section */}
      <section className="preferences-section">
        <div className="section-header">
          <h2>Customize Your Analysis Preferences</h2>
          <p>Adjust the importance weights for each criterion (1 = Low importance, 5 = High importance)</p>
        </div>

        <div className="preferences-grid">
          {Object.entries(criteriaLabels).map(([key, label]) => (
            <div key={key} className="preference-item">
              <div className="preference-header">
                <label htmlFor={key}>{label}</label>
                <span className="preference-value">{localPreferences[key]}</span>
              </div>
              
              <input
                type="range"
                id={key}
                min="1"
                max="5"
                value={localPreferences[key]}
                onChange={(e) => handlePreferenceChange(key, e.target.value)}
                className="preference-slider"
              />
              
              <div className="preference-labels">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
              
              <p className="preference-description">
                {criteriaDescriptions[key]}
              </p>
            </div>
          ))}
        </div>

        <div className="preferences-actions">
          {hasChanges && (
            <button 
              onClick={handleSavePreferences}
              className="btn btn-secondary"
            >
              Save Preferences
            </button>
          )}
          
          <button 
            onClick={handleRunAnalysis}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Running Analysis...' : 'Run Analysis'}
          </button>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="error-section">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {analysisResults.length > 0 && (
        <section className="results-section">
          <div className="section-header">
            <h2>Analysis Results</h2>
            <p>Countries ranked by their overall suitability based on your preferences</p>
          </div>

          <div className="results-grid">
            {analysisResults.map((country, index) => (
              <div key={country.name} className="result-card">
                <div className="result-header">
                  <div className="result-rank">#{index + 1}</div>
                  <div className="result-country">
                    <h3>{country.name}</h3>
                    <div className="result-flag">{country.flag || '🏳️'}</div>
                  </div>
                  <div 
                    className="result-score"
                    style={{ color: getScoreColor(country.totalScore) }}
                  >
                    {(country.totalScore * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="result-criteria">
                  {Object.entries(criteriaLabels).map(([key, label]) => (
                    <div key={key} className="criteria-item">
                      <span className="criteria-label">{label}</span>
                      <div className="criteria-bar">
                        <div 
                          className="criteria-fill"
                          style={{ 
                            width: `${(country.normalizedScores?.[key] || 0) * 100}%`,
                            backgroundColor: getScoreColor(country.normalizedScores?.[key] || 0)
                          }}
                        ></div>
                      </div>
                      <span className="criteria-value">
                        {((country.normalizedScores?.[key] || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="result-actions">
                  <button className="btn btn-outline">View Details</button>
                  <button className="btn btn-outline">Compare</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No Results Message */}
      {!loading && analysisResults.length === 0 && !error && (
        <section className="no-results">
          <div className="no-results-content">
            <div className="no-results-icon">📊</div>
            <h3>Ready to Start Your Analysis</h3>
            <p>Adjust your preferences above and click "Run Analysis" to see personalized country recommendations.</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default CountryAnalysis;
