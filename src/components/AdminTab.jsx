import React, { useState, useEffect, useRef } from 'react';
import { playEmergencySirenSound, stopEmergencySirenSound } from '../utils/sirenAudio';

export default function AdminTab({ currentUser }) {
  const [adminSubTab, setAdminSubTab] = useState('map'); // 'map' | 'siren' | 'issues' | 'stats'
  const [liveData, setLiveData] = useState({
    metrics: { totalUsers: 0, liveNow: 0, activeReports: 0, resolvedReports: 0 },
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

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);

  // 1. Fetch Live Map & System Data
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

  // 2. Map Pin Updater
  const updateMapPins = (data) => {
    if (!leafletMapRef.current || !window.L) return;

    if (!markersLayerRef.current) {
      markersLayerRef.current = window.L.layerGroup().addTo(leafletMapRef.current);
    }
    markersLayerRef.current.clearLayers();

    // Plot Live Users (Blue Icons)
    if (Array.isArray(data.liveUsers)) {
      data.liveUsers.forEach((u) => {
        const lat = u.lat || 21.1822;
        const lon = u.lon || 79.0668;

        const userIcon = window.L.divIcon({
          className: 'custom-user-marker',
          html: `<div style="background:#003b5a; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-weight:bold; font-size:12px; text-transform:uppercase;">${(u.name || u.email)[0]}</div>`,
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

    // Plot Issues (Red = Pending, Green = Resolved)
    if (Array.isArray(data.issues)) {
      data.issues.forEach((iss) => {
        let lat = iss.lat || 0;
        let lon = iss.lon || 0;

        if (lat === 0 && lon === 0) {
          // Slight jitter around village center if GPS was approximate
          lat = 21.1822 + (Math.random() - 0.5) * 0.01;
          lon = 79.0668 + (Math.random() - 0.5) * 0.01;
        }

        const isResolved = iss.status === 'Resolved';
        const color = isResolved ? '#006b58' : '#ba1a1a';

        const issueIcon = window.L.divIcon({
          className: 'custom-issue-marker',
          html: `<div style="background:${color}; color:white; width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px;">${isResolved ? '✓' : '!'}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = window.L.marker([lat, lon], { icon: issueIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; padding:4px; max-width:200px;">
            <strong style="color:${color}; font-size:13px;">${iss.title}</strong><br/>
            <span style="font-size:11px; color:#333;">Status: <b>${iss.status}</b></span><br/>
            <p style="font-size:11px; margin:4px 0; color:#555;">${iss.description || ''}</p>
            <span style="font-size:10px; color:#777;">Reported by: ${iss.reporter || iss.reporterEmail}</span>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 6000); // Polling every 6s without UI freeze

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminSubTab === 'map') {
      const timer = setTimeout(() => {
        if (mapContainerRef.current && window.L && !leafletMapRef.current) {
          const map = window.L.map(mapContainerRef.current).setView([21.1822, 79.0668], 14);
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          leafletMapRef.current = map;
          updateMapPins(liveData);
        } else if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 100);

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-24 md:pb-8 flex flex-col gap-6">
      {/* Admin Header with 0ms Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-bold text-2xl text-primary">
              Admin Live Command Center
            </h2>
            <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-headline font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Real-time
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-body">
            Real GPS tracking, live village users, and instant siren broadcasting.
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
            Live Map ({liveData.metrics.liveNow})
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
            Emergency Siren
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
            All Reports ({liveData.issues.length})
          </button>

          <button
            onClick={() => setAdminSubTab('stats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              adminSubTab === 'stats'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Metrics
          </button>
        </div>
      </div>

      {/* Metrics Row (Always visible for quick oversight) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            Live Online Users
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-headline font-extrabold text-secondary">
              {liveData.metrics.liveNow}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          </div>
          <span className="text-[10px] text-on-surface-variant">Active GPS sessions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            Registered Citizens
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-primary block mt-1">
            {liveData.metrics.totalUsers}
          </span>
          <span className="text-[10px] text-on-surface-variant">Total profiles</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            Pending Complaints
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-error block mt-1">
            {liveData.metrics.activeReports}
          </span>
          <span className="text-[10px] text-on-surface-variant">Awaiting action</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-on-surface-variant">
            Resolved Leaks
          </span>
          <span className="text-2xl sm:text-3xl font-headline font-extrabold text-emerald-600 block mt-1">
            {liveData.metrics.resolvedReports}
          </span>
          <span className="text-[10px] text-on-surface-variant">Fixed on ground</span>
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
                  Interactive Leaflet Village Map
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-headline font-bold">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
                  Live Users ({liveData.liveUsers.length})
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
              className="w-full h-96 sm:h-[480px] rounded-2xl overflow-hidden border border-outline-variant shadow-inner z-0"
            />
          </div>

          {/* Active Live Sessions Table */}
          <div className="bg-white rounded-3xl border border-outline-variant/60 p-5 shadow-sm">
            <h3 className="font-headline font-bold text-base text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">group</span>
              Active Village Sessions & Exact GPS Coordinates
            </h3>

            {liveData.liveUsers.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                No active user sessions currently recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead className="bg-surface-container-low font-headline uppercase font-bold text-on-surface-variant border-b border-outline-variant/60">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">GPS Coordinates</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Login Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {liveData.liveUsers.map((u, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/50">
                        <td className="p-3 font-bold text-on-surface flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
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
                  EMERGENCY SIREN BROADCASTER
                </h3>
                <p className="text-xs text-on-surface-variant font-body">
                  Loud police siren alarm & full-screen emergency announcement on all active phones.
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
              {isPlayingTest ? 'Stop Sound Test' : 'Test Siren Audio'}
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-headline font-bold text-on-surface uppercase tracking-wider block mb-2">
              Instant 1-Click Emergency Presets:
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
              {isBlasting ? 'Blasting Siren...' : 'Blast Siren on All Phones'}
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
                All Reported Community Issues
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

      {/* ════ SUB-TAB 4: VILLAGE WATER METRICS ════ */}
      {adminSubTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-outline-variant/60 p-6 shadow-sm flex flex-col gap-3">
            <h3 className="font-headline font-bold text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">water_drop</span>
              Water Pipeline Network Health
            </h3>
            <div className="space-y-3 font-body text-xs mt-2">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Main Ward Supply Lines</span>
                  <span className="text-secondary">98% Operational</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Community Borewell Pumps</span>
                  <span className="text-primary">92% Operational</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Complaint Resolution Efficiency</span>
                  <span className="text-emerald-600">Avg 4.2 Hours</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant/60 p-6 shadow-sm flex flex-col gap-3">
            <h3 className="font-headline font-bold text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">security</span>
              Gram Panchayat Security & Cooldown Status
            </h3>
            <ul className="text-xs text-on-surface-variant font-body space-y-2 mt-2">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                5-Minute report cooldown active per phone device/IP.
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                High-Accuracy GPS permission enforced for precise pipeline leak pin.
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                Universal Citizen Google/Email sign-in without password.
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                Official Admin & Sarpanch protected credentials.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
