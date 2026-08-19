/**
 * AlertX Smart Response - Emergency SOS Engine
 * Handles instant SOS triggers, GPS telemetry, Web Audio siren, and emergency broadcast simulation.
 */

class SOSController {
  constructor() {
    this.countdownTimer = null;
    this.countdownSeconds = 3;
    this.audioCtx = null;
    this.sirenOscillator = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
    this.activeSOSId = null;
    this.watchPositionId = null;
    this.currentLocation = {
      latitude: 28.6328,
      longitude: 77.2195,
      accuracy: 12,
      address: 'Near Rajiv Chowk, Connaught Place, New Delhi'
    };

    this.initLocation();
  }

  initLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.currentLocation.latitude = pos.coords.latitude;
          this.currentLocation.longitude = pos.coords.longitude;
          this.currentLocation.accuracy = Math.round(pos.coords.accuracy);
          this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        err => {
          console.warn('Geolocation denied or unavailable, using fallback mock coordinates:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          this.currentLocation.address = data.display_name.split(',').slice(0, 4).join(',');
        }
      }
    } catch (e) {
      console.log('Reverse geocoding offline, using default address.');
    }
  }

  // --- 1. Step 1: Start SOS Countdown ---
  startSOSCountdown() {
    const modal = document.getElementById('sosCountdownModal');
    const numberElem = document.getElementById('sosCountdownNumber');
    const barElem = document.getElementById('sosCountdownBar');

    if (!modal) {
      this.triggerSOSImmediate();
      return;
    }

    this.countdownSeconds = 3;
    numberElem.textContent = this.countdownSeconds;
    barElem.style.width = '100%';
    modal.classList.remove('hidden');

    // Beep sound on tick
    this.playTickSound(600);

    const stepMs = 100;
    let elapsed = 0;
    const totalMs = 3000;

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      elapsed += stepMs;
      const remainingSecs = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      numberElem.textContent = remainingSecs;
      barElem.style.width = `${Math.max(0, (1 - elapsed / totalMs) * 100)}%`;

      if (elapsed % 1000 === 0 && remainingSecs > 0) {
        this.playTickSound(700 + (3 - remainingSecs) * 150);
      }

      if (elapsed >= totalMs) {
        clearInterval(this.countdownTimer);
        modal.classList.add('hidden');
        this.triggerSOSImmediate();
      }
    }, stepMs);
  }

  cancelSOSCountdown() {
    clearInterval(this.countdownTimer);
    const modal = document.getElementById('sosCountdownModal');
    if (modal) modal.classList.add('hidden');
    window.app?.showToast('SOS activation cancelled.', 'info');
  }

  // --- 2. Step 2: Trigger Instant Active SOS ---
  async triggerSOSImmediate() {
    let batteryLevel = '85%';
    try {
      if (navigator.getBattery) {
        const batt = await navigator.getBattery();
        batteryLevel = `${Math.round(batt.level * 100)}%`;
      }
    } catch (e) {}

    const currentUser = window.app?.currentUser || {
      id: 1,
      name: 'Priya Sharma',
      phone: '+91 98765 43210'
    };

    const payload = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_phone: currentUser.phone,
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      accuracy: this.currentLocation.accuracy,
      address: this.currentLocation.address,
      battery_level: batteryLevel
    };

    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.alert) {
        this.activeSOSId = data.alert.id;
        this.showActiveSOSModal(data.alert);
        this.startSiren();
        this.simulateEmergencyBroadcast(data.alert);
        window.app?.showToast('🚨 SOS Broadcast Dispatched to Police Command & Emergency Contacts!', 'error');

        // Refresh admin alerts & live maps
        window.app?.fetchActiveSOS();
        if (window.alertxMap) {
          window.alertxMap.renderAll();
        }
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
      // Fallback local display
      const mockAlert = {
        id: Math.floor(Math.random() * 9000) + 1000,
        user_name: currentUser.name,
        user_phone: currentUser.phone,
        address: this.currentLocation.address,
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        battery_level: batteryLevel,
        status: 'ACTIVE',
        dispatched_unit: 'PP-01'
      };
      this.showActiveSOSModal(mockAlert);
      this.startSiren();
      this.simulateEmergencyBroadcast(mockAlert);
    }
  }

  // --- 3. Step 3: Emergency Broadcast Simulation Popup ---
  simulateEmergencyBroadcast(alert) {
    const contacts = window.app?.currentUser?.contacts || [
      { name: 'Aarti Sharma (Mother)', phone: '+91 98111 22334', relation: 'Mother' },
      { name: 'Rohit Sharma (Brother)', phone: '+91 98222 33445', relation: 'Brother' }
    ];

    const contactListHtml = contacts.map(c => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
        <div>
          <div class="font-semibold text-xs text-white">${c.name} (${c.relation})</div>
          <div class="text-[11px] text-slate-400 font-mono">${c.phone}</div>
        </div>
        <span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> SMS Sent
        </span>
      </div>
    `).join('');

    const broadcastModal = document.getElementById('broadcastDetailsModal');
    if (broadcastModal) {
      document.getElementById('broadcastContactsList').innerHTML = contactListHtml;
      document.getElementById('broadcastAddressText').textContent = alert.address;
      document.getElementById('broadcastCoordinatesText').textContent = `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`;
      document.getElementById('broadcastTrackingLink').textContent = `https://alertx.org/live/${alert.id || '9021'}`;
      broadcastModal.classList.remove('hidden');
    }
  }

  // --- 4. Active SOS Modal & Telemetry Display ---
  showActiveSOSModal(alert) {
    const modal = document.getElementById('activeSOSModal');
    if (!modal) return;

    document.getElementById('activeSosIdText').textContent = `#SOS-${alert.id || '001'}`;
    document.getElementById('activeSosAddressText').textContent = alert.address;
    document.getElementById('activeSosCoordsText').textContent = `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`;
    document.getElementById('activeSosBatteryText').textContent = alert.battery_level || '85%';
    document.getElementById('activeSosUnitText').textContent = alert.dispatched_unit || 'Pink Patrol 01 (ETA: 3m)';

    modal.classList.remove('hidden');
  }

  // --- 5. Resolve / Cancel Active SOS ---
  async resolveActiveSOS() {
    this.stopSiren();
    const modal = document.getElementById('activeSOSModal');
    if (modal) modal.classList.add('hidden');

    if (this.activeSOSId) {
      try {
        await fetch('/api/sos/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sos_id: this.activeSOSId,
            status: 'RESOLVED',
            notes: 'Cancelled by user / Confirmed Safe.'
          })
        });
      } catch (e) {}
      this.activeSOSId = null;
    }

    window.app?.showToast('✅ SOS Alert Cancelled. You have been marked Safe.', 'success');
    window.app?.fetchActiveSOS();
    if (window.alertxMap) {
      window.alertxMap.renderAll();
    }
  }

  // --- 6. Web Audio API Emergency Siren Synthesizer ---
  startSiren() {
    if (this.isSirenPlaying) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Main Gain Node
      this.sirenGain = this.audioCtx.createGain();
      this.sirenGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      this.sirenGain.connect(this.audioCtx.destination);

      // Dual Oscillator for piercing police wail sound
      this.sirenOscillator = this.audioCtx.createOscillator();
      this.sirenOscillator.type = 'sawtooth';

      // LFO for pitch modulation (wail effect)
      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(1.8, this.audioCtx.currentTime); // 1.8 Hz modulation

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(350, this.audioCtx.currentTime); // 350 Hz sweep range

      this.sirenOscillator.frequency.setValueAtTime(850, this.audioCtx.currentTime); // Base 850 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOscillator.frequency);

      this.sirenOscillator.connect(this.sirenGain);

      lfo.start();
      this.sirenOscillator.start();
      this.isSirenPlaying = true;

      // Update Siren Toggle Button UI
      const sirenBtn = document.getElementById('toggleSirenBtn');
      if (sirenBtn) {
        sirenBtn.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4 mr-1.5"></i> Mute Siren';
        lucide.createIcons();
      }
    } catch (e) {
      console.warn('Web Audio API not allowed or restricted by browser:', e);
    }
  }

  stopSiren() {
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch (e) {}
      this.sirenOscillator = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    this.isSirenPlaying = false;

    const sirenBtn = document.getElementById('toggleSirenBtn');
    if (sirenBtn) {
      sirenBtn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 mr-1.5"></i> Sound Siren';
      lucide.createIcons();
    }
  }

  toggleSiren() {
    if (this.isSirenPlaying) {
      this.stopSiren();
    } else {
      this.startSiren();
    }
  }

  playTickSound(freq = 600) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }
}

// Global SOS instance
window.SOSController = SOSController;
