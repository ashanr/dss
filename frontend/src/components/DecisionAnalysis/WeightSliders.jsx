import React from 'react';

const WeightSliders = ({ weights, onChange }) => {
  const criteria = [
    { id: 'cost_weight', label: 'Cost of Living', description: 'Lower values are preferred' },
    { id: 'ranking_weight', label: 'University Rankings', description: 'Higher values are preferred' },
    { id: 'language_weight', label: 'Language Barrier', description: 'Lower values are preferred' },
    { id: 'visa_weight', label: 'Visa Difficulty', description: 'Lower values are preferred' },
    { id: 'job_weight', label: 'Job Prospects', description: 'Higher values are preferred' },
    { id: 'climate_weight', label: 'Climate Score', description: 'Higher values are preferred' },
    { id: 'safety_weight', label: 'Safety Index', description: 'Higher values are preferred' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, parseFloat(value));
  };

  return (
    <div className="weight-sliders">
      <h3>Criteria Weights</h3>
      <div className="criteria-description">
        <p>Adjust the sliders to set how important each criterion is to you (0-10)</p>
      </div>
      
      {criteria.map((criterion) => (
        <div key={criterion.id} className="slider-container">
          <div className="slider-label">
            <label htmlFor={criterion.id}>{criterion.label}</label>
            <span className="weight-value">{weights[criterion.id]}</span>
          </div>
          <div className="slider-description">{criterion.description}</div>
          <input
            type="range"
            id={criterion.id}
            name={criterion.id}
            min="0"
            max="10"
            step="0.1"
            value={weights[criterion.id]}
            onChange={handleChange}
            className="weight-slider"
          />
          <div className="slider-range">
            <span>Less Important</span>
            <span>More Important</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeightSliders;
