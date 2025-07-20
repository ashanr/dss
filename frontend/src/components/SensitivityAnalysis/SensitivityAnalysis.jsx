import React, { useState } from 'react';
import SensitivityModal from './SensitivityModal';
import { LoadingSpinner, ErrorMessage } from '../common';
import api from '../../services/api';

const SensitivityAnalysis = ({ weights, sessionId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sensitivityResults, setSensitivityResults] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const handleSensitivityAnalysis = async () => {
    if (!weights) {
      setError('Please configure weights for analysis first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        session_id: sessionId,
        ...weights,
        variation_range: [-0.2, -0.1, 0, 0.1, 0.2]
      };
      
      const response = await api.post('/api/sensitivity/analyze', payload);
      
      if (response.data.success) {
        setSensitivityResults(response.data.sensitivity_results);
        setShowModal(true);
      } else {
        setError(response.data.error || 'Failed to perform sensitivity analysis');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="sensitivity-analysis-container">
      <h3>Sensitivity Analysis</h3>
      <p>
        Understand how your decision might change if you slightly adjust your preferences.
        This analysis helps identify which criteria have the most impact on your results.
      </p>
      
      <button 
        className="sensitivity-button"
        onClick={handleSensitivityAnalysis}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Run Sensitivity Analysis'}
      </button>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      {showModal && sensitivityResults && (
        <SensitivityModal 
          results={sensitivityResults} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

export default SensitivityAnalysis;
