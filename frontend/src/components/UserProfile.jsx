// src/components/UserProfile.jsx
import React, { useState } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, updateUser, preferences } = useAnalysis();
  const [profileData, setProfileData] = useState(user);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'academic', 'preferences'

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveProfile = () => {
    updateUser(profileData);
    setHasChanges(false);
  };

  const resetProfile = () => {
    setProfileData(user);
    setHasChanges(false);
  };

  const criteriaLabels = {
    costOfLiving: 'Cost of Living',
    universityRankings: 'University Rankings',
    languageBarrier: 'Language Barrier',
    visaProcess: 'Visa Process',
    jobProspects: 'Job Prospects',
    climateScore: 'Climate Score',
    safetyScore: 'Safety & Security'
  };

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <section className="profile-header">
        <div className="header-content">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : '👤'}
            </div>
          </div>
          <div className="profile-info">
            <h2>{profileData.name || 'Student User'}</h2>
            <p>{profileData.email || 'student@example.com'}</p>
            <div className="profile-badges">
              <span className="badge">
                {profileData.studyField || 'Computer Science'}
              </span>
              <span className="badge">
                Start Date: {profileData.preferredStartDate || '2024-09-01'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {hasChanges && (
            <div className="changes-indicator">
              <span>⚠️ Unsaved changes</span>
            </div>
          )}
          <button 
            onClick={handleSaveProfile}
            disabled={!hasChanges}
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="profile-tabs">
        <div className="tab-nav">
          <button 
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 Personal Info
          </button>
          <button 
            className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            🎓 Academic Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ System Preferences
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="profile-content">
        {activeTab === 'personal' && (
          <div className="tab-panel">
            <h3>Personal Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={profileData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="form-input"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nationality">Nationality</label>
                <select
                  id="nationality"
                  value={profileData.nationality || ''}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select nationality</option>
                  <option value="indian">Indian</option>
                  <option value="chinese">Chinese</option>
                  <option value="korean">Korean</option>
                  <option value="japanese">Japanese</option>
                  <option value="bangladeshi">Bangladeshi</option>
                  <option value="pakistani">Pakistani</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="currentLocation">Current Location</label>
                <input
                  type="text"
                  id="currentLocation"
                  value={profileData.currentLocation || ''}
                  onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                  className="form-input"
                  placeholder="City, Country"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthDate">Date of Birth</label>
                <input
                  type="date"
                  id="birthDate"
                  value={profileData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="tab-panel">
            <h3>Academic Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="studyField">Field of Study</label>
                <select
                  id="studyField"
                  value={profileData.studyField || ''}
                  onChange={(e) => handleInputChange('studyField', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select field of study</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Law">Law</option>
                  <option value="Arts & Humanities">Arts & Humanities</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="studyLevel">Study Level</label>
                <select
                  id="studyLevel"
                  value={profileData.studyLevel || ''}
                  onChange={(e) => handleInputChange('studyLevel', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select study level</option>
                  <option value="undergraduate">Undergraduate (Bachelor's)</option>
                  <option value="graduate">Graduate (Master's)</option>
                  <option value="phd">PhD/Doctoral</option>
                  <option value="certificate">Certificate Program</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="preferredStartDate">Preferred Start Date</label>
                <input
                  type="date"
                  id="preferredStartDate"
                  value={profileData.preferredStartDate || ''}
                  onChange={(e) => handleInputChange('preferredStartDate', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="previousEducation">Previous Education</label>
                <input
                  type="text"
                  id="previousEducation"
                  value={profileData.previousEducation || ''}
                  onChange={(e) => handleInputChange('previousEducation', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Bachelor's in Engineering, ABC University"
                />
              </div>

              <div className="form-group">
                <label htmlFor="englishProficiency">English Proficiency</label>
                <select
                  id="englishProficiency"
                  value={profileData.englishProficiency || ''}
                  onChange={(e) => handleInputChange('englishProficiency', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select proficiency level</option>
                  <option value="native">Native Speaker</option>
                  <option value="fluent">Fluent</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="basic">Basic</option>
                  <option value="none">Limited/None</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget">Study Budget (Annual)</label>
                <select
                  id="budget"
                  value={profileData.budget || ''}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select budget range</option>
                  <option value="under-20k">Under $20,000</option>
                  <option value="20k-40k">$20,000 - $40,000</option>
                  <option value="40k-60k">$40,000 - $60,000</option>
                  <option value="60k-80k">$60,000 - $80,000</option>
                  <option value="over-80k">Over $80,000</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h4>Goals & Motivation</h4>
              <div className="form-group">
                <label htmlFor="studyGoals">Study Goals</label>
                <textarea
                  id="studyGoals"
                  value={profileData.studyGoals || ''}
                  onChange={(e) => handleInputChange('studyGoals', e.target.value)}
                  className="form-textarea"
                  placeholder="Describe your academic and career goals..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="tab-panel">
            <h3>System Preferences</h3>
            
            <div className="preferences-overview">
              <h4>Current Analysis Preferences</h4>
              <p>These are your current preference weights used in country analysis:</p>
              
              <div className="preferences-display">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="preference-display-item">
                    <div className="preference-info">
                      <span className="preference-name">{criteriaLabels[key]}</span>
                      <span className="preference-weight">{value}/5</span>
                    </div>
                    <div className="preference-bar">
                      <div 
                        className="preference-fill"
                        style={{ width: `${(value / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="preferences-note">
                To modify these preferences, visit the <strong>My Preferences</strong> section.
              </p>
            </div>

            <div className="system-settings">
              <h4>System Settings</h4>
              
              <div className="form-group">
                <label htmlFor="notifications">Email Notifications</label>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={profileData.notifications?.analysis || false}
                      onChange={(e) => handleInputChange('notifications', {
                        ...profileData.notifications,
                        analysis: e.target.checked
                      })}
                    />
                    <span>Analysis completion notifications</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={profileData.notifications?.updates || false}
                      onChange={(e) => handleInputChange('notifications', {
                        ...profileData.notifications,
                        updates: e.target.checked
                      })}
                    />
                    <span>System updates and new features</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={profileData.notifications?.tips || false}
                      onChange={(e) => handleInputChange('notifications', {
                        ...profileData.notifications,
                        tips: e.target.checked
                      })}
                    />
                    <span>Study abroad tips and advice</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dataExport">Data Export</label>
                <div className="export-options">
                  <button className="btn btn-outline">
                    📥 Export Profile Data
                  </button>
                  <button className="btn btn-outline">
                    📥 Export Analysis History
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Account Actions</label>
                <div className="account-actions">
                  <button 
                    onClick={resetProfile}
                    className="btn btn-outline"
                    disabled={!hasChanges}
                  >
                    Reset Changes
                  </button>
                  <button className="btn btn-danger">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Profile Completion */}
      <section className="profile-completion">
        <h3>Profile Completion</h3>
        <div className="completion-card">
          <div className="completion-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.round(
                    (Object.values(profileData).filter(v => v && v !== '').length / 
                     Object.keys(profileData).length) * 100
                  )}%` 
                }}
              ></div>
            </div>
            <span className="progress-text">
              {Math.round(
                (Object.values(profileData).filter(v => v && v !== '').length / 
                 Object.keys(profileData).length) * 100
              )}% Complete
            </span>
          </div>
          
          <div className="completion-benefits">
            <h4>Complete your profile to:</h4>
            <ul>
              <li>✅ Get more personalized recommendations</li>
              <li>✅ Receive relevant study abroad opportunities</li>
              <li>✅ Save your analysis history longer</li>
              <li>✅ Access advanced comparison features</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
