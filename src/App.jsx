import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ApkBanner from './components/ApkBanner';
import LoginView from './components/LoginView';
import HomeTab from './components/HomeTab';
import ReportTab from './components/ReportTab';
import TasksTab from './components/TasksTab';
import AdminTab from './components/AdminTab';
import SupportTab from './components/SupportTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const email = localStorage.getItem('gram_user_email');
      const role = localStorage.getItem('gram_user_role');
      if (email) {
        return {
          email,
          role: role || 'People/User',
          name: email.includes('@') ? email.split('@')[0] : 'User'
        };
      }
    } catch (_) {}
    return null;
  });
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState(() => localStorage.getItem('gram_lang') || 'en');
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('gram_lang', newLang);
  };

  // 1. Initial Path Detection & Background Session Verification (Instant 0ms Page Render)
  useEffect(() => {
    try {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (['home', 'report', 'tasks', 'admin', 'support'].includes(path)) {
        setActiveTab(path);
      }
    } catch (_) {}

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          if (data && data.loggedIn && data.user) {
            setCurrentUser(data.user);
            try {
              localStorage.setItem('gram_user_email', data.user.email);
              localStorage.setItem('gram_user_role', data.user.role);
            } catch (_) {}
          } else {
            const localToken = localStorage.getItem('gram_auth_token');
            if (!localToken) {
              setCurrentUser(null);
              try {
                localStorage.removeItem('gram_user_email');
                localStorage.removeItem('gram_user_role');
              } catch (_) {}
            }
          }
        }
      } catch (e) {
        console.warn("Auth check note:", e);
      }
    };

    checkSession();
  }, []);

  // 2. Real-time Heartbeat for live user tracking
  useEffect(() => {
    if (currentUser && currentUser.email) {
      const sendHeartbeat = () => {
        fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        }).catch(() => {});
      };
      sendHeartbeat();
      const hbInterval = setInterval(sendHeartbeat, 60000); // Every 60 seconds
      return () => clearInterval(hbInterval);
    }
  }, [currentUser]);

  // 3. Browser History Sync for 0ms Tab Switching
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    try {
      const newPath = tab === 'home' ? '/home' : `/${tab}`;
      window.history.pushState(null, '', newPath);
    } catch (e) {}
  };

  // 4. Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (['home', 'report', 'tasks', 'admin', 'support'].includes(path)) {
        setActiveTab(path);
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 5. Poll for Emergency Broadcast Siren
  useEffect(() => {
    const pollAlerts = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const emergency = list.find(n => n.isEmergency && (!n.readBy || !n.readBy.includes(currentUser?.email)));
            if (emergency) {
              setEmergencyAlert(emergency);
            }
          }
        }
      } catch (err) {}
    };

    if (currentUser) {
      pollAlerts();
      const interval = setInterval(pollAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // 6. Logout Handler
  const handleLogout = async () => {
    const emailToLogout = currentUser?.email || localStorage.getItem('gram_user_email');
    localStorage.removeItem('gram_user_email');
    localStorage.removeItem('gram_user_role');
    localStorage.removeItem('gram_auth_token');
    setCurrentUser(null);
    window.history.pushState(null, '', '/login');
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToLogout })
      });
    } catch (e) {}
  };



  // Not logged in -> Show Login View
  if (!currentUser) {
    return (
      <LoginView
        language={language}
        setLanguage={handleLanguageChange}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('home');
          window.history.pushState(null, '', '/home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        onLogout={handleLogout}
        language={language}
        setLanguage={handleLanguageChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        {/* Emergency Alert Banner if Active */}
        {emergencyAlert && (
          <div className="bg-error text-white p-3 shadow-md flex items-center justify-between px-4 sticky top-16 z-40 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">crisis_alert</span>
              <div>
                <strong className="text-xs uppercase tracking-wider block font-headline">
                  🚨 {emergencyAlert.title}
                </strong>
                <p className="text-[11px] leading-tight">{emergencyAlert.message}</p>
              </div>
            </div>
            <button
              onClick={() => setEmergencyAlert(null)}
              className="p-1 hover:bg-white/20 rounded-full"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* APK & PWA Banner */}
        <ApkBanner />

        {/* 0ms Instantaneous Tab Views */}
        <div className="w-full">
          {activeTab === 'home' && (
            <HomeTab 
              currentUser={currentUser} 
              setActiveTab={handleTabSwitch} 
              language={language}
              onUserUpdate={(updatedUser) => setCurrentUser(prev => ({ ...prev, ...updatedUser }))}
            />
          )}

          {activeTab === 'report' && (
            <ReportTab 
              currentUser={currentUser} 
              setActiveTab={handleTabSwitch} 
              language={language} 
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab 
              currentUser={currentUser} 
              language={language} 
            />
          )}

          {activeTab === 'admin' && (
            <AdminTab 
              currentUser={currentUser} 
              language={language} 
            />
          )}

          {activeTab === 'support' && (
            <SupportTab 
              language={language} 
            />
          )}
        </div>
      </main>

      {/* Mobile Native Bottom Navigation Bar */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        language={language}
      />
    </div>
  );
}
