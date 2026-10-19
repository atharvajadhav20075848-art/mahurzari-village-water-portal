import React, { useState, useEffect } from 'react';

export default function ApkBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <div className="bg-gradient-to-r from-secondary to-[#004d3e] text-on-secondary p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-secondary-container/20">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl text-secondary-fixed">install_mobile</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-white leading-tight">
              Gram Jal Android App Available
            </h4>
            <p className="text-xs text-secondary-fixed/90 leading-tight">
              Fast, offline alerts & high-accuracy leak reporting for your phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Direct APK Download Button */}
          <a
            href="/api/download/apk"
            download="Gram-Jal-Mahurzari.apk"
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-white text-secondary hover:bg-surface-container-low font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">android</span>
            Direct APK
          </a>

          {/* PWA Button */}
          <button
            onClick={triggerPwaInstall}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-secondary-fixed text-on-secondary-fixed hover:brightness-105 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">download</span>
            PWA
          </button>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors"
            title="Dismiss banner"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
