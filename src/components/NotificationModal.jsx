import React, { useState } from 'react';
import { 
  requestPushPermission, 
  isPushPermissionGranted, 
  sendBrowserNotification,
  playNotificationChime 
} from '../utils/notificationSound';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onClearAll, 
  onMarkRead 
}) {
  const [filter, setFilter] = useState('all');
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    setPermissionState(res);
    if (res === 'granted') {
      sendBrowserNotification('✅ सूचना सुरू झाल्या (Notifications Enabled)', {
        body: 'आता माहूरझरी गावातील पाणी पुरवठा व आणीबाणी सूचना थेट तुमच्या फोनवर येतील.',
      });
    } else if (res === 'denied') {
      alert("⚠️ Notification permission was blocked. Please tap the lock/info icon in Chrome address bar and allow Notifications.");
    }
  };

  const handleSendTest = () => {
    playNotificationChime();
    sendBrowserNotification('💧 पाणी पुरवठा सूचना (Test Alert)', {
      body: 'माहूरझरी गाव: सकाळचा पाणी पुरवठा सुरू करण्यात आला आहे. पाण्याची शुद्धता ९९.४% आहे.',
    });
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-surface border-l border-outline-variant/40 shadow-2xl flex flex-col z-10 animate-slideLeft">
        
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/40 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">notifications_active</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-primary leading-tight">
                गाव सूचना केंद्र (Notification Center)
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                पाणी पुरवठा वेळा, दुरुस्ती व आपत्कालीन सूचना
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Permission Request Banner */}
        {permissionState !== 'granted' && (
          <div className="m-3 p-3 rounded-xl bg-primary-fixed/60 border border-primary/20 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">add_alert</span>
              <p className="text-xs text-on-primary-fixed font-semibold leading-tight">
                मोबाईलवर थेट अलर्ट मिळवण्यासाठी नोटिफिकेशन चालू करा
              </p>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shrink-0 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
            >
              चालू करा (Enable)
            </button>
          </div>
        )}

        {/* Filter Pills & Actions */}
        <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-outline-variant/30 bg-surface">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                filter === 'all' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              सर्व ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('emergency')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                filter === 'emergency' 
                  ? 'bg-error text-white shadow-sm' 
                  : 'bg-surface-container text-error hover:bg-error-container/40'
              }`}
            >
              🚨 आपत्कालीन
            </button>
            <button
              onClick={() => setFilter('supply')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                filter === 'supply' 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'bg-surface-container text-secondary hover:bg-secondary-container/40'
              }`}
            >
              💧 पुरवठा
            </button>
            <button
              onClick={() => setFilter('issue')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                filter === 'issue' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-surface-container text-amber-700 hover:bg-amber-100'
              }`}
            >
              🔧 तक्रारी
            </button>
          </div>

          <button
            onClick={handleSendTest}
            title="Test notification on this phone"
            className="text-[10px] text-primary font-bold hover:underline shrink-0 flex items-center gap-0.5"
          >
            <span>🔔 टेस्ट आवाज</span>
          </button>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">notifications_off</span>
              <p className="text-sm font-semibold">कोणत्याही नवीन सूचना नाहीत</p>
              <p className="text-xs text-outline mt-1">नवीन पाणी पुरवठा किंवा दुरुस्ती अपडेट्स येथे दिसतील.</p>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div 
                key={item.id || item._id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.type === 'emergency'
                    ? 'bg-error-container/40 border-error/40 text-on-error-container'
                    : item.type === 'supply'
                    ? 'bg-secondary-container/30 border-secondary/30 text-on-surface'
                    : item.type === 'issue'
                    ? 'bg-amber-50 border-amber-300/60 text-amber-950'
                    : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0 mt-0.5">
                    {item.type === 'emergency' ? '🚨' : item.type === 'supply' ? '💧' : item.type === 'issue' ? '🔧' : '📢'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-headline font-bold text-xs text-primary leading-tight truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                        {item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'आत्ताच')}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {item.author && (
                      <span className="inline-block text-[10px] text-primary/80 font-bold mt-1.5 bg-primary/10 px-2 py-0.5 rounded-md">
                        {item.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/40 bg-surface-container-low flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant font-medium">
            माहूरझरी ग्रामपंचायत • पाणी कक्ष
          </span>
          {notifications.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-xs text-error font-bold hover:underline"
            >
              सर्व सूचना क्लिअर करा
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
