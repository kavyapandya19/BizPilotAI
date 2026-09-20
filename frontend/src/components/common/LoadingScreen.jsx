import React from 'react';

const LoadingScreen = ({ label = 'Loading your workspace...' }) => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="loading-orbit" aria-hidden="true">
      <span className="loading-orbit-dot" />
      <span className="loading-orbit-dot" />
      <span className="loading-orbit-dot" />
      <div className="loading-orbit-core">B</div>
    </div>
    <div className="loading-copy">
      <p>{label}</p>
      <div className="loading-progress" aria-hidden="true"><span /></div>
    </div>
    <div className="loading-skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </div>
);

export default LoadingScreen;