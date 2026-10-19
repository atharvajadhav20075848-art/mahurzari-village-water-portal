import React, { useState, useEffect } from 'react';

export default function HomeTab({ currentUser, setActiveTab }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn">
      {/* Hero Village Banner */}
      <section className="bg-gradient-to-r from-primary to-[#0a4b73] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-headline font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Mahurzari Gram Panchayat
            </span>
            <span className="text-xs text-primary-fixed flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Water Supply Active
            </span>
          </div>
          <h2 className="font-headline font-bold text-2xl sm:text-3xl tracking-tight mb-1">
            Village Water Success
          </h2>
          <p className="text-primary-fixed text-sm sm:text-base font-body max-w-md">
            Together we conserve water, report leakages instantly, and ensure 100% clean drinking water.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setActiveTab('report')}
              className="px-4 py-2.5 bg-secondary text-white hover:bg-secondary/90 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_location_alt</span>
              Report Leak / Issue
            </button>
            {isStaff && (
              <button
                onClick={() => setBroadcastOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                Broadcast Notice
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
                <h3 className="font-headline font-bold text-lg">Send Village Announcement</h3>
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
                  placeholder="e.g. Tomorrow Water Supply Timing"
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
                  {broadcastSending ? 'Sending...' : 'Broadcast to Village'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3 Metrics Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Resolved Leaks
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-secondary mt-1">
            {resolvedIssues.length}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Community repaired</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Active Issues
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-error mt-1">
            {pendingIssues.length}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Under maintenance</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Water Purity
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-primary mt-1">
            99.4%
          </span>
          <span className="text-[11px] text-secondary font-medium mt-0.5">WHO Standard OK</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Daily Supply
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-primary mt-1">
            180k L
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Morning & Evening</span>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
        <h3 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-secondary">help_outline</span>
          How Citizen Water Reporting Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                Report Issue
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body">
                Spot a pipeline leak, contaminated water, or broken tap? Take a photo and submit with exact GPS.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                Panchayat Verification
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body">
                Sarpanch & technical team review the issue on the live map and assign a local plumber/repair crew.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              3
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                Resolved with Proof
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 font-body">
                Technician uploads the 'After' repair photo. The issue is closed and reported to the village feed.
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
            Community Solved & Active Feed
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">
            Live updates
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
                    {item.status}
                  </span>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video">
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      Before
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
                      {item.status === 'Resolved' ? 'After (Fixed)' : 'Pending'}
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
