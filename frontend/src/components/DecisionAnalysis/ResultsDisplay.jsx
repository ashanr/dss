import React, { useState } from 'react';

const ResultsDisplay = ({ results }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  const handleCountryClick = (country) => {
    setSelectedCountry(selectedCountry === country ? null : country);
  };

  return (
    <div className="results-display">
      <h3>Analysis Results</h3>
      
      <div className="top-recommendation">
        <h4>Top Recommendation</h4>
        {results.length > 0 && (
          <div className="top-country">
            <div className="country-name">{results[0].country}</div>
            <div className="country-score">
              Score: {results[0].score.toFixed(2)}
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${results[0].percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <h4>All Countries Ranked</h4>
      <div className="results-list">
        {results.map((result) => (
          <div 
            key={result.country} 
            className={`result-item ${selectedCountry === result.country ? 'selected' : ''}`}
            onClick={() => handleCountryClick(result.country)}
          >
            <div className="result-rank">{result.rank}</div>
            <div className="result-country">{result.country}</div>
            <div className="result-score">
              <span>{result.score.toFixed(2)}</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${result.percentage}%` }}
                ></div>
              </div>
            </div>
            
            {selectedCountry === result.country && result.criteria_scores && (
              <div className="criteria-breakdown">
                <h5>Criteria Breakdown</h5>
                <ul>
                  {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                    <li key={criterion}>
                      <span className="criterion-name">
                        {criterion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      <span className="criterion-score">{score.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;
