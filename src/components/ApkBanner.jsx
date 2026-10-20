import React, { useState, useEffect } from 'react';

const BANNER_DISMISSED_KEY = 'gram_apk_banner_dismissed_until';

export default function ApkBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const until = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (until && Date.now() < parseInt(until, 10)) {
        return true;
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      // 24 hours from now (1 day cooldown)
      const oneDayLater = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(BANNER_DISMISSED_KEY, oneDayLater.toString());
    } catch (e) {}
  };

  const triggerPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("📲 Install App on Phone:\n1. Tap the 3 dots (⋮) in Chrome.\n2. Tap 'Install app' or 'Add to Home screen'.\n3. Tap 'Install'!");
    }
  };

  if (dismissed) return null;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-2 pb-0.5">
      <div className="bg-gradient-to-r from-secondary to-[#004d3e] text-on-secondary px-3 py-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 shadow-sm border border-secondary-container/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl text-secondary-fixed">install_mobile</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-headline font-bold text-xs sm:text-sm text-white leading-tight truncate">
              Gram Jal App (Android)
            </h4>
            <p className="text-[10px] sm:text-xs text-secondary-fixed/90 leading-tight hidden xs:block truncate">
              Fast, offline alerts & leak reporting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="/api/download/apk"
            download="Gram-Jal-Mahurzari.apk"
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white text-secondary hover:bg-surface-container-low font-headline font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">android</span>
            <span>APK</span>
          </a>

          <button
            onClick={triggerPwaInstall}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            <span>PWA</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Dismiss for 24 hours"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
