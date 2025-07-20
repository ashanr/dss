import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Student Migration DSS</h4>
          <p>A tool to help students make informed decisions about studying abroad</p>
        </div>
        
        <div className="footer-section">
          <h4>Key Features</h4>
          <ul>
            <li>Multi-Criteria Decision Analysis</li>
            <li>Country Comparison</li>
            <li>Sensitivity Analysis</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="/about">About the System</a></li>
            <li><a href="/methodology">Methodology</a></li>
            <li><a href="/data-sources">Data Sources</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Student Migration Decision Support System</p>
      </div>
    </footer>
  );
};

export default Footer;
