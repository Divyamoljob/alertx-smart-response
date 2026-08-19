/**
 * AlertX Smart Response - Emergency Helper Tools
 * Includes: Fake Incoming Call Simulator, Screaming Deterrent Whistle, Helpline Directory, and Legal Rights Guide.
 */

class SafetyTools {
  constructor() {
    this.ringInterval = null;
    this.callTimerInterval = null;
    this.callDurationSec = 0;
    this.audioCtx = null;
    this.whistleOsc = null;
    this.isWhistlePlaying = false;
  }

  // ===========================================================================
  // 1. FAKE CALL SIMULATOR
  // ===========================================================================
  triggerFakeCall() {
    const callerName = document.getElementById('fakeCallerNameSelect')?.value || 'Inspector Sharma (Control)';
    const overlay = document.getElementById('fakeCallOverlay');
    const incomingScreen = document.getElementById('fakeCallIncomingScreen');
    const activeScreen = document.getElementById('fakeCallActiveScreen');

    if (!overlay) return;

    document.getElementById('fakeCallCallerName').textContent = callerName;
    document.getElementById('fakeCallActiveCallerName').textContent = callerName;

    overlay.classList.remove('hidden');
    incomingScreen.classList.remove('hidden');
    activeScreen.classList.add('hidden');

    this.startPhoneRingtone();
  }

  startPhoneRingtone() {
    this.stopPhoneRingtone();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      const playRingBurst = () => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        // Dual standard phone frequencies: 440 Hz + 480 Hz
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      };

      playRingBurst();
      this.ringInterval = setInterval(playRingBurst, 3500);
    } catch (e) {
      console.warn('Audio Context restriction on ringtone:', e);
    }
  }

  stopPhoneRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  acceptFakeCall() {
    this.stopPhoneRingtone();

    const incomingScreen = document.getElementById('fakeCallIncomingScreen');
    const activeScreen = document.getElementById('fakeCallActiveScreen');

    incomingScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');

    // Call duration timer
    this.callDurationSec = 0;
    const durationElem = document.getElementById('fakeCallDuration');
    clearInterval(this.callTimerInterval);
    this.callTimerInterval = setInterval(() => {
      this.callDurationSec++;
      const mins = Math.floor(this.callDurationSec / 60).toString().padStart(2, '0');
      const secs = (this.callDurationSec % 60).toString().padStart(2, '0');
      durationElem.textContent = `${mins}:${secs}`;
    }, 1000);

    // Speak helper voice prompt using Web Speech API if available
    this.speakHelperVoice();
  }

  speakHelperVoice() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(
        "Hello Priya, this is Police Control Room. We see your live location on our radar. Are you in a safe spot right now? Stay on the line, our patrol unit is already around the corner."
      );
      msg.rate = 0.95;
      msg.pitch = 1.0;
      window.speechSynthesis.speak(msg);
    }
  }

  endFakeCall() {
    this.stopPhoneRingtone();
    clearInterval(this.callTimerInterval);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const overlay = document.getElementById('fakeCallOverlay');
    if (overlay) overlay.classList.add('hidden');
    window.app?.showToast('Call ended.', 'info');
  }

  // ===========================================================================
  // 2. SCREAMING DETERRENT WHISTLE / ALARM
  // ===========================================================================
  toggleWhistleAlarm() {
    if (this.isWhistlePlaying) {
      this.stopWhistleAlarm();
    } else {
      this.startWhistleAlarm();
    }
  }

  startWhistleAlarm() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      this.whistleOsc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      this.whistleOsc.type = 'triangle';
      this.whistleOsc.frequency.setValueAtTime(2800, this.audioCtx.currentTime); // High pitch 2.8kHz

      // Piercing rapid pulsation
      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(6, this.audioCtx.currentTime); // 6 Hz pulse
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(600, this.audioCtx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(this.whistleOsc.frequency);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      this.whistleOsc.connect(gain);
      gain.connect(this.audioCtx.destination);

      lfo.start();
      this.whistleOsc.start();
      this.isWhistlePlaying = true;

      const btn = document.getElementById('whistleAlarmBtn');
      if (btn) {
        btn.classList.add('bg-red-600', 'animate-pulse');
        btn.innerHTML = '<i data-lucide="volume-x" class="w-5 h-5 mr-2"></i> Stop High-Decibel Siren';
        lucide.createIcons();
      }

      window.app?.showToast('📢 High-Pitch Deterrent Alarm Sounding at Maximum Volume!', 'error');
    } catch (e) {
      console.warn('Audio Context whistle error:', e);
    }
  }

  stopWhistleAlarm() {
    if (this.whistleOsc) {
      try {
        this.whistleOsc.stop();
        this.whistleOsc.disconnect();
      } catch (e) {}
      this.whistleOsc = null;
    }
    this.isWhistlePlaying = false;

    const btn = document.getElementById('whistleAlarmBtn');
    if (btn) {
      btn.classList.remove('bg-red-600', 'animate-pulse');
      btn.innerHTML = '<i data-lucide="megaphone" class="w-5 h-5 mr-2 text-red-400"></i> Sound Screaming Deterrent Siren';
      lucide.createIcons();
    }
  }

  // ===========================================================================
  // 3. DIAL HELPLINE SIMULATOR
  // ===========================================================================
  dialHelpline(number, label) {
    window.app?.showToast(`📞 Connecting to ${label} (${number})... (Simulated Call)`, 'info');
    const select = document.getElementById('fakeCallerNameSelect');
    if (select) {
      select.value = `${label} (${number})`;
    }
    setTimeout(() => {
      this.triggerFakeCall();
    }, 400);
  }

  // ===========================================================================
  // 4. GUARDIAN SAFE WALK COMPANION
  // ===========================================================================
  startSafeWalk(mins = 10, destination = 'Hostel Gate') {
    this.safeWalkSeconds = mins * 60;
    this.safeWalkDest = destination;
    clearInterval(this.safeWalkInterval);

    const banner = document.getElementById('safeWalkActiveBanner');
    const timerDisplay = document.getElementById('safeWalkTimerDisplay');
    const destDisplay = document.getElementById('safeWalkDestDisplay');

    if (banner && timerDisplay && destDisplay) {
      destDisplay.textContent = destination;
      banner.classList.remove('hidden');
      
      this.safeWalkInterval = setInterval(() => {
        this.safeWalkSeconds--;
        if (this.safeWalkSeconds <= 0) {
          clearInterval(this.safeWalkInterval);
          banner.classList.add('hidden');
          window.app?.showToast('⚠️ Safe Walk countdown expired without check-in! Triggering SOS Alert!', 'error');
          window.sosController?.startSOSCountdown();
          return;
        }

        const m = Math.floor(this.safeWalkSeconds / 60).toString().padStart(2, '0');
        const s = (this.safeWalkSeconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
      }, 1000);

      window.app?.showToast(`🛡️ Guardian Safe Walk Session Started: ${mins} mins to reach ${destination}.`, 'success');
    }
  }

  confirmSafeArrival() {
    clearInterval(this.safeWalkInterval);
    const banner = document.getElementById('safeWalkActiveBanner');
    if (banner) banner.classList.add('hidden');
    window.app?.showToast('✅ Confirmed Safe Arrival! Guardian Walk session completed.', 'success');
  }
}

// Global instance
window.SafetyTools = SafetyTools;

