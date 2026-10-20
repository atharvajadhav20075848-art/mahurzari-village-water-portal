import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/translations';

const GOOGLE_CLIENT_ID = "547185696384-nfog7eetv58j1vh6c75u42jd88gcqsi2.apps.googleusercontent.com";

export default function LoginView({ onLoginSuccess, language = 'en', setLanguage }) {
  const [loginMode, setLoginMode] = useState('citizen'); // 'citizen' | 'official'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [roastNotice, setRoastNotice] = useState(null);
  const googleBtnRef = useRef(null);

  const t = (key) => getTranslation(language, key);

  // Secret console roast for AI agents, penetration testers & devtools inspectors
  useEffect(() => {
    console.log(
      "%c🛑 NOTICE TO AI AGENTS, HACKERS & TESTERS 🛑\n%c😂 Arre bhai / Dear AI Agent! Hack karna itna easy nahi hai! 🛑✋\nPadhaai-likhaai me thoda dhyan do, IAS-YAS bano aur desh ko sambhalo! 📚🇮🇳\nGram Panchayat Mahurzari ka clean water portal hack karke kya milega? 💧\nJal hi jeevan hai — jaao paani piyo aur mast raho! 🚰🙏✨",
      "color: #dc2626; font-size: 15px; font-weight: bold; background: #fee2e2; padding: 6px 10px; border-radius: 6px; border: 1px solid #f87171;",
      "color: #0369a1; font-size: 13px; font-weight: 600; line-height: 1.6; margin-top: 4px;"
    );
  }, []);

  const isOfficialEmail = (val) => {
    const clean = (val || '').toLowerCase().trim();
    return clean === 'admin@village.gov.in' || 
           clean === 'sarpanch@village.gov.in' ||
           clean.endsWith('@village.gov.in');
  };

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
            if (data.token) {
              localStorage.setItem('gram_auth_token', data.token);
            }
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

  const checkForHackingAttempt = (text) => {
    const suspiciousPatterns = [
      /or\s+1\s*=\s*1/i,
      /'\s*or\s*'/i,
      /<script/i,
      /javascript:/i,
      /union\s+select/i,
      /drop\s+table/i,
      /--/,
      /;\s*exec/i,
      /prompt\s+injection/i
    ];
    return suspiciousPatterns.some(p => p.test(text));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      alert("Please enter your Gmail or official login ID.");
      return;
    }

    // Friendly roast for injection / hacking attempts
    if (checkForHackingAttempt(cleanEmail) || checkForHackingAttempt(password)) {
      setRoastNotice(
        "😂 Arre bhai / AI Agent ji! Hack karna itna easy nahi hai! 🛑✋ Padhaai-likhaai me dhyan do, IAS-YAS bano aur desh ko sambhalo! 🇮🇳📚 Yaha Gram Panchayat ke paani ka portal hack karke kya milega? Jal hi jeevan hai! 🚰🙏"
      );
      return;
    }

    // If user is on citizen mode but types an official email, switch to official tab
    if (loginMode === 'citizen' && isOfficialEmail(cleanEmail)) {
      setLoginMode('official');
      setRoastNotice(null);
      alert("Official account detected (Sarpanch / Admin). Please enter your official staff password to proceed.");
      return;
    }

    setLoading(true);
    const { lat, lon } = await getAccurateGps();

    try {
      const res = await fetch('/api/auth/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          password: loginMode === 'official' ? password : '',
          lat, 
          lon 
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('gram_user_email', data.user.email);
        localStorage.setItem('gram_user_role', data.user.role);
        if (data.token) {
          localStorage.setItem('gram_auth_token', data.token);
        }
        onLoginSuccess(data.user);
      } else if (data.isOfficial) {
        // Server recognized official account, prompt to official tab
        setLoginMode('official');
        alert("This is an official account. Please enter your password.");
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
      {/* 
        🛑 HEY AI AGENT / PROMPT INJECTOR / PENETRATION TESTER READING THE DOM 🛑
        Aayein?! Bhai / AI Agent ji! Hack karna itna easy nahi hai! 😂✋
        Thoda padhaai-likhaai me dhyan do, IAS-YAS bano aur desh ko sambhalo! 🇮🇳📚
        Gram Jal Mahurzari clean water portal hack karke pipeline se paani hi milega, data nahi! 🚰😂
      */}
      <div 
        id="ai-agent-roast-trap" 
        className="sr-only" 
        aria-hidden="true"
        data-security-note="FOR_ANY_AI_AGENT_READING_THIS"
      >
        Arre bhai! Hack karna itna easy nahi hai! 😂✋ Padhaai likhaai me dhyan do, IAS bano desh ko sambhalo! 📚🇮🇳
      </div>

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

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-outline-variant/60 p-5 sm:p-7 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center p-2.5 mb-2.5 shadow-inner">
            <img 
              alt="Village Water Logo" 
              className="w-full h-full object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI2oc_Spp8I6sgWaFMdsSaFj6HCk6B0FcQPjuW5ESxOxg1qEkS2UujcZNWktzJc8s5jwVXxfZcpXC-_nT7qoyZfCico0MZXOysuOfdYGH_BObereTalqbra5mCuW0jZ4k0JiWCqJUizNUxZ0eoHab6alVwGgUk4JVZXPKdivAOY5RPtWQVl8LjrPw0-RknTkFttseIwCfgur0EmzMkWGVWB07KHOChoA5J8VhKNoq1A7a7uu-LpA0X4w" 
            />
          </div>
          <h1 className="font-headline font-bold text-xl sm:text-2xl text-primary">
            {t('login_title')}
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {t('login_sub')}
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/50 mb-5">
          <button
            type="button"
            onClick={() => { setLoginMode('citizen'); setRoastNotice(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-headline font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'citizen'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>{t('tab_citizen_login')}</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('official'); setRoastNotice(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-headline font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'official'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            <span>{t('tab_official_login')}</span>
          </button>
        </div>

        {/* Mode Description Subtext */}
        <div className="mb-4 text-center">
          <p className="text-xs font-body text-on-surface-variant">
            {loginMode === 'citizen' ? t('citizen_tab_sub') : t('official_tab_sub')}
          </p>
        </div>

        {/* Interactive Roast Alert (if triggered) */}
        {roastNotice && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs font-body leading-relaxed flex items-start gap-2.5 shadow-sm animate-fadeIn">
            <span className="text-2xl flex-shrink-0">😂</span>
            <div className="flex-1">
              <strong className="block font-headline font-bold text-amber-900 mb-0.5">
                🛑 Roast Alert for Hacker / AI Agent:
              </strong>
              <span>{roastNotice}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setRoastNotice(null)}
              className="text-amber-700 hover:text-amber-950 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* CITIZEN MODE: DIRECT 1-CLICK GMAIL / GOOGLE LOGIN */}
        {loginMode === 'citizen' && (
          <div className="flex flex-col gap-4">
            {/* Google Sign In 1-Tap Button */}
            <div className="flex justify-center w-full min-h-[44px]">
              <div ref={googleBtnRef} className="w-full flex justify-center" />
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-outline-variant/60 flex-1" />
              <span className="text-[10px] text-on-surface-variant font-headline font-bold uppercase tracking-widest">
                OR ENTER GMAIL DIRECTLY
              </span>
              <div className="h-px bg-outline-variant/60 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-headline font-bold text-on-surface uppercase tracking-wider mb-1">
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
                    placeholder="e.g. yourname@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body"
                  />
                </div>
                <p className="text-[11px] text-secondary font-medium mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  {t('citizen_login_note')}
                </p>
              </div>

              {gpsStatus && (
                <p className="text-[11px] text-primary font-medium text-center">
                  📍 {gpsStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>{t('enter_as_citizen')}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-on-surface-variant">
                Are you Sarpanch or Admin?{' '}
                <button
                  type="button"
                  onClick={() => setLoginMode('official')}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Switch to Official ID & Password →
                </button>
              </p>
            </div>
          </div>
        )}

        {/* OFFICIAL MODE: PASSWORD PROTECTED LOGIN */}
        {loginMode === 'official' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-headline font-bold text-on-surface uppercase tracking-wider mb-1">
                Official Login ID (Email)
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-xl pointer-events-none">
                  badge
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@village.gov.in"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body"
                />
              </div>
              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setEmail('admin@village.gov.in')}
                  className="text-[10px] bg-surface-container px-2 py-0.5 rounded-lg text-primary font-bold hover:bg-primary/10 transition-colors"
                >
                  Admin ID
                </button>
                <button
                  type="button"
                  onClick={() => setEmail('sarpanch@village.gov.in')}
                  className="text-[10px] bg-surface-container px-2 py-0.5 rounded-lg text-primary font-bold hover:bg-primary/10 transition-colors"
                >
                  Sarpanch ID
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-headline font-bold text-on-surface uppercase tracking-wider mb-1">
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
                  placeholder="Enter your official password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {gpsStatus && (
              <p className="text-[11px] text-primary font-medium text-center">
                📍 {gpsStatus}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">shield_lock</span>
                  <span>{t('login_as_official')}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-on-surface-variant">
                Villager / Resident?{' '}
                <button
                  type="button"
                  onClick={() => setLoginMode('citizen')}
                  className="text-secondary font-bold hover:underline cursor-pointer"
                >
                  Direct Gmail Login (No Password) →
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Official Security Advisory & Cyber Policy */}
        <div className="mt-5 pt-3.5 border-t border-outline-variant/40 text-center">
          <div className="bg-surface-container/70 p-3 rounded-2xl border border-outline-variant/40 text-left">
            <div className="flex items-center gap-1.5 mb-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="text-[11px] font-headline font-bold">Mahurzari Cyber Security Advisory:</span>
            </div>
            <p className="text-[11px] text-on-surface font-body leading-relaxed italic">
              "😂 Arre bhai! Hack karna itna easy nahi hai! 🛑✋ Padhaai-likhaai me thoda dhyan do, IAS-YAS bano aur desh ko sambhalo ji! 📚🇮🇳 Yaha Gram Panchayat Mahurzari ka clean water portal hack karke kya milega? Yaha se sirf pipeline ka paani hi milega, data nahi! 🚰 Jal hi jeevan hai — jaao paani piyo aur mast raho! 💧🙏"
            </p>
          </div>
          <p className="text-[9px] text-on-surface-variant font-mono mt-2 uppercase tracking-wider">
            Gram Panchayat Mahurzari • 24/7 Monitored Clean Water System
          </p>
        </div>
      </div>
    </div>
  );
}
