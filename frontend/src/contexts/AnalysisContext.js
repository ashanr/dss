// src/contexts/AnalysisContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AnalysisContext = createContext();

const initialState = {
  countries: [],
  preferences: {
    costOfLiving: 3,
    universityRankings: 4,
    languageBarrier: 2,
    visaProcess: 3,
    jobProspects: 5,
    climateScore: 2,
    safetyScore: 4
  },
  analysisResults: [],
  analysisHistory: [],
  loading: false,
  error: null,
  user: {
    name: 'Student User',
    email: 'student@example.com',
    studyField: 'Computer Science',
    preferredStartDate: '2024-09-01'
  }
};

function analysisReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_COUNTRIES':
      return { ...state, countries: action.payload, loading: false };
    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload, loading: false };
    case 'ADD_TO_HISTORY':
      return { 
        ...state, 
        analysisHistory: [action.payload, ...state.analysisHistory].slice(0, 10) 
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE}/countries`);
      const data = await response.json();
      dispatch({ type: 'SET_COUNTRIES', payload: data.countries || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch countries' });
    }
  };

  const runAnalysis = async (preferences = state.preferences) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      const data = await response.json();
      dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: data.results || [] });
      dispatch({ type: 'ADD_TO_HISTORY', payload: {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        preferences: preferences,
        results: data.results || []
      }});
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to run analysis' });
    }
  };

  const updatePreferences = (newPreferences) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: newPreferences });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AnalysisContext.Provider value={{
      ...state,
      runAnalysis,
      updatePreferences,
      updateUser,
      fetchCountries
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
};
