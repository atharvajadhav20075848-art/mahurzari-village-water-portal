import React, { useState, useEffect } from 'react';
import { getTranslation } from '../utils/translations';

export default function HomeTab({ currentUser, setActiveTab, language = 'en' }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const t = (key) => getTranslation(language, key);
  const isStaff = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Sarpanch');

  const loadFeed = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (Array.isArray(data)) {
        setIssues(data);
      }
    } catch (e) {
      console.error("Home feed fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const sendBroadcastNotice = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    setBroadcastSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMsg,
          senderName: currentUser.name || 'Panchayat Office',
          senderRole: currentUser.role || 'Sarpanch',
          targetRole: 'all',
          type: 'broadcast'
        })
      });
      if (res.ok) {
        alert("✅ Village announcement broadcasted to all users!");
        setBroadcastOpen(false);
        setBroadcastTitle('');
        setBroadcastMsg('');
      } else {
        alert("Failed to send broadcast.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending announcement.");
    } finally {
      setBroadcastSending(false);
    }
  };

  const resolvedIssues = issues.filter(i => i.status === 'Resolved');
  const pendingIssues = issues.filter(i => i.status !== 'Resolved');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-20 md:pb-8">
      {/* Hero Village Banner */}
      <section className="bg-gradient-to-r from-primary to-[#0a4b73] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-headline font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Mahurzari Gram Panchayat
            </span>
            <span className="text-xs text-primary-fixed flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live System Active
            </span>
          </div>
          <h2 className="font-headline font-bold text-2xl sm:text-3xl tracking-tight mb-1">
            {t('village_success')}
          </h2>
          <p className="text-primary-fixed text-sm sm:text-base font-body max-w-md">
            {t('together_conserve')}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setActiveTab('report')}
              className="px-4 py-2.5 bg-secondary text-white hover:bg-secondary/90 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_location_alt</span>
              {t('report_leak')}
            </button>
            {isStaff && (
              <button
                onClick={() => setBroadcastOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                {t('broadcast_notice')}
              </button>
            )}
          </div>
        </div>

        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
          <span className="material-symbols-outlined text-5xl sm:text-6xl text-secondary-fixed">
            water_drop
          </span>
        </div>
      </section>

      {/* Broadcast Modal for Sarpanch / Admin */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-outline-variant animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">campaign</span>
                <h3 className="font-headline font-bold text-lg">{t('broadcast_notice')}</h3>
              </div>
              <button onClick={() => setBroadcastOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={sendBroadcastNotice} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1 block">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Water Pipeline Maintenance Notice"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant text-sm font-body"
                />
              </div>
              <div>
                <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1 block">Message</label>
                <textarea
                  rows={3}
                  placeholder="Detailed announcement for villagers..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant text-sm font-body"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold font-headline uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold font-headline uppercase shadow-md flex items-center gap-1.5"
                >
                  {broadcastSending ? 'Sending...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONLY Real Live Metrics Cards (Fake Water Purity & Daily Supply REMOVED) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">verified</span>
            <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              {t('resolved_leaks')}
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-headline font-extrabold text-secondary mt-2">
            {resolvedIssues.length}
          </span>
          <span className="text-xs text-on-surface-variant mt-1 font-body">
            {t('community_repaired')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-2xl">construction</span>
            <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              {t('active_issues')}
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-headline font-extrabold text-error mt-2">
            {pendingIssues.length}
          </span>
          <span className="text-xs text-on-surface-variant mt-1 font-body">
            {t('under_maintenance')}
          </span>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
        <h3 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-secondary">help_outline</span>
          {t('how_it_works')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                {t('step1_title')}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">
                {t('step1_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                {t('step2_title')}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">
                {t('step2_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              3
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                {t('step3_title')}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">
                {t('step3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity / Community Feed */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-primary">feed</span>
            {t('community_feed')}
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">
            {t('live_updates')}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
            <p className="mt-2">Loading village feed...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center text-on-surface-variant text-sm">
            No issues reported yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.slice(0, 6).map((item) => (
              <article key={item.id} className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 font-body">
                      <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                      {item.location}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider shrink-0 ${
                    item.status === 'Resolved' 
                      ? 'bg-secondary-container text-secondary' 
                      : 'bg-error-container text-on-error-container'
                  }`}>
                    {item.status === 'Resolved' ? t('after_fixed') : t('pending')}
                  </span>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video">
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      {t('before')}
                    </span>
                    <img 
                      src={item.photoUrl || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=400'} 
                      alt="Before" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video">
                    <span className={`absolute top-1.5 left-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10 ${
                      item.status === 'Resolved' ? 'bg-secondary' : 'bg-black/50'
                    }`}>
                      {item.status === 'Resolved' ? t('after_fixed') : t('pending')}
                    </span>
                    <img 
                      src={item.resolutionPhotoUrl || item.photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=400'} 
                      alt="After" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant font-body line-clamp-2">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
