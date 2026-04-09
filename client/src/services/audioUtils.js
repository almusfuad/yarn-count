// Audio utility to generate and play notification sounds

// Generate emergency sound (1000Hz + 500Hz oscillating for 5 seconds)
export function playEmergencySound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 5;
  const now = audioContext.currentTime;
  
  // Create oscillators for alarm effect
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  osc1.frequency.value = 1000;
  osc2.frequency.value = 500;
  osc1.type = 'sine';
  osc2.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  osc1.start(now);
  osc2.start(now + 0.2); // Offset for pulsing effect
  
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  
  // Create pulsing effect by modulating frequency
  osc1.frequency.setValueAtTime(1000, now);
  osc1.frequency.setValueAtTime(1200, now + 0.1);
  osc1.frequency.setValueAtTime(1000, now + 0.2);
}

// Generate warning sound (800Hz steady for 3 seconds)
export function playWarningSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 3;
  const now = audioContext.currentTime;
  
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  osc.frequency.value = 800;
  osc.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.2, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

// Generate and play notification sound based on severity
export function playNotificationSound(severity) {
  try {
    if (severity === 'critical') {
      playEmergencySound();
    } else if (severity === 'warning') {
      playWarningSound();
    }
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
}
