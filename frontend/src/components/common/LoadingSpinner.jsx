import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
      </div>
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default LoadingSpinner;
