import React, { useState } from 'react';
import { 
  requestPushPermission, 
  sendBrowserNotification,
  playNotificationChime 
} from '../utils/notificationSound';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onClearAll, 
  language = 'en'
}) {
  const [filter, setFilter] = useState('all');
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  if (!isOpen) return null;

  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const t = {
    title: isMr ? 'सूचना केंद्र' : (isHi ? 'सूचना केंद्र' : 'Notifications'),
    sub: isMr ? 'नवीन तक्रारी व पाणी पुरवठा अपडेट्स' : (isHi ? 'हाल के जल अपडेट और रिपोर्ट सूचनाएं' : 'Recent alerts and issue updates'),
    pushTitle: isMr ? 'थेट अलर्टसाठी नोटिफिकेशन्स चालू करा' : (isHi ? 'सीधे अलर्ट के लिए नोटिफिकेशन चालू करें' : 'Enable browser notifications for instant alerts'),
    enableBtn: isMr ? 'चालू करा' : (isHi ? 'चालू करें' : 'Enable'),
    allTab: isMr ? 'सर्व' : (isHi ? 'सभी' : 'All'),
    emergencyTab: isMr ? '🚨 आपत्कालीन' : (isHi ? '🚨 आपातकालीन' : '🚨 Emergency'),
    issuesTab: isMr ? '🔧 तक्रारी' : (isHi ? '🔧 शिकायतें' : '🔧 Issues'),
    testChime: isMr ? '🔔 आवाज चाचणी' : (isHi ? '🔔 टेस्ट साउंड' : '🔔 Test Sound'),
    noNotifs: isMr ? 'कोणतीही सूचना उपलब्ध नाही' : (isHi ? 'कोई नई सूचना नहीं है' : 'No notifications yet'),
    noNotifsSub: isMr ? 'नवीन पाणी तक्रारी व अपडेट्स येथे दिसतील.' : (isHi ? 'नई शिकायतें और अपडेट्स यहां दिखेंगे।' : 'New reports and official updates will appear here.'),
    villagePanchayat: isMr ? 'माहूरझरी ग्रामपंचायत' : (isHi ? 'माहुरझरी ग्रामपंचायत' : 'Mahurzari Gram Panchayat'),
    clearAll: isMr ? 'सर्व क्लिअर करा' : (isHi ? 'सभी हटाएं' : 'Clear all')
  };

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    setPermissionState(res);
    if (res === 'granted') {
      sendBrowserNotification(
        isMr ? '✅ सूचना सुरू झाल्या' : '✅ Notifications Enabled', 
        {
          body: isMr 
            ? 'माहूरझरी पाणी पुरवठा व तक्रारींचे अलर्ट थेट मिळतील.' 
            : 'You will receive live village water updates and alerts.'
        }
      );
    } else if (res === 'denied') {
      alert("Notification permission was blocked in browser settings. Please allow notifications in site settings.");
    }
  };

  const handleSendTest = () => {
    playNotificationChime();
    sendBrowserNotification('💧 Water Alert (Test)', {
      body: 'Mahurzari Water Portal: Notification test chime played successfully.',
    });
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'emergency') return n.isEmergency || n.type === 'emergency' || n.type === 'alert';
    if (filter === 'issue') return n.type === 'issue' || (n.title && n.title.toLowerCase().includes('issue'));
    return n.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-surface border-l border-outline-variant/40 shadow-2xl flex flex-col z-10 animate-slideLeft">
        
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-primary leading-tight">
                {t.title}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                {t.sub}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            title="Close"
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
                {t.pushTitle}
              </p>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shrink-0 shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              {t.enableBtn}
            </button>
          </div>
        )}

        {/* Filter Pills & Actions */}
        <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-outline-variant/30 bg-surface">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'all' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t.allTab} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('emergency')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'emergency' 
                  ? 'bg-error text-white shadow-sm' 
                  : 'bg-surface-container text-error hover:bg-error-container/40'
              }`}
            >
              {t.emergencyTab}
            </button>
            <button
              onClick={() => setFilter('issue')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'issue' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-surface-container text-amber-800 hover:bg-amber-100'
              }`}
            >
              {t.issuesTab}
            </button>
          </div>

          <button
            onClick={handleSendTest}
            title="Test notification chime"
            className="text-[11px] text-primary font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>{t.testChime}</span>
          </button>
        </div>

        {/* Notifications Scroll List - REAL MONGODB DATA ONLY */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">notifications_none</span>
              <p className="text-sm font-semibold">{t.noNotifs}</p>
              <p className="text-xs text-outline mt-1">{t.noNotifsSub}</p>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div 
                key={item.id || item._id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isEmergency || item.type === 'emergency'
                    ? 'bg-error-container/30 border-error/40 text-on-error-container'
                    : item.type === 'issue' || (item.title && item.title.toLowerCase().includes('issue'))
                    ? 'bg-amber-50/70 border-amber-300/50 text-on-surface'
                    : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 mt-0.5">
                    {item.isEmergency || item.type === 'emergency' ? '🚨' : (item.type === 'issue' ? '🔧' : '📢')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-headline font-bold text-xs text-primary leading-tight truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant/70 shrink-0 font-medium">
                        {item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {(item.senderName || item.author) && (
                      <span className="inline-block text-[10px] text-primary/80 font-bold mt-1.5 bg-primary/10 px-2 py-0.5 rounded-md">
                        {item.senderName || item.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant font-medium">
            {t.villagePanchayat}
          </span>
          {notifications.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-xs text-error font-bold hover:underline cursor-pointer"
            >
              {t.clearAll}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
