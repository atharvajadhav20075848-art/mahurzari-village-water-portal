import React, { useState, useEffect } from 'react';
import { getTranslation } from '../utils/translations';

export default function HomeTab({ currentUser, setActiveTab, language = 'en', onUserUpdate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Sarpanch credential change state
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [credentialSaving, setCredentialSaving] = useState(false);

  const t = (key) => getTranslation(language, key);
  const isSarpanch = currentUser && currentUser.role === 'Sarpanch';
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

  // Handle Sarpanch credential change
  const handleCredentialChange = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert(t('password_required') || "New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('password_mismatch') || "Passwords do not match!");
      return;
    }
    if (newPassword.length < 4) {
      alert(t('password_too_short') || "Password must be at least 4 characters.");
      return;
    }

    setCredentialSaving(true);
    try {
      const targetEmail = currentUser.email;
      const savedEmail = localStorage.getItem('gram_user_email') || currentUser.email;

      const res = await fetch(`/api/sarpanch/change-credentials`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': encodeURIComponent(savedEmail)
        },
        body: JSON.stringify({
          currentEmail: targetEmail,
          newEmail: newEmail.trim() || targetEmail,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ " + (t('credentials_updated') || "Credentials updated successfully! Please re-login with new credentials."));
        setCredentialOpen(false);
        setNewEmail('');
        setNewPassword('');
        setConfirmPassword('');
        // If email changed, update localStorage and state
        const updatedEmail = newEmail.trim() ? newEmail.trim().toLowerCase() : targetEmail;
        localStorage.setItem('gram_user_email', updatedEmail);
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }
      } else {
        alert(data.error || "Failed to update credentials.");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection error.");
    } finally {
      setCredentialSaving(false);
    }
  };

  // Only Resolved reports for home feed
  const resolvedIssues = issues.filter(i => i.status === 'Resolved').slice(0, 5);
  const pendingCount = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto px-2.5 sm:px-6 py-2.5 sm:py-4 animate-fadeIn pb-24 md:pb-8">
      {/* Hero Village Banner */}
      <section className="bg-gradient-to-br from-primary via-[#003b5a] to-[#0a4b73] text-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden">
        {/* Subtle decorative watermark icon */}
        <span className="material-symbols-outlined text-[130px] sm:text-[160px] text-white/5 absolute -right-6 -bottom-6 select-none pointer-events-none">
          water_drop
        </span>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-secondary-fixed text-on-secondary-fixed text-[9px] sm:text-[10px] font-headline font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Mahurzari Gram Panchayat
            </span>
            <span className="text-[11px] sm:text-xs text-primary-fixed flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live System Active
            </span>
          </div>

          <h2 className="font-headline font-bold text-xl sm:text-3xl tracking-tight leading-tight mt-0.5">
            {t('village_success')}
          </h2>
          <p className="text-primary-fixed text-xs sm:text-sm font-body max-w-md leading-relaxed">
            {t('together_conserve')}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
            <button
              onClick={() => setActiveTab('report')}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-secondary text-white hover:bg-secondary/90 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_location_alt</span>
              {t('report_leak')}
            </button>
            {isStaff && (
              <button
                onClick={() => setBroadcastOpen(true)}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                {t('broadcast_notice')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 👑 SPECIAL SARPANCH EXECUTIVE DESK (Honorable Sarpanch Panel) */}
      {isStaff && (
        <section className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-white text-[10px] font-headline font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    {isSarpanch ? "OFFICIAL SARPANCH" : "PANCHAYAT ADMIN"}
                  </span>
                  <span className="text-xs text-amber-700 font-bold">
                    {t('sarpanch_badge')}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">
                  {t('sarpanch_panel')}
                </h3>
                <p className="text-xs text-on-surface-variant font-body">
                  {pendingCount > 0 
                    ? `⚠️ ${pendingCount} reports awaiting your verification & repair.` 
                    : "All community reports are verified and solved!"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('tasks')}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-primary text-white hover:bg-primary/95 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                {t('verify_now')} ({pendingCount})
              </button>
              <button
                onClick={() => setBroadcastOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-secondary text-white hover:bg-secondary/95 font-headline font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                {t('broadcast_to_village')}
              </button>
            </div>
          </div>

          {/* Change ID/Password Button for Sarpanch */}
          {isSarpanch && (
            <div className="border-t border-amber-400/30 pt-3 mt-1">
              <button
                onClick={() => {
                  setNewEmail(currentUser.email || '');
                  setCredentialOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-800 font-headline font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">manage_accounts</span>
                {t('change_credentials') || 'Change Login ID / Password'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Broadcast Modal for Sarpanch / Admin */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-outline-variant animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">campaign</span>
                <h3 className="font-headline font-bold text-lg">{t('broadcast_notice')}</h3>
              </div>
              <button onClick={() => setBroadcastOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
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
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold font-headline uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold font-headline uppercase shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {broadcastSending ? 'Sending...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 Sarpanch Credential Change Modal */}
      {credentialOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-outline-variant animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600">
                <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                <h3 className="font-headline font-bold text-lg">{t('change_credentials') || 'Change Login Credentials'}</h3>
              </div>
              <button onClick={() => setCredentialOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Current info */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">info</span>
              <div>
                <p className="text-xs font-headline font-bold text-amber-800 uppercase tracking-wider">{t('current_login') || 'Current Login'}</p>
                <p className="text-sm text-amber-700 font-mono font-medium">{currentUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleCredentialChange} className="flex flex-col gap-3">
              {/* New Email */}
              <div>
                <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1 block">
                  {t('new_login_id') || 'New Login Email ID'}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">alternate_email</span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={currentUser.email}
                    className="w-full pl-10 pr-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant text-sm font-body focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {t('leave_blank_email') || 'Leave as-is if you only want to change password'}
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1 block">
                  {t('new_password') || 'New Password'}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">lock</span>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant text-sm font-body focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 text-on-surface-variant hover:text-on-surface p-0.5 rounded-full cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showNewPass ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1 block">
                  {t('confirm_password') || 'Confirm Password'}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">lock_reset</span>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant text-sm font-body focus:outline-none focus:border-primary"
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {t('password_mismatch') || 'Passwords do not match'}
                  </p>
                )}
                {confirmPassword && confirmPassword === newPassword && newPassword.length >= 4 && (
                  <p className="text-[11px] text-secondary font-medium mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {t('passwords_match') || 'Passwords match ✓'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setCredentialOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold font-headline uppercase cursor-pointer"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={credentialSaving || !newPassword || newPassword !== confirmPassword}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold font-headline uppercase shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {credentialSaving ? (t('saving') || 'Saving...') : (t('update_credentials') || 'Update Credentials')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONLY Real Live Metrics Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="material-symbols-outlined text-secondary text-xl sm:text-2xl">verified</span>
            <span className="text-[10px] sm:text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              {t('resolved_leaks')}
            </span>
          </div>
          <span className="text-2xl sm:text-4xl font-headline font-extrabold text-secondary mt-1 sm:mt-2">
            {resolvedIssues.length}
          </span>
          <span className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 font-body">
            {t('community_repaired')}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="material-symbols-outlined text-error text-xl sm:text-2xl">construction</span>
            <span className="text-[10px] sm:text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              {t('active_issues')}
            </span>
          </div>
          <span className="text-2xl sm:text-4xl font-headline font-extrabold text-error mt-1 sm:mt-2">
            {pendingCount}
          </span>
          <span className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 font-body">
            {t('under_maintenance')}
          </span>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-outline-variant/60 shadow-sm">
        <h3 className="font-headline font-bold text-base sm:text-lg text-primary mb-3 sm:mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg sm:text-xl text-secondary">help_outline</span>
          {t('how_it_works')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-surface-container-low rounded-xl sm:rounded-2xl">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-secondary text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h4 className="font-headline font-bold text-[11px] sm:text-xs uppercase tracking-wider text-primary">
                {t('step1_title')}
              </h4>
              <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 font-body leading-relaxed">
                {t('step1_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-surface-container-low rounded-xl sm:rounded-2xl">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h4 className="font-headline font-bold text-[11px] sm:text-xs uppercase tracking-wider text-primary">
                {t('step2_title')}
              </h4>
              <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 font-body leading-relaxed">
                {t('step2_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-surface-container-low rounded-xl sm:rounded-2xl">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
              3
            </div>
            <div>
              <h4 className="font-headline font-bold text-[11px] sm:text-xs uppercase tracking-wider text-primary">
                {t('step3_title')}
              </h4>
              <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 font-body leading-relaxed">
                {t('step3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Recent SOLVED Reports Only — Community Success Feed */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-secondary">task_alt</span>
            {t('recent_solved') || 'Recently Solved Reports'}
          </h3>
          <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
            {t('verified_fixes') || 'Verified Fixes'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
            <p className="mt-2">Loading village feed...</p>
          </div>
        ) : resolvedIssues.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center text-on-surface-variant text-sm border border-outline-variant/60">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">inbox</span>
            {t('no_solved_yet') || 'No resolved reports yet. Issues will appear here once fixed by the repair team.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedIssues.map((item) => (
              <article key={item.id} className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 font-body">
                      <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                      {item.location}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider shrink-0 bg-secondary-container text-secondary">
                    {t('after_fixed')}
                  </span>
                </div>

                {/* Before/After Photos */}
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
                    <span className="absolute top-1.5 left-1.5 bg-secondary text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      {t('after_fixed')}
                    </span>
                    <img 
                      src={item.resolutionPhotoUrl || item.photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=400'} 
                      alt="After" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-on-surface-variant font-body line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  {item.resolvedBy && (
                    <span className="text-[10px] text-secondary font-medium ml-2 shrink-0 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">person</span>
                      {item.resolvedBy.split('@')[0]}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
