// ── Persistent Auth Layer ──────────────────────────────────────────
// Automatically sends cryptographic auth token with every fetch request
(function() {
  const _originalFetch = window.fetch;
  window.fetch = function(url, opts) {
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
          opts.headers.set('Authorization', 'Bearer ' + savedToken);
        }
        if (savedEmail && !opts.headers.has('x-user-email')) {
          opts.headers.set('x-user-email', encodeURIComponent(savedEmail));
        }
      } else if (typeof opts.headers === 'object') {
        if (savedToken) {
          if (!opts.headers['x-auth-token']) opts.headers['x-auth-token'] = savedToken;
          if (!opts.headers['Authorization']) opts.headers['Authorization'] = 'Bearer ' + savedToken;
        }
        if (savedEmail && !opts.headers['x-user-email']) {
          opts.headers['x-user-email'] = encodeURIComponent(savedEmail);
        }
      }
    }
    return _originalFetch.call(window, url, opts);
  };
})();

// Helper: call this on logout from any page
function gramLogout() {
  if (!confirm("Are you sure you want to logout?")) return;
  localStorage.removeItem('gram_user_email');
  localStorage.removeItem('gram_user_role');
  localStorage.removeItem('gram_auth_token');
  fetch('/api/auth/logout', { method: 'POST' })
    .catch(function(){})
    .finally(function() {
      window.location.href = '/login';
    });
}
