import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ── Bulletproof Error Boundary to Prevent Mobile White Screen ────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fff8f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 10px 25px -5px rgba(0, 59, 90, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚰</div>
            <h2 style={{ color: '#003b5a', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Gram Jal Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Mobile connection refreshed. Tap below to reload the clean portal.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#003b5a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              RELOAD PORTAL
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Bulletproof Global Fetch Interceptor ──────────────────────────────
const _nativeFetch = window.fetch;
window.fetch = function (url, opts) {
  try {
    let savedToken = null;
    let savedEmail = null;
    try {
      savedToken = localStorage.getItem('gram_auth_token');
      savedEmail = localStorage.getItem('gram_user_email');
    } catch (_) {}

    if (savedToken || savedEmail) {
      if (typeof Request !== 'undefined' && url instanceof Request) {
        if (savedToken && !url.headers.has('x-auth-token')) {
          url.headers.set('x-auth-token', savedToken);
          url.headers.set('Authorization', `Bearer ${savedToken}`);
        }
        if (savedEmail && !url.headers.has('x-user-email')) {
          url.headers.set('x-user-email', encodeURIComponent(savedEmail));
        }
        return _nativeFetch.call(window, url);
      }

      const finalOpts = opts ? { ...opts } : {};
      finalOpts.headers = finalOpts.headers ? (finalOpts.headers instanceof Headers ? finalOpts.headers : { ...finalOpts.headers }) : {};

      if (typeof Headers !== 'undefined' && finalOpts.headers instanceof Headers) {
        if (savedToken && !finalOpts.headers.has('x-auth-token')) {
          finalOpts.headers.set('x-auth-token', savedToken);
          finalOpts.headers.set('Authorization', `Bearer ${savedToken}`);
        }
        if (savedEmail && !finalOpts.headers.has('x-user-email')) {
          finalOpts.headers.set('x-user-email', encodeURIComponent(savedEmail));
        }
      } else if (typeof finalOpts.headers === 'object') {
        if (savedToken) {
          if (!finalOpts.headers['x-auth-token']) finalOpts.headers['x-auth-token'] = savedToken;
          if (!finalOpts.headers['Authorization']) finalOpts.headers['Authorization'] = `Bearer ${savedToken}`;
        }
        if (savedEmail && !finalOpts.headers['x-user-email']) {
          finalOpts.headers['x-user-email'] = encodeURIComponent(savedEmail);
        }
      }
      return _nativeFetch.call(window, url, finalOpts);
    }
  } catch (err) {
    console.warn("Fetch interceptor pass-through:", err);
  }
  return _nativeFetch.apply(window, arguments);
};

// ── Bulletproof Mounting with DOM Readiness Guarantee ────────────────
function mountApplication() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountApplication, { once: true });
    } else {
      setTimeout(mountApplication, 20);
    }
    return;
  }

  // Prevent multiple createRoot calls on the same container
  if (!rootElement.__reactRootMounted) {
    rootElement.__reactRootMounted = true;
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication, { once: true });
} else {
  mountApplication();
}
