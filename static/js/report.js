/**
 * AlertX Smart Response - Incident Reporting & AI Priority Engine
 * Manages crime incident submissions, real-time AI NLP priority scoring, voice recording, and evidence management.
 */

class ReportManager {
  constructor() {
    this.attachedFiles = [];
    this.attachedSketch = null;
    this.audioBlob = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordTimer = null;
    this.recordSeconds = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    // Real-time AI classification debounce on typing
    const titleInput = document.getElementById('reportTitle');
    const descInput = document.getElementById('reportDesc');
    const catSelect = document.getElementById('reportCategory');
    const timeInput = document.getElementById('reportTime');

    const triggerClassify = () => this.classifyLive();

    if (titleInput) titleInput.addEventListener('input', triggerClassify);
    if (descInput) descInput.addEventListener('input', triggerClassify);
    if (catSelect) catSelect.addEventListener('change', triggerClassify);
    if (timeInput) timeInput.addEventListener('change', triggerClassify);

    // Evidence file uploader
    const fileInput = document.getElementById('evidenceFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  }

  // --- Real-time NLP Priority Classifier ---
  classifyLive() {
    const title = document.getElementById('reportTitle')?.value || '';
    const desc = document.getElementById('reportDesc')?.value || '';
    const cat = document.getElementById('reportCategory')?.value || 'Harassment';
    const time = document.getElementById('reportTime')?.value || '';

    const text = `${title} ${desc} ${cat}`.toLowerCase();
    let score = 15;
    const reasons = [];

    // Critical violence & weapons
    const criticalWords = ['knife', 'gun', 'weapon', 'blade', 'attack', 'assault', 'stab', 'bleeding', 'rape', 'molest', 'kidnap', 'abduct', 'trapped', 'locked in', 'holding me', 'strangle', 'choking', 'hostage', 'acid', 'threatened to kill'];
    const matchedCritical = criticalWords.filter(w => text.includes(w));
    if (matchedCritical.length > 0) {
      score += Math.min(55, matchedCritical.length * 25);
      reasons.push(`Weapon / physical violence detected (${matchedCritical.slice(0, 2).join(', ')})`);
    }

    // High pursuit / stalking
    const highWords = ['stalk', 'chasing', 'following me', 'cornered', 'surrounded', 'groped', 'forced', 'blackmail', 'extortion', 'break-in', 'intruder', 'screaming', 'cab driver refused', 'taking wrong route'];
    const matchedHigh = highWords.filter(w => text.includes(w));
    if (matchedHigh.length > 0) {
      score += Math.min(35, matchedHigh.length * 18);
      reasons.push(`Active pursuit / stalking threat identified (${matchedHigh.slice(0, 2).join(', ')})`);
    }

    // Category weighting
    const catWeights = { 'Assault': 40, 'Domestic Violence': 35, 'Stalking': 30, 'Harassment': 25, 'Robbery': 25, 'Cybercrime': 15, 'Suspicious': 15, 'Other': 10 };
    score += (catWeights[cat] || 15);

    // Distress
    const distressWords = ['urgent', 'emergency', 'help', 'terrified', 'scared', 'alone', 'crying', 'in danger'];
    if (distressWords.some(w => text.includes(w))) {
      score += 15;
      reasons.push('High distress signal');
    }

    // Time context
    if (time) {
      const hour = parseInt(time.split(':')[0]);
      if (hour >= 21 || hour <= 5) {
        score += 15;
        reasons.push('Night-time timeframe (9 PM - 5 AM)');
      }
    }

    const urgencyScore = Math.min(99, Math.max(15, score));
    let priority = 'LOW';
    let badgeClass = 'badge-low';
    let barColor = 'bg-blue-500';

    if (urgencyScore >= 85) {
      priority = 'CRITICAL';
      badgeClass = 'badge-critical';
      barColor = 'bg-red-500';
    } else if (urgencyScore >= 65) {
      priority = 'HIGH';
      badgeClass = 'badge-high';
      barColor = 'bg-orange-500';
    } else if (urgencyScore >= 38) {
      priority = 'MEDIUM';
      badgeClass = 'badge-medium';
      barColor = 'bg-yellow-500';
    }

    // Update UI Badge
    const priorityBadge = document.getElementById('livePriorityBadge');
    const priorityScore = document.getElementById('livePriorityScore');
    const priorityBar = document.getElementById('livePriorityBar');
    const priorityRationale = document.getElementById('livePriorityRationale');

    if (priorityBadge) {
      priorityBadge.className = `px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}`;
      priorityBadge.textContent = `${priority} PRIORITY`;
    }
    if (priorityScore) {
      priorityScore.textContent = `${urgencyScore}%`;
    }
    if (priorityBar) {
      priorityBar.className = `h-full rounded-full transition-all duration-300 ${barColor}`;
      priorityBar.style.width = `${urgencyScore}%`;
    }
    if (priorityRationale) {
      priorityRationale.textContent = reasons.length > 0 ? reasons.join(' • ') : `Standard priority scoring for ${cat} incident.`;
    }
  }

  // --- Attach Suspect Sketch ---
  attachSketch(sketchDataUrl) {
    this.attachedSketch = sketchDataUrl;
    const previewContainer = document.getElementById('attachedSketchPreview');
    const imgElem = document.getElementById('attachedSketchImg');
    const placeholder = document.getElementById('noSketchPlaceholder');

    if (previewContainer && imgElem) {
      imgElem.src = sketchDataUrl;
      previewContainer.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
    }
  }

  removeSketch() {
    this.attachedSketch = null;
    const previewContainer = document.getElementById('attachedSketchPreview');
    const placeholder = document.getElementById('noSketchPlaceholder');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
  }

  // --- Voice Evidence Recording ---
  async toggleVoiceRecording() {
    const recordBtn = document.getElementById('voiceRecordBtn');
    const statusText = document.getElementById('voiceRecordStatus');
    const player = document.getElementById('audioPlayerContainer');

    if (this.isRecording) {
      // Stop recording
      this.isRecording = false;
      clearInterval(this.recordTimer);
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      if (recordBtn) {
        recordBtn.innerHTML = '<i data-lucide="mic" class="w-4 h-4 mr-1.5 text-red-400"></i> Record Voice Note';
        recordBtn.classList.remove('bg-red-600', 'animate-pulse');
        recordBtn.classList.add('bg-slate-800');
        lucide.createIcons();
      }
      if (statusText) statusText.textContent = `Recorded (${this.recordSeconds}s)`;
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(this.audioBlob);
          const audioElem = document.getElementById('voiceAudioElement');
          if (audioElem && player) {
            audioElem.src = audioUrl;
            player.classList.remove('hidden');
          }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordSeconds = 0;

        if (recordBtn) {
          recordBtn.innerHTML = '<i data-lucide="square" class="w-4 h-4 mr-1.5"></i> Stop Recording';
          recordBtn.classList.remove('bg-slate-800');
          recordBtn.classList.add('bg-red-600', 'animate-pulse');
          lucide.createIcons();
        }

        this.recordTimer = setInterval(() => {
          this.recordSeconds++;
          if (statusText) statusText.textContent = `Recording... 00:${this.recordSeconds.toString().padStart(2, '0')}`;
          if (this.recordSeconds >= 60) {
            this.toggleVoiceRecording();
          }
        }, 1000);
      } catch (err) {
        console.warn('Microphone access denied, simulating audio evidence note:', err);
        // Fallback simulation
        this.simulateVoiceNote();
      }
    }
  }

  simulateVoiceNote() {
    const statusText = document.getElementById('voiceRecordStatus');
    const player = document.getElementById('audioPlayerContainer');
    this.audioBlob = "data:audio/mp3;base64,SIMULATED_VOICE_EVIDENCE_RECORDING";
    if (statusText) statusText.textContent = 'Demo Voice Note Attached (Simulated 12s Audio)';
    if (player) player.classList.remove('hidden');
    window.app?.showToast('Audio note attached to evidence pool.', 'info');
  }

  // --- Evidence File Handling ---
  handleFileUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const item = {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type,
          dataUrl: event.target.result
        };
        this.attachedFiles.push(item);
        this.renderEvidenceGrid();
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index) {
    this.attachedFiles.splice(index, 1);
    this.renderEvidenceGrid();
  }

  renderEvidenceGrid() {
    const grid = document.getElementById('evidenceFilesGrid');
    if (!grid) return;

    if (this.attachedFiles.length === 0) {
      grid.innerHTML = '<p class="text-xs text-slate-500 col-span-full italic">No files attached yet. Upload photos, screenshots, or CCTV clips.</p>';
      return;
    }

    grid.innerHTML = this.attachedFiles.map((f, idx) => `
      <div class="relative group bg-slate-800 rounded-lg p-2 border border-slate-700 overflow-hidden flex flex-col items-center">
        ${f.type.startsWith('image/') 
          ? `<img src="${f.dataUrl}" class="w-full h-20 object-cover rounded mb-1" />`
          : `<div class="w-full h-20 bg-slate-900 rounded flex items-center justify-center mb-1 text-slate-400 font-mono text-xs"><i data-lucide="file-text" class="w-8 h-8"></i></div>`
        }
        <div class="text-[11px] text-slate-300 truncate w-full text-center font-medium">${f.name}</div>
        <div class="text-[10px] text-slate-500">${f.size}</div>
        <button type="button" onclick="window.reportManager.removeFile(${idx})" class="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 rounded-full text-white opacity-90 transition">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </div>
    `).join('');

    lucide.createIcons();
  }

  // --- Submit Crime Report ---
  async submitReport() {
    const title = document.getElementById('reportTitle')?.value.trim();
    const category = document.getElementById('reportCategory')?.value;
    const description = document.getElementById('reportDesc')?.value.trim();
    const date = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('reportTime')?.value || new Date().toTimeString().slice(0, 5);
    const locationName = document.getElementById('reportLocation')?.value.trim() || 'Connaught Place Area';

    if (!title || !description) {
      window.app?.showToast('Please provide an incident title and detailed description.', 'error');
      return;
    }

    const currentUser = window.app?.currentUser || {
      id: 1,
      name: 'Priya Sharma',
      phone: '+91 98765 43210'
    };

    const submitBtn = document.getElementById('submitReportBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Submitting & Classifying...';
      lucide.createIcons();
    }

    const payload = {
      user_id: currentUser.id,
      reporter_name: currentUser.name,
      reporter_phone: currentUser.phone,
      title,
      category,
      description,
      incident_date: date,
      incident_time: time,
      location_name: locationName,
      latitude: window.sosController?.currentLocation.latitude || 28.6328,
      longitude: window.sosController?.currentLocation.longitude || 77.2195,
      suspect_sketch: this.attachedSketch,
      suspect_details: window.sketcher?.state || null,
      evidence_files: this.attachedFiles,
      audio_evidence: this.audioBlob ? 'VOICE_NOTE_RECORDING_ATTACHED' : null
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.report) {
        window.app?.showToast(`🚨 Report #${data.report.id} registered [Priority: ${data.report.priority}]`, 'success');
        this.resetForm();
        // Show report confirmation modal
        this.showConfirmationModal(data.report);
        // Refresh admin and map
        window.app?.fetchReports();
        if (window.alertxMap) window.alertxMap.renderAll();
      } else {
        window.app?.showToast(data.error || 'Failed to submit report', 'error');
      }
    } catch (err) {
      console.error('Report submit error:', err);
      window.app?.showToast('Submitted in offline demo mode.', 'info');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4 mr-2"></i> Submit Official Incident Report';
        lucide.createIcons();
      }
    }
  }

  showConfirmationModal(report) {
    const modal = document.getElementById('reportSuccessModal');
    if (!modal) return;

    document.getElementById('successReportId').textContent = `#REP-${report.id}`;
    document.getElementById('successReportTitle').textContent = report.title;
    document.getElementById('successReportPriority').textContent = report.priority;
    document.getElementById('successReportPriority').className = `font-bold px-2 py-0.5 rounded text-xs ${
      report.priority === 'CRITICAL' ? 'badge-critical' : report.priority === 'HIGH' ? 'badge-high' : report.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
    }`;
    document.getElementById('successReportRationale').textContent = report.ai_rationale;

    modal.classList.remove('hidden');
  }

  resetForm() {
    document.getElementById('reportTitle').value = '';
    document.getElementById('reportDesc').value = '';
    document.getElementById('reportLocation').value = '';
    this.attachedFiles = [];
    this.attachedSketch = null;
    this.audioBlob = null;
    this.renderEvidenceGrid();
    this.removeSketch();
    const player = document.getElementById('audioPlayerContainer');
    if (player) player.classList.add('hidden');
    this.classifyLive();
  }
}

// Global instance
window.ReportManager = ReportManager;
