import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ApkBanner from './components/ApkBanner';
import LoginView from './components/LoginView';
import HomeTab from './components/HomeTab';
import ReportTab from './components/ReportTab';
import TasksTab from './components/TasksTab';
import AdminTab from './components/AdminTab';
import SupportTab from './components/SupportTab';
import PresentationTab from './components/PresentationTab';
import NotificationModal from './components/NotificationModal';
import { 
  playNotificationChime, 
  sendBrowserNotification, 
  requestPushPermission 
} from './utils/notificationSound';
import { playEmergencySirenSound, stopEmergencySirenSound } from './utils/sirenAudio';

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

  // Notification Center State
  const [notifications, setNotifications] = useState([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const lastSeenAlertIdRef = useRef(null);
  const knownNotifIdsRef = useRef(new Set());
  const isInitialNotifFetchRef = useRef(true);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('gram_lang', newLang);
  };

  // 1. Initial Path Detection & Background Session Verification (Instant 0ms Page Render)
  useEffect(() => {
    try {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (['home', 'report', 'tasks', 'admin', 'support', 'presentation', 'ppt'].includes(path)) {
        setActiveTab(path === 'ppt' ? 'presentation' : path);
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

  // 3. Live Emergency Alert & Village Notification Engine
  useEffect(() => {
    // Request push notification permission after first 2 seconds
    const permTimer = setTimeout(() => {
      requestPushPermission().catch(() => {});
    }, 2000);

    const pollAlerts = async () => {
      try {
        // Poll emergency alert
        const resAlert = await fetch('/api/emergency/alert');
        if (resAlert.ok) {
          const data = await resAlert.json();
          if (data && data.active && data.alert) {
            setEmergencyAlert(data.alert);
            if (lastSeenAlertIdRef.current !== data.alert.id) {
              lastSeenAlertIdRef.current = data.alert.id;
              playEmergencySirenSound();
              sendBrowserNotification('🚨 ' + data.alert.title, {
                body: data.alert.message,
                isEmergency: true
              });
            }
          } else {
            setEmergencyAlert(null);
            stopEmergencySirenSound();
          }
        }

        // Poll village notifications
        const resNotifs = await fetch('/api/notifications');
        if (resNotifs.ok) {
          const data = await resNotifs.json();
          if (data && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);

            let newItemsCount = 0;
            data.notifications.forEach(item => {
              const id = item.id || item._id;
              if (!knownNotifIdsRef.current.has(id)) {
                knownNotifIdsRef.current.add(id);
                if (!isInitialNotifFetchRef.current) {
                  newItemsCount++;
                  sendBrowserNotification(item.title, {
                    body: item.message
                  });
                }
              }
            });

            if (!isInitialNotifFetchRef.current && newItemsCount > 0) {
              playNotificationChime();
              setUnreadNotifsCount(prev => prev + newItemsCount);
            }
            isInitialNotifFetchRef.current = false;
          }
        }
      } catch (err) {
        // Fail quietly
      }
    };

    pollAlerts();
    const interval = setInterval(pollAlerts, 5000); // Poll every 5s for real-time responsiveness
    return () => {
      clearTimeout(permTimer);
      clearInterval(interval);
    };
  }, []);

  const handleDismissAlert = async () => {
    setEmergencyAlert(null);
    stopEmergencySirenSound();
    try {
      await fetch('/api/emergency/dismiss', { method: 'POST' });
    } catch (_) {}
  };

  // 4. Browser History Sync for 0ms Tab Switching
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
        notificationCount={unreadNotifsCount}
        onOpenNotifications={() => {
          setIsNotifModalOpen(true);
          setUnreadNotifsCount(0);
        }}
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
              onClick={handleDismissAlert}
              className="p-1 hover:bg-white/20 rounded-full"
              title="Dismiss Alert"
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

          {activeTab === 'presentation' && (
            <PresentationTab 
              onBack={() => handleTabSwitch('home')} 
            />
          )}
        </div>
      </main>

      {/* Notifications Drawer Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
      />

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
