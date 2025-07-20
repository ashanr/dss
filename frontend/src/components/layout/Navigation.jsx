import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="main-navigation">
      <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className="burger-icon"></span>
        <span className="menu-label">Menu</span>
      </div>
      
      <ul className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <li>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/analysis" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Decision Analysis
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/comparison" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Country Comparison
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/data" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Data Explorer
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/about" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
