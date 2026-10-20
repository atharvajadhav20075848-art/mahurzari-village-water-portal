import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ── Secure Global Fetch Interceptor ────────────────────────────────────
// Transparently attaches cryptographic auth token to all fetch calls
const _nativeFetch = window.fetch;
window.fetch = function (url, opts) {
  opts = opts || {};
  const savedToken = localStorage.getItem('gram_auth_token');
  const savedEmail = localStorage.getItem('gram_user_email');

  if (savedToken || savedEmail) {
    if (!opts.headers) {
      opts.headers = {};
    }
    if (opts.headers instanceof Headers) {
      if (savedToken && !opts.headers.has('x-auth-token')) {
        opts.headers.set('x-auth-token', savedToken);
        opts.headers.set('Authorization', `Bearer ${savedToken}`);
      }
      if (savedEmail && !opts.headers.has('x-user-email')) {
        opts.headers.set('x-user-email', encodeURIComponent(savedEmail));
      }
    } else if (typeof opts.headers === 'object') {
      if (savedToken) {
        if (!opts.headers['x-auth-token']) opts.headers['x-auth-token'] = savedToken;
        if (!opts.headers['Authorization']) opts.headers['Authorization'] = `Bearer ${savedToken}`;
      }
      if (savedEmail && !opts.headers['x-user-email']) {
        opts.headers['x-user-email'] = encodeURIComponent(savedEmail);
      }
    }
  }
  return _nativeFetch.call(window, url, opts);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
