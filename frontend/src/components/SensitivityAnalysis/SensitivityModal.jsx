import React, { useState } from 'react';
import Modal from '../common/Modal';

const SensitivityModal = ({ results, onClose }) => {
  const [selectedCriterion, setSelectedCriterion] = useState(
    Object.keys(results.criterion_sensitivity)[0] || null
  );
  
  if (!results) return null;
  
  const { 
    baseline_analysis, 
    criterion_sensitivity, 
    overall_sensitivity, 
    recommendations 
  } = results;
  
  const formatCriterionName = (name) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  const renderCriterionDetails = () => {
    if (!selectedCriterion || !criterion_sensitivity[selectedCriterion]) {
      return <p>Select a criterion to see details</p>;
    }
    
    const criterionData = criterion_sensitivity[selectedCriterion];
    const variations = criterionData.variations || [];
    const metrics = criterionData.sensitivity_metrics || {};
    
    return (
      <div className="criterion-details">
        <h4>{formatCriterionName(selectedCriterion)} Sensitivity</h4>
        
        <div className="sensitivity-metrics">
          <div className="metric">
            <span className="metric-label">Stability Score:</span>
            <span className="metric-value">{metrics.stability_score.toFixed(1)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Average Ranking Changes:</span>
            <span className="metric-value">{metrics.average_ranking_changes.toFixed(2)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Top Country Change Frequency:</span>
            <span className="metric-value">{(metrics.top_country_change_frequency * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="variations-table">
          <h5>Weight Variations</h5>
          <table>
            <thead>
              <tr>
                <th>Variation</th>
                <th>New Weight</th>
                <th>Top Country</th>
                <th>Ranking Changes</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((variation, index) => (
                <tr key={index} className={variation.top_country_changed ? 'changed' : ''}>
                  <td>{variation.variation_percentage > 0 ? '+' : ''}{variation.variation_percentage}%</td>
                  <td>{variation.new_weight_value.toFixed(2)}</td>
                  <td>{variation.top_country}</td>
                  <td>{variation.ranking_changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <Modal title="Sensitivity Analysis Results" onClose={onClose}>
      <div className="sensitivity-results">
        <div className="overall-sensitivity">
          <h4>Overall Sensitivity</h4>
          <div className="overall-metrics">
            <div className="overall-metric">
              <span className="metric-name">Stability Score</span>
              <span className="metric-value">{overall_sensitivity.overall_stability_score.toFixed(1)}%</span>
              <div className="stability-bar">
                <div 
                  className="stability-fill" 
                  style={{ width: `${overall_sensitivity.overall_stability_score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="metric-details">
              <div className="metric-detail">
                <span>Most Sensitive:</span>
                <span>{formatCriterionName(overall_sensitivity.most_sensitive_criterion)}</span>
              </div>
              <div className="metric-detail">
                <span>Least Sensitive:</span>
                <span>{formatCriterionName(overall_sensitivity.least_sensitive_criterion)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="recommendations">
          <h4>Recommendations</h4>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
        
        <div className="criterion-selection">
          <h4>Criterion Sensitivity Details</h4>
          <div className="criterion-buttons">
            {Object.keys(criterion_sensitivity).map(criterion => (
              <button 
                key={criterion}
                onClick={() => setSelectedCriterion(criterion)}
                className={selectedCriterion === criterion ? 'selected' : ''}
              >
                {formatCriterionName(criterion)}
              </button>
            ))}
          </div>
          
          {renderCriterionDetails()}
        </div>
      </div>
    </Modal>
  );
};

export default SensitivityModal;
