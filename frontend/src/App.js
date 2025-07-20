// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalysisProvider } from './contexts/AnalysisContext';
import Dashboard from './components/Dashboard';
import DashboardHome from './components/DashboardHome';
import CountryAnalysis from './components/CountryAnalysis';
import CountryComparison from './components/CountryComparison';
import UserPreferences from './components/UserPreferences';
import AnalysisResults from './components/AnalysisResults';
import AnalysisHistory from './components/AnalysisHistory';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="analysis" element={<CountryAnalysis />} />
            <Route path="comparison" element={<CountryComparison />} />
            <Route path="preferences" element={<UserPreferences />} />
            <Route path="results" element={<AnalysisResults />} />
            <Route path="history" element={<AnalysisHistory />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Routes>
      </Router>
    </AnalysisProvider>
  );
}

export default App;
