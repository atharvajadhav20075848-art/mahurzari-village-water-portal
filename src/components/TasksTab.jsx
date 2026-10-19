import React, { useState, useEffect } from 'react';

export default function TasksTab({ currentUser }) {
  const [issues, setIssues] = useState([]);
  const [activeTaskTab, setActiveTaskTab] = useState('pending'); // 'pending' or 'solved'
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionPhoto, setResolutionPhoto] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (Array.isArray(data)) {
        setIssues(data);
      }
    } catch (e) {
      console.error("Fetch tasks error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleResolveSubmit = async (issueId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      const formData = new FormData();
      if (file) formData.append('photo', file);

      setResolvingId(issueId);
      const userEmail = currentUser?.email || 'sarpanch@village.gov';

      try {
        const res = await fetch(`/api/issues/${issueId}/resolve`, {
          method: 'PUT',
          headers: { 'x-user-email': encodeURIComponent(userEmail) },
          body: formData
        });
        if (res.ok) {
          alert("✅ Issue marked as Resolved and proof photo uploaded!");
          fetchTasks();
        } else {
          alert("Failed to resolve issue.");
        }
      } catch (err) {
        console.error(err);
        alert("Error submitting resolution.");
      } finally {
        setResolvingId(null);
      }
    };
    fileInput.click();
  };

  const pending = issues.filter(i => i.status !== 'Resolved');
  const solved = issues.filter(i => i.status === 'Resolved');

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-24 md:pb-8">
      {/* Title */}
      <div className="mb-4">
        <h2 className="font-headline font-bold text-2xl text-primary">
          Panchayat Task Verification
        </h2>
        <p className="text-xs text-on-surface-variant font-body">
          Review reported leaks and verify on-ground repair work.
        </p>
      </div>

      {/* 0ms Tab Switcher: Pending vs Solved */}
      <div className="flex p-1 bg-surface-container rounded-2xl border border-outline-variant/60 mb-6">
        <button
          onClick={() => setActiveTaskTab('pending')}
          className={`flex-1 py-3 text-center font-headline font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTaskTab === 'pending'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Pending Tasks ({pending.length})
        </button>
        <button
          onClick={() => setActiveTaskTab('solved')}
          className={`flex-1 py-3 text-center font-headline font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTaskTab === 'solved'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Resolved Archive ({solved.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          <p className="text-xs mt-2 font-medium">Loading tasks...</p>
        </div>
      ) : activeTaskTab === 'pending' ? (
        pending.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-outline-variant/60 text-center text-on-surface-variant text-sm">
            🎉 Great job! No pending water tasks at the moment.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-outline-variant/60 p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline font-bold text-base text-primary">{item.title}</h3>
                    <p className="text-xs text-on-surface-variant font-body flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                      {item.location}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-error-container text-on-error-container text-[10px] font-headline font-bold uppercase tracking-wider rounded-full shrink-0">
                    Pending Verification
                  </span>
                </div>

                <p className="text-sm text-on-surface font-body">{item.description}</p>

                {/* Evidence Photo */}
                <div className="rounded-2xl overflow-hidden bg-surface-container aspect-video max-h-56">
                  <img
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=600'}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
                  <span className="text-[11px] text-on-surface-variant">
                    Reported by: <strong className="text-on-surface">{item.reporter || item.reporterEmail || 'Villager'}</strong>
                  </span>
                  <button
                    onClick={() => handleResolveSubmit(item.id)}
                    disabled={resolvingId === item.id}
                    className="px-4 py-2.5 bg-secondary text-white hover:bg-secondary/90 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    {resolvingId === item.id ? 'Uploading...' : 'Verify & Mark Resolved'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        solved.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-outline-variant/60 text-center text-on-surface-variant text-sm">
            No resolved records found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {solved.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-outline-variant/60 p-5 shadow-sm flex flex-col gap-3 opacity-95">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline font-bold text-base text-on-surface line-through">{item.title}</h3>
                    <p className="text-xs text-on-surface-variant font-body flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                      {item.location}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-secondary-container text-secondary text-[10px] font-headline font-bold uppercase tracking-wider rounded-full shrink-0">
                    Resolved
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant font-body">{item.description}</p>

                {/* Before / After Dual Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-surface-container">
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      Before
                    </span>
                    <img
                      src={item.photoUrl || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=400'}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-surface-container">
                    <span className="absolute top-1.5 left-1.5 bg-secondary text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      After (Fixed)
                    </span>
                    <img
                      src={item.resolutionPhotoUrl || item.photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=400'}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/40">
                  Resolved by: <strong className="text-secondary">{item.resolvedBy || 'Panchayat Team'}</strong>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
