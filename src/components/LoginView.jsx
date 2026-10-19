import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/translations';

const GOOGLE_CLIENT_ID = "547185696384-nfog7eetv58j1vh6c75u42jd88gcqsi2.apps.googleusercontent.com";

export default function LoginView({ onLoginSuccess, language = 'en', setLanguage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const googleBtnRef = useRef(null);

  const t = (key) => getTranslation(language, key);

  const isOfficial = email.toLowerCase().trim() === 'admin@village.gov.in' || 
                     email.toLowerCase().trim() === 'sarpanch@village.gov.in';

  const getAccurateGps = async () => {
    setGpsStatus('Acquiring high-accuracy GPS (±5m)...');
    let lat = null, lon = null;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        setGpsStatus(`GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (err) {
      console.warn("GPS notice on login:", err);
      setGpsStatus('');
    }
    return { lat, lon };
  };

  // Initialize official Google Identity Services button
  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      if (response && response.credential) {
        setLoading(true);
        const { lat, lon } = await getAccurateGps();
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential, lat, lon })
          });
          const data = await res.json();
          if (res.ok && data.user) {
            localStorage.setItem('gram_user_email', data.user.email);
            localStorage.setItem('gram_user_role', data.user.role);
            onLoginSuccess(data.user);
          } else {
            alert(data.message || data.error || 'Google login failed.');
          }
        } catch (err) {
          console.error(err);
          alert('Error connecting with Google Sign-In.');
        } finally {
          setLoading(false);
        }
      }
    };

    const initGoogleGSI = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: googleBtnRef.current.offsetWidth || 340,
              text: 'continue_with',
              shape: 'pill'
            });
          }
        } catch (e) {
          console.warn("GSI init warning:", e);
        }
      }
    };

    initGoogleGSI();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogleGSI();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter your email or Gmail ID.");
      return;
    }

    setLoading(true);
    const { lat, lon } = await getAccurateGps();

    try {
      const res = await fetch('/api/auth/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: isOfficial ? password : '',
          lat, 
          lon 
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('gram_user_email', data.user.email);
        localStorage.setItem('gram_user_role', data.user.role);
        onLoginSuccess(data.user);
      } else {
        alert(data.message || data.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network or server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Language Switcher in top right */}
      <div className="absolute top-4 right-4 z-20">
        <select
          value={language}
          onChange={(e) => setLanguage && setLanguage(e.target.value)}
          className="bg-white text-on-surface font-headline font-bold text-xs rounded-xl border border-outline-variant px-3 py-1.5 shadow-sm focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="en">English</option>
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>

      {/* Decorative background drop */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-outline-variant/60 p-6 sm:p-8 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center p-3 mb-3 shadow-inner">
            <img 
              alt="Village Water Logo" 
              className="w-full h-full object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI2oc_Spp8I6sgWaFMdsSaFj6HCk6B0FcQPjuW5ESxOxg1qEkS2UujcZNWktzJc8s5jwVXxfZcpXC-_nT7qoyZfCico0MZXOysuOfdYGH_BObereTalqbra5mCuW0jZ4k0JiWCqJUizNUxZ0eoHab6alVwGgUk4JVZXPKdivAOY5RPtWQVl8LjrPw0-RknTkFttseIwCfgur0EmzMkWGVWB07KHOChoA5J8VhKNoq1A7a7uu-LpA0X4w" 
            />
          </div>
          <h1 className="font-headline font-bold text-2xl text-primary">
            {t('login_title')}
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            {t('login_sub')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-headline font-bold text-on-surface uppercase tracking-wider mb-1.5">
              {t('email_label')}
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-xl pointer-events-none">
                alternate_email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                required
                className="w-full pl-11 pr-4 py-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 font-body"
              />
            </div>
            {!isOfficial && email.includes('@') && (
              <p className="text-[11px] text-secondary font-medium mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                {t('citizen_login_note')}
              </p>
            )}
          </div>

          {/* Password (only shown for official admin/sarpanch) */}
          {isOfficial && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-headline font-bold text-on-surface uppercase tracking-wider mb-1.5">
                {t('staff_password')}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-xl pointer-events-none">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  required={isOfficial}
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {gpsStatus && (
            <p className="text-[11px] text-primary font-medium text-center">
              📍 {gpsStatus}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>{t('enter_portal')}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-outline-variant/60 flex-1" />
          <span className="text-[11px] text-on-surface-variant font-headline font-bold uppercase tracking-widest">
            OR
          </span>
          <div className="h-px bg-outline-variant/60 flex-1" />
        </div>

        {/* Real Official Google Sign In Container (NO window.prompt) */}
        <div className="flex justify-center w-full min-h-[44px]">
          <div ref={googleBtnRef} className="w-full flex justify-center" />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-outline-variant/40 text-center">
          <p className="text-[11px] text-on-surface-variant font-body">
            Official admin / sarpanch accounts: <br/>
            <code className="text-primary font-mono text-[10px]">admin@village.gov.in</code> (pass: admin123)
          </p>
        </div>
      </div>
    </div>
  );
}
