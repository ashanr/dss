import React, { useState, useEffect } from 'react';
import ComparisonChart from './ComparisonChart';
import { LoadingSpinner, ErrorMessage } from '../common';
import api from '../../services/api';

const CountryComparison = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/api/countries');
        if (response.data.success) {
          setCountries(response.data.countries);
        } else {
          setError('Failed to fetch countries');
        }
      } catch (err) {
        setError('Error connecting to server');
      }
    };

    fetchCountries();
  }, []);

  const handleCountrySelect = (e) => {
    const value = e.target.value;
    if (!selectedCountries.includes(value) && selectedCountries.length < 4) {
      setSelectedCountries([...selectedCountries, value]);
    }
  };

  const handleCountryRemove = (country) => {
    setSelectedCountries(selectedCountries.filter(c => c !== country));
  };

  const handleCompare = async () => {
    if (selectedCountries.length < 2) {
      setError('Please select at least 2 countries to compare');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/compare', {
        countries: selectedCountries
      });
      
      if (response.data.success) {
        setComparisonData(response.data.comparison);
      } else {
        setError(response.data.error || 'Failed to compare countries');
      }
    } catch (err) {
      setError(err.message || 'Error performing comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="country-comparison-container">
      <h2>Country Comparison</h2>
      <p>Select countries to compare their criteria side by side.</p>
      
      <div className="country-selector">
        <select 
          onChange={handleCountrySelect} 
          value="" 
          disabled={selectedCountries.length >= 4}
        >
          <option value="" disabled>Select a country</option>
          {countries.map(country => (
            <option 
              key={country.id} 
              value={country.name}
              disabled={selectedCountries.includes(country.name)}
            >
              {country.name}
            </option>
          ))}
        </select>
        
        <div className="selected-countries">
          {selectedCountries.map(country => (
            <div key={country} className="selected-country-tag">
              <span>{country}</span>
              <button onClick={() => handleCountryRemove(country)}>×</button>
            </div>
          ))}
        </div>
        
        <button 
          className="compare-button"
          onClick={handleCompare}
          disabled={loading || selectedCountries.length < 2}
        >
          Compare
        </button>
      </div>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      {comparisonData && (
        <ComparisonChart data={comparisonData} />
      )}
    </div>
  );
};

export default CountryComparison;
