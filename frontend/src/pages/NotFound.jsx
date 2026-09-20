import React from 'react';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="not-found-page">
      <div className="not-found-grid" aria-hidden="true" />
      <div className="not-found-content">
        <div className="not-found-marker" aria-hidden="true">
          <MapPin className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Route not found</p>
        <h1>We lost that page.</h1>
        <p className="not-found-description">
          The address <strong>{location.pathname}</strong> does not match a page in your BizPilot workspace.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Back to dashboard
          </Link>
          <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
      <div className="not-found-code" aria-hidden="true">404</div>
    </main>
  );
};

export default NotFound;