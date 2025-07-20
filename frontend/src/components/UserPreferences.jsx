// src/components/UserPreferences.jsx
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './UserPreferences.css';

const UserPreferences = () => {
  const { preferences, updatePreferences } = useAnalysis();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [presetProfiles, setPresetProfiles] = useState([]);

  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  const criteriaConfig = {
    costOfLiving: {
      label: 'Cost of Living',
      description: 'Importance of affordable living expenses (accommodation, food, transportation)',
      icon: '💰',
      type: 'cost'
    },
    universityRankings: {
      label: 'University Rankings',
      description: 'Priority of attending highly-ranked educational institutions',
      icon: '🎓',
      type: 'benefit'
    },
    languageBarrier: {
      label: 'Language Barrier',
      description: 'Concern about communication difficulties in the destination country',
      icon: '🗣️',
      type: 'cost'
    },
    visaProcess: {
      label: 'Visa Process',
      description: 'Importance of simple and straightforward visa application procedures',
      icon: '📋',
      type: 'cost'
    },
    jobProspects: {
      label: 'Job Prospects',
      description: 'Priority of good employment opportunities after graduation',
      icon: '💼',
      type: 'benefit'
    },
    climateScore: {
      label: 'Climate Conditions',
      description: 'Importance of favorable weather and environmental conditions',
      icon: '🌤️',
      type: 'benefit'
    },
    safetyScore: {
      label: 'Safety & Security',
      description: 'Priority of personal safety and low crime rates',
      icon: '🛡️',
      type: 'benefit'
    }
  };

  const presetProfilesData = [
    {
      name: 'Budget-Conscious Student',
      description: 'Prioritizes affordability and simple processes',
      preferences: {
        costOfLiving: 5,
        universityRankings: 2,
        languageBarrier: 3,
        visaProcess: 4,
        jobProspects: 3,
        climateScore: 2,
        safetyScore: 4
      }
    },
    {
      name: 'Academic Excellence Seeker',
      description: 'Focuses on top-tier universities and career prospects',
      preferences: {
        costOfLiving: 2,
        universityRankings: 5,
        languageBarrier: 2,
        visaProcess: 3,
        jobProspects: 5,
        climateScore: 1,
        safetyScore: 3
      }
    },
    {
      name: 'Lifestyle-Focused',
      description: 'Values quality of life, safety, and climate',
      preferences: {
        costOfLiving: 3,
        universityRankings: 3,
        languageBarrier: 2,
        visaProcess: 2,
        jobProspects: 3,
        climateScore: 5,
        safetyScore: 5
      }
    },
    {
      name: 'Career-Oriented',
      description: 'Emphasizes job prospects and university reputation',
      preferences: {
        costOfLiving: 3,
        universityRankings: 4,
        languageBarrier: 3,
        visaProcess: 3,
        jobProspects: 5,
        climateScore: 2,
        safetyScore: 4
      }
    }
  ];

  useEffect(() => {
    setPresetProfiles(presetProfilesData);
  }, []);

  const handlePreferenceChange = (criterion, value) => {
    const newPreferences = { ...localPreferences, [criterion]: parseInt(value) };
    setLocalPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
    setHasChanges(false);
  };

  const handleResetPreferences = () => {
    const defaultPreferences = {
      costOfLiving: 3,
      universityRankings: 4,
      languageBarrier: 2,
      visaProcess: 3,
      jobProspects: 5,
      climateScore: 2,
      safetyScore: 4
    };
    setLocalPreferences(defaultPreferences);
    setHasChanges(true);
  };

  const applyPreset = (preset) => {
    setLocalPreferences(preset.preferences);
    setHasChanges(true);
  };

  const getPreferenceIntensity = (value) => {
    const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[value] || 'Medium';
  };

  const getPreferenceColor = (value) => {
    const colors = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#059669'];
    return colors[value] || '#f59e0b';
  };

  return (
    <div className="user-preferences">
      {/* Header */}
      <section className="preferences-header">
        <h2>Customize Your Analysis Preferences</h2>
        <p>
          Adjust the importance of each criterion to get personalized country recommendations. 
          Higher values mean the criterion is more important in your decision.
        </p>
      </section>

      {/* Preset Profiles */}
      <section className="preset-section">
        <h3>Quick Start with Preset Profiles</h3>
        <div className="preset-grid">
          {presetProfiles.map((preset, index) => (
            <div key={index} className="preset-card">
              <h4>{preset.name}</h4>
              <p>{preset.description}</p>
              <button 
                onClick={() => applyPreset(preset)}
                className="btn btn-outline"
              >
                Apply Profile
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Preferences */}
      <section className="preferences-customization">
        <div className="section-header">
          <h3>Custom Preference Settings</h3>
          <div className="preference-legend">
            <span className="legend-item">1 = Very Low Importance</span>
            <span className="legend-item">3 = Medium Importance</span>
            <span className="legend-item">5 = Very High Importance</span>
          </div>
        </div>

        <div className="preferences-list">
          {Object.entries(criteriaConfig).map(([key, config]) => (
            <div key={key} className="preference-item">
              <div className="preference-info">
                <div className="preference-title">
                  <span className="preference-icon">{config.icon}</span>
                  <h4>{config.label}</h4>
                  <span className={`preference-type ${config.type}`}>
                    {config.type === 'cost' ? 'Cost Factor' : 'Benefit Factor'}
                  </span>
                </div>
                <p className="preference-description">{config.description}</p>
              </div>

              <div className="preference-control">
                <div className="preference-slider-container">
                  <input
                    type="range"
                    id={key}
                    min="1"
                    max="5"
                    value={localPreferences[key]}
                    onChange={(e) => handlePreferenceChange(key, e.target.value)}
                    className="preference-slider"
                    style={{
                      background: `linear-gradient(to right, ${getPreferenceColor(localPreferences[key])} 0%, ${getPreferenceColor(localPreferences[key])} ${(localPreferences[key] - 1) * 25}%, #e5e7eb ${(localPreferences[key] - 1) * 25}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="slider-labels">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
                
                <div className="preference-value">
                  <span 
                    className="value-indicator"
                    style={{ backgroundColor: getPreferenceColor(localPreferences[key]) }}
                  >
                    {localPreferences[key]}
                  </span>
                  <span className="value-label">
                    {getPreferenceIntensity(localPreferences[key])}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preference Summary */}
      <section className="preference-summary">
        <h3>Your Current Preference Profile</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <h4>Most Important Factors</h4>
            <ul>
              {Object.entries(localPreferences)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([key, value]) => (
                  <li key={key}>
                    <span className="factor-icon">{criteriaConfig[key].icon}</span>
                    <span className="factor-name">{criteriaConfig[key].label}</span>
                    <span className="factor-value">({value}/5)</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="summary-card">
            <h4>Least Important Factors</h4>
            <ul>
              {Object.entries(localPreferences)
                .sort(([,a], [,b]) => a - b)
                .slice(0, 3)
                .map(([key, value]) => (
                  <li key={key}>
                    <span className="factor-icon">{criteriaConfig[key].icon}</span>
                    <span className="factor-name">{criteriaConfig[key].label}</span>
                    <span className="factor-value">({value}/5)</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="preferences-actions">
        <div className="actions-container">
          <button 
            onClick={handleResetPreferences}
            className="btn btn-outline"
          >
            Reset to Default
          </button>
          
          {hasChanges && (
            <div className="changes-indicator">
              <span>⚠️ You have unsaved changes</span>
            </div>
          )}
          
          <button 
            onClick={handleSavePreferences}
            disabled={!hasChanges}
            className="btn btn-primary"
          >
            {hasChanges ? 'Save Preferences' : 'Preferences Saved'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default UserPreferences;
