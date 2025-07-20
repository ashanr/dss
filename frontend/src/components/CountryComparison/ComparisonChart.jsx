import React, { useState } from 'react';

const ComparisonChart = ({ data }) => {
  const [activeTab, setActiveTab] = useState('radar');
  
  // Extract data for display
  const { countries, criteria_comparison } = data;
  
  // Prepare criteria labels and data
  const criteriaLabels = Object.keys(criteria_comparison).map(key => 
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
  
  const renderRadarChart = () => {
    // In a real application, you would use a library like Chart.js or Recharts
    // This is a placeholder for the radar chart visualization
    return (
      <div className="radar-chart-placeholder">
        <p>Radar Chart Visualization</p>
        <div className="chart-area">
          <div className="chart-notice">
            Radar chart would be displayed here using a charting library like Chart.js or Recharts.
          </div>
        </div>
      </div>
    );
  };
  
  const renderBarChart = () => {
    // Placeholder for bar chart visualization
    return (
      <div className="bar-chart-placeholder">
        <p>Bar Chart Visualization</p>
        <div className="chart-area">
          <div className="chart-notice">
            Bar chart would be displayed here using a charting library like Chart.js or Recharts.
          </div>
        </div>
      </div>
    );
  };
  
  const renderDataTable = () => {
    // Create a table of the comparison data
    return (
      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Criteria</th>
              {countries.map(country => (
                <th key={country.name}>{country.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(criteria_comparison).map(criterion => (
              <tr key={criterion}>
                <td>{criterion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                {countries.map(country => (
                  <td key={country.name}>
                    {criteria_comparison[criterion].values[country.name].toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="comparison-summary">
          <h4>Best Countries by Criterion</h4>
          <ul>
            {Object.keys(criteria_comparison).map(criterion => (
              <li key={criterion}>
                <strong>{criterion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong>{' '}
                {criteria_comparison[criterion].best_country}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  return (
    <div className="comparison-chart">
      <h3>Country Comparison Results</h3>
      
      <div className="chart-tabs">
        <button 
          className={`tab ${activeTab === 'radar' ? 'active' : ''}`} 
          onClick={() => setActiveTab('radar')}
        >
          Radar Chart
        </button>
        <button 
          className={`tab ${activeTab === 'bar' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bar')}
        >
          Bar Chart
        </button>
        <button 
          className={`tab ${activeTab === 'table' ? 'active' : ''}`} 
          onClick={() => setActiveTab('table')}
        >
          Data Table
        </button>
      </div>
      
      <div className="chart-content">
        {activeTab === 'radar' && renderRadarChart()}
        {activeTab === 'bar' && renderBarChart()}
        {activeTab === 'table' && renderDataTable()}
      </div>
    </div>
  );
};

export default ComparisonChart;
