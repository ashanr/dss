import React, { useState, useEffect } from 'react';
import WeightSliders from './WeightSliders';
import ResultsDisplay from './ResultsDisplay';
import { LoadingSpinner, ErrorMessage } from '../common';
import api from '../../services/api';

const DecisionAnalysis = () => {
  const [weights, setWeights] = useState({
    cost_weight: 1.0,
    ranking_weight: 1.0,
    language_weight: 1.0,
    visa_weight: 1.0,
    job_weight: 1.0,
    climate_weight: 1.0,
    safety_weight: 1.0
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || crypto.randomUUID());

  useEffect(() => {
    // Save session ID to localStorage
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  const handleWeightChange = (name, value) => {
    setWeights(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        session_id: sessionId,
        ...weights
      };
      const response = await api.post('/api/decision/analyze', payload);
      if (response.data.success) {
        setResults(response.data.results);
      } else {
        setError(response.data.error || 'An error occurred during analysis');
      }
    } catch (err) {
      setError(err.message || 'Failed to perform analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decision-analysis-container">
      <h2>Decision Analysis</h2>
      <p>Adjust the weights below to reflect your priorities when choosing a study destination.</p>
      
      <WeightSliders weights={weights} onChange={handleWeightChange} />
      
      <button 
        className="analyze-button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      {results.length > 0 && (
        <ResultsDisplay results={results} />
      )}
    </div>
  );
};

export default DecisionAnalysis;
