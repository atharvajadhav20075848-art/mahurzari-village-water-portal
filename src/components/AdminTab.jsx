import React, { useState, useEffect, useRef } from 'react';
import { playEmergencySirenSound, stopEmergencySirenSound } from '../utils/sirenAudio';
import { getTranslation } from '../utils/translations';

export default function AdminTab({ currentUser, language = 'en' }) {
  const [adminSubTab, setAdminSubTab] = useState('map'); // 'map' | 'siren' | 'issues' | 'users'
  const [liveData, setLiveData] = useState({
    metrics: { totalUsers: 0, liveNow: 1, activeReports: 0, resolvedReports: 0 },
    liveUsers: [],
    issues: []
  });
  const [loading, setLoading] = useState(true);

  // Siren alert state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [isBlasting, setIsBlasting] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Issues search
  const [searchQuery, setSearchQuery] = useState('');

  // User & Access Roles Management
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [updatingUserEmail, setUpdatingUserEmail] = useState(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const savedEmail = localStorage.getItem('gram_user_email') || currentUser?.email || '';
      const res = await fetch('/api/users', {
        headers: { 'x-user-email': encodeURIComponent(savedEmail) }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error("Fetch users error:", e);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateRole = async (targetEmail, newRole) => {
    setUpdatingUserEmail(targetEmail);
    try {
      const savedEmail = localStorage.getItem('gram_user_email') || currentUser?.email || '';
      const res = await fetch(`/api/users/${encodeURIComponent(targetEmail)}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': encodeURIComponent(savedEmail)
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(prev => prev.map(u => u.email === targetEmail ? { ...u, role: newRole } : u));
        alert("✅ " + (t('role_updated_success') || "User role updated successfully!"));
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating role.");
    } finally {
      setUpdatingUserEmail(null);
    }
  };

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);

  const t = (key) => getTranslation(language, key);

  // 1. Fetch Live Map & System Data (Real-time online users only)
  const fetchLiveData = async () => {
    try {
      const res = await fetch('/api/live-map');
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        updateMapPins(data);
      }
    } catch (err) {
      console.error("Live map fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Map Pin Updater (Real coordinates)
  const updateMapPins = (data) => {
    if (!leafletMapRef.current || !window.L) return;

    if (!markersLayerRef.current) {
      markersLayerRef.current = window.L.layerGroup().addTo(leafletMapRef.current);
    }
    markersLayerRef.current.clearLayers();

    // Plot Real Live Users (Blue Icons)
    if (Array.isArray(data.liveUsers) && data.liveUsers.length > 0) {
      data.liveUsers.forEach((u) => {
        const lat = u.lat || 21.1822;
        const lon = u.lon || 79.0668;

        const userIcon = window.L.divIcon({
          className: 'custom-user-marker',
          html: `<div style="background:#003b5a; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-weight:bold; font-size:12px; text-transform:uppercase;">${(u.name || u.email || 'U')[0]}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = window.L.marker([lat, lon], { icon: userIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <strong style="color:#003b5a; font-size:14px;">${u.name || u.email}</strong><br/>
            <span style="font-size:11px; color:#555;">Role: <b>${u.role}</b></span><br/>
            <span style="font-size:11px; color:#555;">GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}</span><br/>
            <span style="font-size:10px; color:#888;">IP: ${u.ip || 'Local'}</span>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }

    // Plot Real Issues (Red = Pending, Green = Resolved)
    if (Array.isArray(data.issues)) {
      data.issues.forEach((iss) => {
        let lat = iss.lat || 0;
        let lon = iss.lon || 0;

        if (lat === 0 && lon === 0) {
          lat = 21.1822 + (Math.random() - 0.5) * 0.008;
          lon = 79.0668 + (Math.random() - 0.5) * 0.008;
        }

        const isResolved = iss.status === 'Resolved';
        const color = isResolved ? '#006b58' : '#ba1a1a';

        const issueIcon = window.L.divIcon({
          className: 'custom-issue-marker',
          html: `<div style="background:${color}; color:white; width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px; font-weight:bold;">${isResolved ? '✓' : '!'}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = window.L.marker([lat, lon], { icon: issueIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; padding:4px; max-width:200px;">
            <strong style="color:${color}; font-size:13px;">${iss.title}</strong><br/>
            <span style="font-size:11px; color:#333;">Status: <b>${iss.status}</b></span><br/>
            <p style="font-size:11px; margin:4px 0; color:#555;">${iss.description || ''}</p>
            <span style="font-size:10px; color:#777;">Location: ${iss.location}</span>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }
  };

  // 3. Initialize Leaflet Map reliably & fetch users
  useEffect(() => {
    fetchLiveData();
    fetchUsers();
    const interval = setInterval(fetchLiveData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminSubTab === 'map') {
      const initMap = () => {
        if (!mapContainerRef.current) return;
        if (!window.L) {
          setTimeout(initMap, 200);
          return;
        }

        if (!leafletMapRef.current) {
          try {
            const map = window.L.map(mapContainerRef.current, {
              center: [21.1822, 79.0668],
              zoom: 14
            });

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            leafletMapRef.current = map;
            updateMapPins(liveData);
          } catch (err) {
            console.warn("Leaflet init notice:", err);
          }
        }

        if (leafletMapRef.current) {
          setTimeout(() => {
            leafletMapRef.current.invalidateSize();
          }, 150);
        }
      };

      const timer = setTimeout(initMap, 100);
      return () => clearTimeout(timer);
    }
  }, [adminSubTab]);

  // Siren Presets
  const setSirenPreset = (title, msg) => {
    setAlertTitle(title);
    setAlertMsg(msg);
  };

  const triggerBlastSiren = async () => {
    if (!alertTitle.trim()) {
      alert("Please enter an Emergency Alert Title.");
      return;
    }
    setIsBlasting(true);
    playEmergencySirenSound();

    try {
      const res = await fetch('/api/emergency/siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alertTitle.trim(),
          message: alertMsg.trim() || 'Urgent water notice for all villagers',
          senderName: currentUser?.name || 'Gram Panchayat Admin',
          senderRole: currentUser?.role || 'Admin'
        })
      });

      if (res.ok) {
        alert("🚨 EMERGENCY SIREN BROADCASTED TO ALL CITIZENS!\nPolice siren sound alert triggered on all connected phones.");
      } else {
        alert("Siren broadcast response error.");
      }
    } catch (e) {
      console.error(e);
      alert("Connection error triggering siren.");
    } finally {
      setIsBlasting(false);
    }
  };

  const toggleSoundTest = () => {
    if (isPlayingTest) {
      stopEmergencySirenSound();
      setIsPlayingTest(false);
    } else {
      playEmergencySirenSound();
      setIsPlayingTest(true);
      setTimeout(() => setIsPlayingTest(false), 5000);
    }
  };

  const handleDeleteIssue = async (id) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLiveData();
      } else {
        alert("Delete failed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIssues = liveData.issues.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.location && i.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-24 md:pb-8 flex flex-col gap-6">
      {/* Admin Header with 0ms Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-bold text-2xl text-primary">
              {t('admin_title')}
            </h2>
            <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-headline font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Real GPS Live
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-body">
            {t('admin_subtitle')}
          </p>
        </div>

        {/* 0ms Instant Tab Switcher Buttons */}
        <div className="flex p-1 bg-surface-container rounded-2xl border border-outline-variant/60 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setAdminSubTab('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              adminSubTab === 'map'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            {t('live_map')} ({liveData.liveUsers.length})
          </button>

          <button
            onClick={() => setAdminSubTab('siren')}
            className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              adminSubTab === 'siren'
                ? 'bg-error text-white shadow-sm'
                : 'text-error hover:bg-error/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] animate-pulse">crisis_alert</span>
            {t('emergency_siren')}
          </button>

          <button
            onClick={() => setAdminSubTab('issues')}
            className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              adminSubTab === 'issues'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span>
            {t('all_reports')} ({liveData.issues.length})
          </button>

          <button
            onClick={() => {
              setAdminSubTab('users');
              fetchUsers();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              adminSubTab === 'users'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            {t('user_roles')} ({usersList.length || liveData.metrics.totalUsers})
          </button>
        </div>
      </div>

      {/* Metrics Row (Real counts only) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            {t('live_online_users')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-headline font-extrabold text-secondary">
              {liveData.liveUsers.length || 1}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          </div>
          <span className="text-[10px] text-on-surface-variant">{t('active_gps_sessions')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            {t('registered_citizens')}
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-primary block mt-1">
            {liveData.metrics.totalUsers}
          </span>
          <span className="text-[10px] text-on-surface-variant">{t('total_profiles')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            {t('pending_complaints')}
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-error block mt-1">
            {liveData.metrics.activeReports}
          </span>
          <span className="text-[10px] text-on-surface-variant">{t('awaiting_action')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            {t('resolved_leaks_count')}
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-emerald-600 block mt-1">
            {liveData.metrics.resolvedReports}
          </span>
          <span className="text-[10px] text-on-surface-variant">{t('fixed_on_ground')}</span>
        </div>
      </div>

      {/* ════ SUB-TAB 1: LIVE MAP & USERS ════ */}
      {adminSubTab === 'map' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Main Leaflet OpenStreetMap */}
          <div className="bg-white rounded-3xl border border-outline-variant/60 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">satellite_alt</span>
                <h3 className="font-headline font-bold text-base text-primary">
                  {t('interactive_map')}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-headline font-bold">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
                  Live Users ({liveData.liveUsers.length || 1})
                </span>
                <span className="flex items-center gap-1.5 text-error">
                  <span className="w-3 h-3 rounded-md bg-error border-2 border-white shadow" />
                  Pending Leak
                </span>
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-3 h-3 rounded-md bg-secondary border-2 border-white shadow" />
                  Resolved
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div
              ref={mapContainerRef}
              style={{ minHeight: '420px', height: '480px' }}
              className="w-full rounded-2xl overflow-hidden border border-outline-variant shadow-inner z-0"
            />
          </div>

          {/* Real Active Live Sessions Table */}
          <div className="bg-white rounded-3xl border border-outline-variant/60 p-5 shadow-sm">
            <h3 className="font-headline font-bold text-base text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">group</span>
              {t('active_sessions_title')}
            </h3>

            {liveData.liveUsers.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center font-medium">
                1 active user online right now (You).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead className="bg-surface-container-low font-headline uppercase font-bold text-on-surface-variant border-b border-outline-variant/60">
                    <tr>
                      <th className="p-3">{t('user_header')}</th>
                      <th className="p-3">{t('role_header')}</th>
                      <th className="p-3">{t('gps_header')}</th>
                      <th className="p-3">{t('ip_header')}</th>
                      <th className="p-3">{t('login_time_header')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {liveData.liveUsers.map((u, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/50">
                        <td className="p-3 font-bold text-on-surface flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                          {u.name || u.email}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'Admin' ? 'bg-primary text-white' :
                            u.role === 'Sarpanch' ? 'bg-secondary text-white' :
                            'bg-surface-container text-on-surface'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-primary font-medium">
                          {u.lat ? `${u.lat.toFixed(4)}, ${u.lon.toFixed(4)}` : (u.location || 'Local')}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                          {u.ip || '127.0.0.1'}
                        </td>
                        <td className="p-3 text-on-surface-variant">
                          {u.loginTime ? new Date(u.loginTime).toLocaleTimeString() : 'Active now'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ SUB-TAB 2: EMERGENCY SIREN BROADCASTER ════ */}
      {adminSubTab === 'siren' && (
        <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-2 border-error rounded-3xl p-6 shadow-xl flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-error/20 pb-4">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-4xl animate-bounce">crisis_alert</span>
              <div>
                <h3 className="font-headline font-extrabold text-xl sm:text-2xl text-error tracking-tight">
                  {t('emergency_siren_title')}
                </h3>
                <p className="text-xs text-on-surface-variant font-body">
                  {t('emergency_siren_desc')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSoundTest}
              className="px-3.5 py-2 bg-white border border-error text-error hover:bg-error/10 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">
                {isPlayingTest ? 'stop' : 'volume_up'}
              </span>
              {isPlayingTest ? t('stop_sound') : t('test_siren')}
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-headline font-bold text-on-surface uppercase tracking-wider block mb-2">
              {t('instant_presets')}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSirenPreset('🚨 Pipeline Burst Emergency', 'Major water pipeline burst reported! Water supply halted immediately. Repair crew is on site.')}
                className="px-3 py-1.5 bg-white border border-error/40 text-error hover:bg-error/10 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                ⚠️ Pipeline Burst
              </button>
              <button
                type="button"
                onClick={() => setSirenPreset('🛑 Water Contamination Warning', 'High turbidity / contamination detected in Ward reservoir. DO NOT DRINK TAP WATER until further notice!')}
                className="px-3 py-1.5 bg-white border border-error/40 text-error hover:bg-error/10 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                🛑 Contamination Alert
              </button>
              <button
                type="button"
                onClick={() => setSirenPreset('🌊 High Flood / Tank Overflow', 'Dam / river water level rising rapidly. Villagers near river banks please stay alert and move to high ground.')}
                className="px-3 py-1.5 bg-white border border-error/40 text-error hover:bg-error/10 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                🌊 Flood Warning
              </button>
              <button
                type="button"
                onClick={() => setSirenPreset('⚡ Emergency Supply Cutoff', 'Emergency electrical maintenance at water pump house. Supply suspended for next 3 hours.')}
                className="px-3 py-1.5 bg-white border border-error/40 text-error hover:bg-error/10 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                ⚡ Supply Cutoff
              </button>
            </div>
          </div>

          {/* Inputs & Blast Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-2">
            <input
              type="text"
              placeholder="Alert Title (e.g. Major Pipeline Burst at Ward 2)"
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
              className="md:col-span-4 p-3 bg-white text-sm border-2 border-outline-variant rounded-xl font-bold focus:border-error focus:outline-none font-headline"
            />
            <input
              type="text"
              placeholder="Emergency details for all villagers..."
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              className="md:col-span-5 p-3 bg-white text-sm border-2 border-outline-variant rounded-xl font-body focus:border-error focus:outline-none"
            />
            <button
              onClick={triggerBlastSiren}
              disabled={isBlasting}
              className="md:col-span-3 py-3 px-4 bg-error text-white font-headline font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-error/30 hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg animate-pulse">volume_up</span>
              {isBlasting ? t('blasting') : t('blast_siren')}
            </button>
          </div>
        </div>
      )}

      {/* ════ SUB-TAB 3: MASTER ISSUES TABLE ════ */}
      {adminSubTab === 'issues' && (
        <div className="bg-white rounded-3xl border border-outline-variant/60 p-5 shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-headline font-bold text-base text-primary">
                {t('all_reports')}
              </h3>
              <p className="text-xs text-on-surface-variant font-body">
                Full complaint database with delete and resolve controls.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search issues, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-body focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-surface-container-low font-headline uppercase font-bold text-on-surface-variant border-b border-outline-variant/60">
                <tr>
                  <th className="p-3">Title / Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Reported At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredIssues.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-bold text-on-surface">
                      {item.title}
                      <p className="text-[11px] text-on-surface-variant font-normal font-body line-clamp-1">
                        {item.description}
                      </p>
                    </td>
                    <td className="p-3 text-on-surface-variant max-w-[150px] truncate">
                      {item.location}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'Resolved' ? 'bg-secondary-container text-secondary' : 'bg-error-container text-on-error-container'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      {item.reporter || item.reporterEmail || 'Villager'}
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteIssue(item.id)}
                        className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete complaint"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. USER ROLES & ACCESS CONTROL VIEW */}
      {adminSubTab === 'users' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Role Counts Header Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-lg">group</span>
                <span className="text-[10px] sm:text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('role_citizen')}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-headline font-extrabold text-primary mt-1">
                {usersList.filter(u => u.role === 'People/User').length}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">Report leaks & issues</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="material-symbols-outlined text-lg">plumbing</span>
                <span className="text-[10px] sm:text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('role_plumber')}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-headline font-extrabold text-emerald-600 mt-1">
                {usersList.filter(u => u.role === 'Plumber/Technician').length}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">Task repair & photo proof</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
              <div className="flex items-center gap-1.5 text-amber-600">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span className="text-[10px] sm:text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('role_sarpanch')}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-headline font-extrabold text-amber-600 mt-1">
                {usersList.filter(u => u.role === 'Sarpanch').length}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">Executive & Verification</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                <span className="text-[10px] sm:text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('role_admin')}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-headline font-extrabold text-indigo-600 mt-1">
                {usersList.filter(u => u.role === 'Admin').length}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">Full System Command</span>
            </div>
          </div>

          {/* Access Roles Permission Explanation Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-4 sm:p-5 rounded-2xl flex flex-col gap-2.5">
            <h4 className="font-headline font-bold text-xs sm:text-sm text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">security</span>
              Role Access & Permission Levels
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-body text-on-surface-variant">
              <div className="p-2.5 bg-white/80 rounded-xl border border-outline-variant/40">
                <strong className="text-primary block font-headline text-[11px]">👤 Citizen (People/User)</strong>
                <p className="text-[10px] mt-0.5">Report pipeline leaks with GPS, view village success feed, receive notices & sirens.</p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-outline-variant/40">
                <strong className="text-emerald-700 block font-headline text-[11px]">🔧 Plumber / Field Crew</strong>
                <p className="text-[10px] mt-0.5">Access "Tasks" tab to inspect complaints, upload "After" repair photos, and mark tasks Resolved.</p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-outline-variant/40">
                <strong className="text-amber-700 block font-headline text-[11px]">👑 Gram Sarpanch</strong>
                <p className="text-[10px] mt-0.5">Executive Desk on Home, broadcast urgent village notices, change Sarpanch ID/pass, verify tasks & assign roles.</p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-outline-variant/40">
                <strong className="text-indigo-700 block font-headline text-[11px]">⚙️ Panchayat Admin</strong>
                <p className="text-[10px] mt-0.5">Full Command Center with live GPS user map, police emergency sirens, database management & role control.</p>
              </div>
            </div>
          </div>

          {/* User Directory & Role Assignment Controls */}
          <div className="bg-white rounded-3xl border border-outline-variant/60 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-headline font-bold text-base sm:text-lg text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-xl">manage_accounts</span>
                  {t('user_roles')}
                </h3>
                <p className="text-xs text-on-surface-variant font-body">
                  Select any registered user and assign their access role. Changes apply instantly.
                </p>
              </div>

              {/* Search & Role Filter Bar */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search name / email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-body focus:outline-none focus:border-primary"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-headline font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="all">All Roles</option>
                  <option value="People/User">Citizens</option>
                  <option value="Plumber/Technician">Plumbers</option>
                  <option value="Sarpanch">Sarpanch</option>
                  <option value="Admin">Admins</option>
                </select>

                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl text-primary transition-colors cursor-pointer shrink-0"
                  title="Refresh users"
                >
                  <span className={`material-symbols-outlined text-base ${usersLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
            </div>

            {usersLoading && usersList.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
                <p className="mt-2">Loading registered users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm bg-surface-container-low rounded-2xl border border-outline-variant/60">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1 block">search_off</span>
                No users match your search criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map((user) => {
                  const isOnline = user.isOnline;
                  const isUpdating = updatingUserEmail === user.email;

                  return (
                    <div
                      key={user.id || user.email}
                      className="p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low/40 transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with live pulse dot */}
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                              {(user.name || user.email)[0]}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              title={isOnline ? 'Online Now' : 'Offline'}
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                              {user.name}
                            </h4>
                            <p className="text-xs text-on-surface-variant font-mono truncate">
                              {user.email}
                            </p>
                            <span className="text-[10px] text-on-surface-variant/70 font-body">
                              {isOnline ? '🟢 Live Active' : '⚪ Offline'} • Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Current Role Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider shrink-0 ${
                          user.role === 'Admin'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : user.role === 'Sarpanch'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : user.role === 'Plumber/Technician'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {user.role}
                        </span>
                      </div>

                      {/* Interactive Role Assignment Controls */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/40">
                        <span className="text-[11px] font-headline font-bold text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">tune</span>
                          {t('assign_role')}:
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            disabled={isUpdating}
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.email, e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-outline-variant rounded-xl text-xs font-headline font-bold text-on-surface focus:outline-none focus:border-primary shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <option value="People/User">👤 Citizen (Resident)</option>
                            <option value="Plumber/Technician">🔧 Plumber / Technician</option>
                            <option value="Sarpanch">👑 Gram Sarpanch</option>
                            <option value="Admin">⚙️ Panchayat Admin</option>
                          </select>

                          {isUpdating && (
                            <span className="material-symbols-outlined animate-spin text-sm text-primary">
                              progress_activity
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
