// src/components/CountryComparison.jsx
import React, { useState } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './CountryComparison.css';

const CountryComparison = () => {
  const { countries, analysisResults } = useAnalysis();
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  const criteriaLabels = {
    costOfLiving: 'Cost of Living',
    universityRankings: 'University Rankings',
    languageBarrier: 'Language Barrier',
    visaProcess: 'Visa Process',
    jobProspects: 'Job Prospects',
    climateScore: 'Climate Score',
    safetyScore: 'Safety & Security'
  };

  const handleCountrySelect = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      setSelectedCountries(selectedCountries.filter(name => name !== countryName));
    } else if (selectedCountries.length < 4) {
      setSelectedCountries([...selectedCountries, countryName]);
    }
  };

  const getComparisonData = () => {
    return selectedCountries.map(countryName => {
      const resultData = analysisResults.find(r => r.name === countryName);
      const countryData = countries.find(c => c.name === countryName);
      
      return {
        name: countryName,
        flag: countryData?.flag || '🏳️',
        totalScore: resultData?.totalScore || 0,
        scores: resultData?.normalizedScores || {},
        rawData: countryData || {}
      };
    });
  };

  const getBestInCategory = (criterion) => {
    const data = getComparisonData();
    if (data.length === 0) return null;
    
    return data.reduce((best, country) => 
      (country.scores[criterion] || 0) > (best.scores[criterion] || 0) ? country : best
    );
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    if (score >= 0.4) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="country-comparison">
      {/* Country Selection */}
      <section className="selection-section">
        <div className="section-header">
          <h2>Select Countries to Compare</h2>
          <p>Choose up to 4 countries for detailed comparison (Selected: {selectedCountries.length}/4)</p>
        </div>

        <div className="country-grid">
          {analysisResults.length > 0 ? analysisResults.map((country, index) => (
            <div 
              key={country.name}
              className={`country-card ${selectedCountries.includes(country.name) ? 'selected' : ''}`}
              onClick={() => handleCountrySelect(country.name)}
            >
              <div className="country-rank">#{index + 1}</div>
              <div className="country-flag">{country.flag || '🏳️'}</div>
              <h3>{country.name}</h3>
              <div className="country-score">
                {(country.totalScore * 100).toFixed(1)}%
              </div>
              {selectedCountries.includes(country.name) && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          )) : (
            <div className="no-data-message">
              <p>Run an analysis first to compare countries</p>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Results */}
      {selectedCountries.length > 1 && (
        <section className="comparison-section">
          <div className="section-header">
            <h2>Detailed Comparison</h2>
            <p>Side-by-side analysis of selected countries</p>
          </div>

          {/* Overall Scores */}
          <div className="overall-comparison">
            <h3>Overall Scores</h3>
            <div className="score-bars">
              {getComparisonData().map(country => (
                <div key={country.name} className="score-bar-item">
                  <div className="score-info">
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                    <span className="score-value">
                      {(country.totalScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="score-bar">
                    <div 
                      className="score-fill"
                      style={{ 
                        width: `${country.totalScore * 100}%`,
                        backgroundColor: getScoreColor(country.totalScore)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Criteria Comparison */}
          <div className="criteria-comparison">
            <h3>Criteria Breakdown</h3>
            <div className="comparison-table">
              <div className="table-header">
                <div className="criteria-column">Criterion</div>
                {getComparisonData().map(country => (
                  <div key={country.name} className="country-column">
                    <span className="country-flag">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                ))}
              </div>

              {Object.entries(criteriaLabels).map(([key, label]) => {
                const bestCountry = getBestInCategory(key);
                
                return (
                  <div key={key} className="table-row">
                    <div className="criteria-column">
                      <strong>{label}</strong>
                    </div>
                    {getComparisonData().map(country => {
                      const score = country.scores[key] || 0;
                      const isBest = bestCountry && country.name === bestCountry.name;
                      
                      return (
                        <div 
                          key={country.name} 
                          className={`country-column ${isBest ? 'best-score' : ''}`}
                        >
                          <div className="score-cell">
                            <div 
                              className="mini-bar"
                              style={{ 
                                width: `${score * 100}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                            <span className="score-text">
                              {(score * 100).toFixed(0)}%
                            </span>
                            {isBest && <span className="best-indicator">👑</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="comparison-summary">
            <h3>Comparison Summary</h3>
            <div className="summary-grid">
              {getComparisonData().map(country => (
                <div key={country.name} className="summary-card">
                  <div className="summary-header">
                    <span className="country-flag">{country.flag}</span>
                    <h4>{country.name}</h4>
                  </div>
                  
                  <div className="summary-score">
                    Overall Score: {(country.totalScore * 100).toFixed(1)}%
                  </div>

                  <div className="strengths">
                    <h5>Top Strengths:</h5>
                    <ul>
                      {Object.entries(country.scores)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([criterion, score]) => (
                          <li key={criterion}>
                            {criteriaLabels[criterion]}: {(score * 100).toFixed(0)}%
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Selection Guide */}
      {selectedCountries.length === 0 && (
        <section className="guide-section">
          <div className="guide-content">
            <h3>How to Use Country Comparison</h3>
            <div className="guide-steps">
              <div className="guide-step">
                <span className="step-number">1</span>
                <p>Run a country analysis first to generate rankings</p>
              </div>
              <div className="guide-step">
                <span className="step-number">2</span>
                <p>Select 2-4 countries you want to compare in detail</p>
              </div>
              <div className="guide-step">
                <span className="step-number">3</span>
                <p>Review the detailed comparison table and summary</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CountryComparison;
