// Web Audio API Emergency Siren Generator
let audioCtx = null;
let sirenOscillator = null;
let sirenGain = null;
let sirenInterval = null;

export function playEmergencySirenSound() {
  stopEmergencySirenSound();
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    sirenOscillator = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();

    sirenOscillator.type = 'sawtooth';
    sirenGain.gain.setValueAtTime(0.3, audioCtx.currentTime);

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);

    let high = false;
    sirenOscillator.frequency.setValueAtTime(650, audioCtx.currentTime);
    sirenOscillator.start();

    sirenInterval = setInterval(() => {
      if (!audioCtx || !sirenOscillator) return;
      high = !high;
      const targetFreq = high ? 960 : 540;
      sirenOscillator.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.35);
    }, 400);

    // Auto stop after 6 seconds so it doesn't annoy indefinitely
    setTimeout(() => {
      stopEmergencySirenSound();
    }, 6000);
  } catch (err) {
    console.warn("Audio Context playback note:", err);
  }
}

export function stopEmergencySirenSound() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (sirenOscillator) {
    try { sirenOscillator.stop(); sirenOscillator.disconnect(); } catch (e) {}
    sirenOscillator = null;
  }
  if (sirenGain) {
    try { sirenGain.disconnect(); } catch (e) {}
    sirenGain = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch (e) {}
    audioCtx = null;
  }
}
