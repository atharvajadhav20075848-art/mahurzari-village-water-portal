// Web Audio API Native Notification Chime & Push Notification Utility
// Zero external file dependencies - 100% reliable on mobile and desktop browsers

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on first user touch / click
if (typeof window !== 'undefined') {
  const unlock = () => {
    getAudioContext();
  };
  window.addEventListener('click', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

/**
 * Plays a pleasant 2-tone chime (Ding-Dong / G5 -> C6) for new alerts & updates
 */
export function playNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: 784Hz (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 1046Hz (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);

    // Phone vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (err) {
    console.warn("Chime audio playback error:", err);
  }
}

/**
 * Request Browser Push Notification permission
 */
export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    return 'denied';
  }
}

/**
 * Check if push notifications are allowed
 */
export function isPushPermissionGranted() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Display a native operating system / browser notification
 */
export function sendBrowserNotification(title, options = {}) {
  try {
    // 1. Play audio chime
    if (options.isEmergency) {
      // Emergency siren handled separately
    } else {
      playNotificationChime();
    }

    // 2. Trigger native Notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const defaultIcon = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI2oc_Spp8I6sgWaFMdsSaFj6HCk6B0FcQPjuW5ESxOxg1qEkS2UujcZNWktzJc8s5jwVXxfZcpXC-_nT7qoyZfCico0MZXOysuOfdYGH_BObereTalqbra5mCuW0jZ4k0JiWCqJUizNUxZ0eoHab6alVwGgUk4JVZXPKdivAOY5RPtWQVl8LjrPw0-RknTkFttseIwCfgur0EmzMkWGVWB07KHOChoA5J8VhKNoq1A7a7uu-LpA0X4w';
      
      const notif = new Notification(title, {
        body: options.body || options.message || 'माहूरझरी ग्राम जल सूचना',
        icon: options.icon || defaultIcon,
        badge: options.icon || defaultIcon,
        tag: options.tag || 'gram-jal-update-' + Date.now(),
        renotify: true,
        silent: false,
        ...options
      });

      notif.onclick = function() {
        window.focus();
        this.close();
      };
      
      return notif;
    }
  } catch (err) {
    console.warn("Browser notification trigger error:", err);
  }
  return null;
}
