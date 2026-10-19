import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/translations';

const ISSUE_CATEGORIES = [
  { id: 'Water Related Issue', label: 'Water Related Issue', icon: 'water_drop' },
  { id: 'Pipe Leakage', label: 'Pipe Leakage', icon: 'plumbing' },
  { id: 'Water Contamination', label: 'Dirty / Bad Water', icon: 'opacity' },
  { id: 'Borewell Broken', label: 'Borewell Pump Broken', icon: 'build' },
  { id: 'Low Pressure', label: 'Low Pressure Supply', icon: 'speed' },
  { id: 'Overflow / Waste', label: 'Tank Overflow / Waste', icon: 'waves' }
];

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export default function ReportTab({ currentUser, setActiveTab, language = 'en' }) {
  const [selectedType, setSelectedType] = useState('Water Related Issue');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gpsLocation, setGpsLocation] = useState({ lat: null, lon: null, text: 'Fetching High-Accuracy GPS...' });
  const [isLocating, setIsLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  const t = (key) => getTranslation(language, key);

  // 1. High-Accuracy Location Fetcher
  const acquireHighAccuracyGps = () => {
    setIsLocating(true);
    setGpsLocation(prev => ({ ...prev, text: 'Requesting High-Accuracy GPS (±5m)...' }));

    if (!navigator.geolocation) {
      setGpsLocation({ lat: 21.1822, lon: 79.0668, text: 'GPS not supported by browser' });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 10);
        setGpsLocation({
          lat,
          lon,
          text: `GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)} (±${acc}m Accurate)`
        });
        setIsLocating(false);

        // Update Mini Leaflet Map
        if (leafletMapRef.current && window.L) {
          leafletMapRef.current.setView([lat, lon], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lon]);
          } else {
            markerRef.current = window.L.marker([lat, lon]).addTo(leafletMapRef.current);
          }
        }
      },
      (err) => {
        console.warn("GPS High Accuracy prompt notice:", err);
        setGpsLocation({ lat: 21.1822, lon: 79.0668, text: 'Village Center (GPS permission required)' });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 2. Initialize Mini Leaflet Map reliably
  useEffect(() => {
    acquireHighAccuracyGps();

    const initMiniMap = () => {
      if (!mapContainerRef.current) return;
      if (!window.L) {
        setTimeout(initMiniMap, 200);
        return;
      }

      if (!leafletMapRef.current) {
        const defaultLat = 21.1822;
        const defaultLon = 79.0668;
        const map = window.L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([defaultLat, defaultLon], 15);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        markerRef.current = window.L.marker([defaultLat, defaultLon]).addTo(map);
        leafletMapRef.current = map;
      }

      if (leafletMapRef.current) {
        setTimeout(() => {
          leafletMapRef.current.invalidateSize();
        }, 150);
      }
    };

    const timer = setTimeout(initMiniMap, 100);
    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 3. Cooldown Countdown Loop (Strict 5 minutes)
  useEffect(() => {
    const checkCooldown = () => {
      const lastReport = parseInt(localStorage.getItem('gram_last_report_time') || '0', 10);
      const elapsed = Date.now() - lastReport;
      if (elapsed < COOLDOWN_MS) {
        setCooldownRemaining(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
      } else {
        setCooldownRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle Submit Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please describe the water problem.");
      return;
    }

    if (cooldownRemaining > 0) {
      const m = Math.floor(cooldownRemaining / 60);
      const s = cooldownRemaining % 60;
      alert(`Ek phone/device se 5 minute me 1 hi report bhej sakte hain.\nKripya ${m}m ${s}s baad prayas karein.`);
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', selectedType);
    formData.append('type', selectedType);
    formData.append('description', description.trim());
    formData.append('location', gpsLocation.text);
    formData.append('gps', gpsLocation.lat ? `${gpsLocation.lat}, ${gpsLocation.lon}` : '0, 0');
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    const savedEmail = localStorage.getItem('gram_user_email') || currentUser?.email || 'resident@village.gov';

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'x-user-email': encodeURIComponent(savedEmail) },
        body: formData
      });

      const data = await res.json();

      if (res.status === 429) {
        const remainingSec = data.remainingSeconds || 300;
        localStorage.setItem('gram_last_report_time', (Date.now() - (COOLDOWN_MS - remainingSec * 1000)).toString());
        setCooldownRemaining(remainingSec);
        alert(data.error || "Rate limit reached. Please wait before reporting again.");
        return;
      }

      if (res.ok && (data.success || data.issue)) {
        localStorage.setItem('gram_last_report_time', Date.now().toString());
        setCooldownRemaining(300);
        alert("✅ Report submitted successfully!\nMahurzari Panchayat and repair team have been alerted.");
        setDescription('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setActiveTab('home');
      } else {
        alert(data.error || "Failed to submit issue.");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection error while submitting report.");
    } finally {
      setSubmitting(false);
    }
  };

  const minutesRemaining = Math.floor(cooldownRemaining / 60);
  const secondsRemaining = cooldownRemaining % 60;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-24 md:pb-8">
      <div className="bg-white rounded-3xl border border-outline-variant/60 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl sm:text-2xl text-primary">
              {t('report_title')}
            </h2>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              1-Click GPS
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-body mt-1">
            Gram Panchayat Mahurzari fast-response water complaint system.
          </p>
        </div>

        {/* Issue Type Pills */}
        <div>
          <label className="text-xs font-headline font-bold uppercase text-on-surface mb-2 block">
            {t('select_category')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISSUE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedType(cat.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1.5 transition-all cursor-pointer ${
                  selectedType === cat.id
                    ? 'border-primary bg-primary/5 text-primary shadow-sm font-bold scale-[1.02]'
                    : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${
                  selectedType === cat.id ? 'text-primary' : 'text-on-surface-variant'
                }`}>
                  {cat.icon}
                </span>
                <span className="text-xs font-headline leading-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* High-Accuracy GPS Location Card & Mini Map */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-headline font-bold uppercase text-on-surface">
              {t('exact_spot')}
            </label>
            <button
              type="button"
              onClick={acquireHighAccuracyGps}
              disabled={isLocating}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${isLocating ? 'animate-spin' : ''}`}>
                my_location
              </span>
              {t('refresh_gps')}
            </button>
          </div>

          <div className="p-3 bg-surface-container-low border border-outline-variant/80 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface truncate">
              <span className="material-symbols-outlined text-secondary text-lg shrink-0">
                location_on
              </span>
              <span className="truncate">{gpsLocation.text}</span>
            </div>
            <span className="text-[10px] bg-secondary-container text-secondary font-bold px-2 py-0.5 rounded-full shrink-0 uppercase">
              Accurate
            </span>
          </div>

          {/* Mini Leaflet Preview */}
          <div 
            ref={mapContainerRef} 
            style={{ height: '160px' }}
            className="w-full rounded-2xl overflow-hidden border border-outline-variant/80 shadow-inner z-0" 
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-headline font-bold uppercase text-on-surface mb-2 block">
            {t('photo_evidence')}
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto px-4 py-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-2xl font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg text-primary">add_a_photo</span>
              <span>{t('take_photo')}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            {photoPreview && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary shadow-sm shrink-0">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="text-xs font-headline font-bold uppercase text-on-surface mb-1.5 block">
            {t('description')}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('desc_placeholder')}
            className="w-full p-3.5 bg-surface-container-low text-on-surface text-sm rounded-2xl border border-outline-variant focus:outline-none focus:border-primary font-body"
          />
        </div>

        {/* 5-Minute Rate Limit Submit Button with Live Countdown */}
        <div>
          {cooldownRemaining > 0 ? (
            <div className="w-full py-4 bg-surface-container-high border-2 border-outline-variant text-on-surface-variant font-headline font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
              <span className="material-symbols-outlined text-lg text-error animate-pulse">timer</span>
              <span>{t('next_report_in')} {minutesRemaining}m {secondsRemaining < 10 ? '0' : ''}{secondsRemaining}s</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={submitting}
              className="w-full py-4 bg-primary text-white hover:bg-primary/95 font-headline font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>{t('submitting')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>{t('submit_report')}</span>
                </>
              )}
            </button>
          )}

          <p className="text-[11px] text-on-surface-variant text-center mt-2 font-body">
            🛡️ {t('rate_limit_notice')}
          </p>
        </div>
      </div>
    </div>
  );
}
