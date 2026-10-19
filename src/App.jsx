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
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('en');
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // 1. Initial Path Detection & Auth Check
  useEffect(() => {
    // Detect tab from URL path
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (['home', 'report', 'tasks', 'admin', 'support'].includes(path)) {
      setActiveTab(path);
    }

    const checkSession = async () => {
      const savedEmail = localStorage.getItem('gram_user_email');
      try {
        const res = await fetch('/api/auth/status', {
          headers: savedEmail ? { 'x-user-email': encodeURIComponent(savedEmail) } : {}
        });
        const data = await res.json();
        if (data.loggedIn && data.user) {
          setCurrentUser(data.user);
        } else if (savedEmail) {
          // Fallback if local session exists
          const role = localStorage.getItem('gram_user_role') || 'People/User';
          const name = savedEmail.includes('@') ? savedEmail.split('@')[0] : 'Citizen';
          setCurrentUser({ email: savedEmail, role, name });
        }
      } catch (e) {
        console.warn("Auth check error:", e);
        if (savedEmail) {
          setCurrentUser({
            email: savedEmail,
            role: localStorage.getItem('gram_user_role') || 'People/User',
            name: savedEmail.split('@')[0]
          });
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  // 2. Browser History Sync for 0ms Tab Switching
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    try {
      const newPath = tab === 'home' ? '/home' : `/${tab}`;
      window.history.pushState(null, '', newPath);
    } catch (e) {}
  };

  // 3. Listen to browser Back/Forward navigation
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

  // 4. Poll for Emergency Broadcast Siren
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

  // 5. Logout Handler
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem('gram_user_email');
    localStorage.removeItem('gram_user_role');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
    window.history.pushState(null, '', '/login');
  };

  // Loading state
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
          Loading Gram Jal Portal...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!currentUser) {
    return (
      <LoginView
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
        setLanguage={setLanguage}
      />

      {/* Main Content Area (pt-16 accounts for fixed navbar) */}
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
            <HomeTab currentUser={currentUser} setActiveTab={handleTabSwitch} />
          )}

          {activeTab === 'report' && (
            <ReportTab currentUser={currentUser} setActiveTab={handleTabSwitch} />
          )}

          {activeTab === 'tasks' && (
            <TasksTab currentUser={currentUser} />
          )}

          {activeTab === 'admin' && (
            <AdminTab currentUser={currentUser} />
          )}

          {activeTab === 'support' && (
            <SupportTab />
          )}
        </div>
      </main>

      {/* Mobile Native Bottom Navigation Bar */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
      />
    </div>
  );
}
