import React, { useEffect, useState } from 'react';
import './HeroSection.css';

const HeroSection = () => {
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { number: '1M+', label: 'Students Guided' },
    { number: '50+', label: 'Countries Analyzed' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'Available' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <section className="hero-section" id="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-icon">🎯</span>
              <span>AI-Powered Decision Support</span>
            </div>

            <h1 className="hero-title">
              Find Your Perfect
              <span className="highlight"> Study Destination</span>
              <br />
              with Smart Analysis
            </h1>

            <p className="hero-description">
              Make informed decisions about studying abroad with our advanced 
              multi-criteria decision analysis system. Compare countries based 
              on your personal preferences and get data-driven recommendations.
            </p>

            <div className="hero-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => {
                  window.location.href = '/index.html';
                }}
              >
                <span>Start Your Analysis</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 7L18 12L13 17M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button 
                className="btn btn-secondary btn-large"
                onClick={() => {
                  document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>See How It Works</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item active">
                <div className="stat-number">{stats[currentStat].number}</div>
                <div className="stat-label">{stats[currentStat].label}</div>
              </div>
              <div className="stat-indicators">
                {stats.map((_, index) => (
                  <div 
                    key={index}
                    className={`indicator ${index === currentStat ? 'active' : ''}`}
                    onClick={() => setCurrentStat(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="decision-cards">
              <div className="decision-card card-1 animate-float">
                <div className="card-flag">🇺🇸</div>
                <div className="card-content">
                  <h4>United States</h4>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '92%'}}></div>
                  </div>
                  <span className="score">92% Match</span>
                </div>
              </div>

              <div className="decision-card card-2 animate-float" style={{animationDelay: '0.5s'}}>
                <div className="card-flag">🇬🇧</div>
                <div className="card-content">
                  <h4>United Kingdom</h4>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '88%'}}></div>
                  </div>
                  <span className="score">88% Match</span>
                </div>
              </div>

              <div className="decision-card card-3 animate-float" style={{animationDelay: '1s'}}>
                <div className="card-flag">🇨🇦</div>
                <div className="card-content">
                  <h4>Canada</h4>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '85%'}}></div>
                  </div>
                  <span className="score">85% Match</span>
                </div>
              </div>
            </div>

            <div className="criteria-wheel">
              <div className="wheel-center">
                <span className="wheel-icon">⚖️</span>
                <span className="wheel-text">Multi-Criteria Analysis</span>
              </div>
              <div className="wheel-segments">
                <div className="segment segment-1" title="Cost of Living"></div>
                <div className="segment segment-2" title="University Rankings"></div>
                <div className="segment segment-3" title="Language Barrier"></div>
                <div className="segment segment-4" title="Visa Process"></div>
                <div className="segment segment-5" title="Job Prospects"></div>
                <div className="segment segment-6" title="Climate"></div>
                <div className="segment segment-7" title="Safety"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;