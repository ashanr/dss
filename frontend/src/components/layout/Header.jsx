import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <h1>
              <span className="logo-text">Student Migration</span>
              <span className="logo-subtitle">Decision Support System</span>
            </h1>
          </Link>
        </div>
        <Navigation />
      </div>
    </header>
  );
};

export default Header;
