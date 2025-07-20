// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAnalysis } from '../contexts/AnalysisContext';
import './Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, loading } = useAnalysis();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/analysis', label: 'Country Analysis', icon: '📊' },
    { path: '/comparison', label: 'Compare Countries', icon: '⚖️' },
    { path: '/preferences', label: 'My Preferences', icon: '⚙️' },
    { path: '/results', label: 'Analysis Results', icon: '📋' },
    { path: '/history', label: 'Analysis History', icon: '📚' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const getPageTitle = () => {
    const item = navigationItems.find(item => 
      item.path === location.pathname || 
      (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Migration DSS</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h1>{getPageTitle()}</h1>
            <div className="breadcrumb">
              <span>Home</span>
              {location.pathname !== '/' && (
                <>
                  <span> / </span>
                  <span>{getPageTitle()}</span>
                </>
              )}
            </div>
          </div>
          <div className="header-right">
            {loading && <div className="loading-indicator">Loading...</div>}
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
