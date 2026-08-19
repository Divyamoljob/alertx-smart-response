/**
 * AlertX Smart Response - Admin & Dispatcher Control Center
 * Manages live feeds, incident triage, unit dispatching, evidence inspection, suspect sketch review, and Chart.js analytics.
 */

class AdminDashboard {
  constructor() {
    this.currentReports = [];
    this.currentAlerts = [];
    this.units = [];
    this.activeModalItem = null;
    this.activeModalType = 'report'; // 'report' or 'sos'
    this.charts = {
      priority: null,
      categories: null
    };

    this.filters = {
      priority: 'ALL',
      status: 'ALL',
      category: 'ALL',
      search: ''
    };
  }

  async init() {
    await this.fetchUnits();
    await this.fetchIncidents();
    await this.fetchActiveSOS();
    this.initAnalytics();
  }

  // --- Fetch Available Units ---
  async fetchUnits() {
    try {
      const res = await fetch('/api/admin/units');
      const data = await res.json();
      this.units = data.units || [];
      this.renderUnitsSelect();
    } catch (e) {
      console.warn('Failed to load units:', e);
    }
  }

  renderUnitsSelect() {
    const select = document.getElementById('modalAssignUnitSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Response Unit --</option>' +
      this.units.map(u => `
        <option value="${u.unit_code}" ${u.status === 'BUSY' ? 'disabled' : ''}>
          ${u.unit_code} - ${u.unit_name} (${u.status})
        </option>
      `).join('');
  }

  // --- Fetch Reports & Incidents ---
  async fetchIncidents() {
    try {
      const params = new URLSearchParams();
      if (this.filters.priority !== 'ALL') params.set('priority', this.filters.priority);
      if (this.filters.status !== 'ALL') params.set('status', this.filters.status);
      if (this.filters.category !== 'ALL') params.set('category', this.filters.category);
      if (this.filters.search) params.set('search', this.filters.search);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      this.currentReports = data.reports || [];
      this.renderIncidentsTable();
      this.updateKPICards();
    } catch (e) {
      console.warn('Failed to load admin incidents:', e);
    }
  }

  // --- Fetch Active SOS Alerts ---
  async fetchActiveSOS() {
    try {
      const res = await fetch('/api/sos/active');
      const data = await res.json();
      this.currentAlerts = data.alerts || [];
      this.renderLiveSOSFeed();
      this.updateSOSBadge();
    } catch (e) {
      console.warn('Failed to load active SOS alerts:', e);
    }
  }

  renderLiveSOSFeed() {
    const feed = document.getElementById('adminLiveSOSFeed');
    if (!feed) return;

    if (this.currentAlerts.length === 0) {
      feed.innerHTML = `
        <div class="p-6 text-center text-slate-400">
          <i data-lucide="shield-check" class="w-10 h-10 mx-auto text-emerald-400 mb-2"></i>
          <p class="font-medium text-sm text-slate-300">All Sectors Normal</p>
          <p class="text-xs text-slate-500">No active SOS distress signals on radar.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    feed.innerHTML = this.currentAlerts.map(alert => `
      <div class="p-4 rounded-xl glass-panel-danger border border-red-500/40 relative overflow-hidden transition hover:border-red-500">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span class="font-mono font-bold text-red-400 text-xs">#SOS-${alert.id}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">ACTIVE DISTRESS</span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">${alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Just now'}</span>
        </div>

        <div class="mt-2.5">
          <div class="font-bold text-sm text-white">${alert.user_name} <span class="font-normal text-xs text-slate-400">(${alert.user_phone})</span></div>
          <div class="text-xs text-slate-300 flex items-center gap-1 mt-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-red-400 shrink-0"></i>
            <span class="truncate">${alert.address}</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Battery: <b class="text-slate-200">${alert.battery_level || '85%'}</b></span>
            <span>Assigned: <b class="text-emerald-400">${alert.dispatched_unit || 'Pending'}</b></span>
          </div>
        </div>

        <div class="mt-3.5 pt-2.5 border-t border-red-500/20 flex items-center justify-between gap-2">
          <button onclick="window.adminDashboard.openModal(${alert.id}, 'sos')" class="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
            <i data-lucide="radio" class="w-3.5 h-3.5"></i> Control Room Triage
          </button>
          <button onclick="window.alertxMap.map.setView([${alert.latitude}, ${alert.longitude}], 16); window.app.switchView('map');" class="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1">
            <i data-lucide="navigation" class="w-3.5 h-3.5"></i> Track
          </button>
        </div>
      </div>
    `).join('');

    lucide.createIcons();
  }

  updateSOSBadge() {
    const badge = document.getElementById('adminActiveSOSCountBadge');
    if (badge) {
      badge.textContent = this.currentAlerts.length;
      if (this.currentAlerts.length > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // --- Render Incident Registry Table ---
  renderIncidentsTable() {
    const tbody = document.getElementById('adminIncidentsTableBody');
    if (!tbody) return;

    if (this.currentReports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-500 text-sm italic">
            No incident reports found matching active filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.currentReports.map(rep => {
      let prioBadge = 'badge-low';
      if (rep.priority === 'CRITICAL') prioBadge = 'badge-critical';
      else if (rep.priority === 'HIGH') prioBadge = 'badge-high';
      else if (rep.priority === 'MEDIUM') prioBadge = 'badge-medium';

      let statusBadge = 'bg-slate-700 text-slate-300';
      if (rep.status === 'Dispatched') statusBadge = 'bg-amber-950 text-amber-300 border border-amber-800';
      else if (rep.status === 'Investigating') statusBadge = 'bg-blue-950 text-blue-300 border border-blue-800';
      else if (rep.status === 'Resolved') statusBadge = 'bg-emerald-950 text-emerald-300 border border-emerald-800';

      return `
        <tr class="border-b border-slate-800/80 hover:bg-slate-800/50 transition">
          <td class="py-3 px-4 font-mono text-xs text-slate-400 font-bold">#REP-${rep.id}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${prioBadge}">
              ${rep.priority} (${rep.urgency_score || 50}%)
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-sm text-slate-100 line-clamp-1">${rep.title}</div>
            <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span class="text-indigo-400">${rep.category}</span> • <span>${rep.location_name}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <div class="text-xs text-slate-200 font-medium">${rep.reporter_name}</div>
            <div class="text-[11px] text-slate-500 font-mono">${rep.reporter_phone}</div>
          </td>
          <td class="py-3 px-4 text-center">
            ${rep.suspect_sketch 
              ? `<img src="${rep.suspect_sketch}" class="w-9 h-11 object-cover rounded border border-slate-600 inline-block shadow cursor-pointer hover:scale-125 transition" onclick="window.adminDashboard.openModal(${rep.id}, 'report')" />`
              : `<span class="text-xs text-slate-600">-</span>`
            }
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge}">
              ${rep.status}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="window.adminDashboard.openModal(${rep.id}, 'report')" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');

    lucide.createIcons();
  }

  // --- Open Incident / SOS Details Modal ---
  async openModal(id, type = 'report') {
    this.activeModalType = type;
    const modal = document.getElementById('adminIncidentDetailModal');
    if (!modal) return;

    if (type === 'report') {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const rep = await res.json();
        this.activeModalItem = rep;
        this.populateReportModal(rep);
      } catch (e) {
        console.error('Failed to load report modal data:', e);
      }
    } else {
      // SOS alert
      const alert = this.currentAlerts.find(a => a.id === id) || { id, user_name: 'Emergency Victim', address: 'Connaught Place' };
      this.activeModalItem = alert;
      this.populateSOSModal(alert);
    }

    modal.classList.remove('hidden');
  }

  populateReportModal(rep) {
    document.getElementById('modalIncidentTitle').textContent = `Incident #REP-${rep.id}: ${rep.title}`;
    document.getElementById('modalReporterInfo').innerHTML = `
      <div class="font-bold text-sm text-white">${rep.reporter_name}</div>
      <div class="text-xs text-slate-400 font-mono">${rep.reporter_phone}</div>
      <div class="text-xs text-slate-400 mt-1">Location: <span class="text-slate-200">${rep.location_name}</span></div>
      <div class="text-xs text-slate-400">Time: <span class="text-slate-200">${rep.incident_date} at ${rep.incident_time}</span></div>
    `;

    // AI Classification Rationale
    let badgeClass = 'badge-low';
    if (rep.priority === 'CRITICAL') badgeClass = 'badge-critical';
    else if (rep.priority === 'HIGH') badgeClass = 'badge-high';
    else if (rep.priority === 'MEDIUM') badgeClass = 'badge-medium';

    document.getElementById('modalPriorityBadge').innerHTML = `
      <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase ${badgeClass}">
        ${rep.priority} PRIORITY (${rep.urgency_score || 50}%)
      </span>
    `;
    document.getElementById('modalAIRationale').textContent = rep.ai_rationale || 'Standard priority scoring.';
    document.getElementById('modalIncidentDesc').textContent = rep.description;

    // Suspect Sketch Preview
    const sketchContainer = document.getElementById('modalSketchContainer');
    if (rep.suspect_sketch) {
      sketchContainer.innerHTML = `
        <div class="p-2 bg-slate-900 rounded-lg border border-slate-700 text-center">
          <img src="${rep.suspect_sketch}" class="w-36 h-44 object-cover mx-auto rounded border border-slate-600 shadow-md mb-2" />
          <span class="text-[11px] text-slate-400 font-mono block">Facial Feature Composite</span>
          <button onclick="window.adminDashboard.downloadSketch('${rep.suspect_sketch}', 'suspect_${rep.id}.png')" class="mt-1 text-[10px] text-blue-400 hover:underline">Download High-Res</button>
        </div>
      `;
    } else {
      sketchContainer.innerHTML = `<p class="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded">No suspect sketch attached with this report.</p>`;
    }

    // Evidence Files
    const evContainer = document.getElementById('modalEvidenceContainer');
    if (rep.evidence_files && rep.evidence_files.length > 0) {
      evContainer.innerHTML = rep.evidence_files.map(f => `
        <div class="p-2 bg-slate-900 rounded-lg border border-slate-700 flex items-center gap-2">
          ${f.type && f.type.startsWith('image/') 
            ? `<img src="${f.dataUrl}" class="w-12 h-12 object-cover rounded" />`
            : `<i data-lucide="file" class="w-8 h-8 text-slate-400"></i>`
          }
          <div class="overflow-hidden">
            <div class="text-xs text-slate-200 font-medium truncate">${f.name}</div>
            <div class="text-[10px] text-slate-500">${f.size || ''}</div>
          </div>
        </div>
      `).join('');
    } else {
      evContainer.innerHTML = `<p class="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded col-span-full">No additional media evidence attached.</p>`;
    }

    // Voice Note Evidence
    const audioContainer = document.getElementById('modalAudioContainer');
    if (rep.audio_evidence) {
      audioContainer.innerHTML = `
        <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i data-lucide="mic" class="w-4 h-4 text-red-400"></i>
            <span class="text-xs text-slate-200 font-medium">Recorded Voice Evidence</span>
          </div>
          <button onclick="window.adminDashboard.playDemoAudio()" class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1">
            <i data-lucide="play" class="w-3 h-3"></i> Listen Note
          </button>
        </div>
      `;
    } else {
      audioContainer.innerHTML = `<p class="text-xs text-slate-500 italic">No audio recording attached.</p>`;
    }

    // Set Dispatch Form Values
    document.getElementById('modalAssignUnitSelect').value = rep.assigned_unit || '';
    document.getElementById('modalStatusSelect').value = rep.status || 'Pending';
    document.getElementById('modalDispatcherNotes').value = rep.dispatcher_notes || '';

    lucide.createIcons();
  }

  populateSOSModal(alert) {
    document.getElementById('modalIncidentTitle').textContent = `🚨 Active Distress SOS #${alert.id}`;
    document.getElementById('modalReporterInfo').innerHTML = `
      <div class="font-bold text-sm text-red-400">${alert.user_name}</div>
      <div class="text-xs text-slate-300 font-mono">${alert.user_phone}</div>
      <div class="text-xs text-slate-400 mt-1">Location: <span class="text-slate-200">${alert.address}</span></div>
      <div class="text-xs text-slate-400">Coordinates: <span class="text-amber-400 font-mono">${alert.latitude}, ${alert.longitude}</span></div>
    `;

    document.getElementById('modalPriorityBadge').innerHTML = `
      <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase badge-critical animate-pulse">
        CRITICAL SOS EMERGENCY
      </span>
    `;
    document.getElementById('modalAIRationale').textContent = 'Emergency One-Tap SOS Alert: Instant responder dispatch protocol initiated.';
    document.getElementById('modalIncidentDesc').textContent = `Victim triggered emergency SOS alert with live coordinates telemetry. Siren activated. Assigned responder unit: ${alert.dispatched_unit || 'Pending Dispatch'}.`;

    document.getElementById('modalSketchContainer').innerHTML = `<p class="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded">N/A for instant SOS trigger.</p>`;
    document.getElementById('modalEvidenceContainer').innerHTML = `<p class="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded col-span-full">Live GPS stream active.</p>`;
    document.getElementById('modalAudioContainer').innerHTML = `<p class="text-xs text-slate-500 italic">SOS Audio Siren broadcasted on victim device.</p>`;

    document.getElementById('modalAssignUnitSelect').value = alert.dispatched_unit || '';
    document.getElementById('modalStatusSelect').value = alert.status || 'ACTIVE';
    document.getElementById('modalDispatcherNotes').value = alert.dispatcher_notes || '';
  }

  // --- Dispatch Unit & Save Dispatcher Action ---
  async saveDispatchAction() {
    if (!this.activeModalItem) return;

    const unitCode = document.getElementById('modalAssignUnitSelect')?.value;
    const status = document.getElementById('modalStatusSelect')?.value;
    const notes = document.getElementById('modalDispatcherNotes')?.value;

    const payload = {
      unit_code: unitCode,
      status: status,
      notes: notes
    };

    if (this.activeModalType === 'report') {
      payload.report_id = this.activeModalItem.id;
    } else {
      payload.sos_id = this.activeModalItem.id;
    }

    try {
      const res = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        window.app?.showToast(`✅ Dispatch updated: ${unitCode || 'Unit'} assigned with status '${status}'.`, 'success');
        this.closeModal();
        this.fetchIncidents();
        this.fetchActiveSOS();
        if (window.alertxMap) window.alertxMap.renderAll();
      }
    } catch (e) {
      console.error('Dispatch update error:', e);
    }
  }

  closeModal() {
    const modal = document.getElementById('adminIncidentDetailModal');
    if (modal) modal.classList.add('hidden');
  }

  downloadSketch(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  playDemoAudio() {
    window.app?.showToast('🔊 Playing recorded voice note...', 'info');
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("He has been following me from the metro station. He is wearing a dark hoodie and glasses.");
      msg.rate = 1.0;
      window.speechSynthesis.speak(msg);
    }
  }

  // --- KPI Cards Update ---
  updateKPICards() {
    const total = this.currentReports.length;
    const critical = this.currentReports.filter(r => r.priority === 'CRITICAL').length;
    const resolved = this.currentReports.filter(r => r.status === 'Resolved').length;

    const totalEl = document.getElementById('kpiTotalReports');
    const criticalEl = document.getElementById('kpiCriticalCount');
    const resolvedEl = document.getElementById('kpiResolvedCount');
    const rateEl = document.getElementById('kpiResolutionRate');

    if (totalEl) totalEl.textContent = total;
    if (criticalEl) criticalEl.textContent = critical;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (rateEl) rateEl.textContent = `${Math.round((resolved / Math.max(1, total)) * 100)}%`;
  }

  // --- Chart.js Analytics ---
  async initAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();

      // 1. Priority Donut Chart
      const prioCtx = document.getElementById('adminPriorityChart');
      if (prioCtx && typeof Chart !== 'undefined') {
        if (this.charts.priority) this.charts.priority.destroy();

        const p = data.priority_distribution;
        this.charts.priority = new Chart(prioCtx, {
          type: 'doughnut',
          data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
              data: [p.CRITICAL || 1, p.HIGH || 1, p.MEDIUM || 1, p.LOW || 1],
              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
              }
            },
            cutout: '70%'
          }
        });
      }

      // 2. Categories Bar Chart
      const catCtx = document.getElementById('adminCategoryChart');
      if (catCtx && typeof Chart !== 'undefined') {
        if (this.charts.categories) this.charts.categories.destroy();

        const cats = data.categories || [];
        this.charts.categories = new Chart(catCtx, {
          type: 'bar',
          data: {
            labels: cats.map(c => c.category),
            datasets: [{
              label: 'Incidents Reported',
              data: cats.map(c => c.count),
              backgroundColor: '#818cf8',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
              y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
  // --- Print Official Police FIR & Crime Slip ---
  printOfficialFIR() {
    if (!this.activeModalItem) return;
    const item = this.activeModalItem;
    const isReport = this.activeModalType === 'report';

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (!printWin) {
      window.app?.showToast('Pop-up blocked. Please allow pop-ups to print FIR.', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AlertX - Official Incident Record / FIR #${item.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; padding: 30px; margin: 0; line-height: 1.5; font-size: 13px; }
          .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; text-align: center; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
          .badge-crit { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
          .badge-high { background: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }
          .badge-med { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
          .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .label { color: #64748b; font-size: 11px; }
          .val { font-weight: 600; color: #0f172a; }
          .narrative { background: #ffffff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-top: 15px; font-size: 12px; }
          .seal { border: 2px dashed #94a3b8; border-radius: 50%; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: bold; color: #64748b; margin-left: auto; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 10px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print Document</button>
        </div>

        <div class="header">
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px;">ALERTX SMART RESPONSE SYSTEM</div>
          <div style="font-size: 12px; font-weight: bold; color: #dc2626;">CENTRAL POLICE DISPATCH & WOMEN SAFETY COMMAND</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Official First Information Report (FIR) / Incident Triage Slip</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <div style="font-size: 16px; font-weight: 800;">REF: #${isReport ? 'REP' : 'SOS'}-${item.id}</div>
            <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <div>
            <span class="badge ${item.priority === 'CRITICAL' ? 'badge-crit' : item.priority === 'HIGH' ? 'badge-high' : 'badge-med'}">
              PRIORITY: ${item.priority || 'CRITICAL'} (Score: ${item.urgency_score || 95}%)
            </span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">1. Informant / Complainant Details</div>
            <div><span class="label">Name:</span> <span class="val">${item.reporter_name || item.user_name || 'Anonymous'}</span></div>
            <div><span class="label">Contact:</span> <span class="val">${item.reporter_phone || item.user_phone || 'N/A'}</span></div>
            <div><span class="label">Incident Category:</span> <span class="val">${item.category || 'Emergency SOS'}</span></div>
            <div><span class="label">Status:</span> <span class="val">${item.status || 'Pending'}</span></div>
          </div>

          <div class="card">
            <div class="card-title">2. Occurrence & Location Telemetry</div>
            <div><span class="label">Date & Time:</span> <span class="val">${item.incident_date || 'Live'} ${item.incident_time || ''}</span></div>
            <div><span class="label">Location:</span> <span class="val">${item.location_name || item.address || 'GPS Coordinates'}</span></div>
            <div><span class="label">GPS Coordinates:</span> <span class="val" style="font-family: monospace;">${item.latitude || '28.6328'}, ${item.longitude || '77.2195'}</span></div>
            <div><span class="label">Assigned Unit:</span> <span class="val">${item.assigned_unit || item.dispatched_unit || 'Pink Patrol 01'}</span></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">3. AI Threat & Urgency Assessment</div>
          <div style="font-size: 12px; color: #334155; font-style: italic;">
            ${item.ai_rationale || 'Critical emergency dispatch protocol triggered with live sirens and telemetry stream.'}
          </div>
        </div>

        <div class="narrative">
          <div class="card-title">4. Narrative & Statement of Occurrence</div>
          <p style="margin: 0; white-space: pre-line;">${item.description || 'Emergency SOS signal received directly from citizen device.'}</p>
        </div>

        ${item.suspect_sketch ? `
          <div style="margin-top: 15px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; display: flex; gap: 15px; align-items: center;">
            <img src="${item.suspect_sketch}" style="width: 100px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #94a3b8;" />
            <div>
              <div class="card-title">5. Attached Suspect Facial Feature Composite</div>
              <div style="font-size: 11px; color: #475569;">Facial portrait generated via AlertX Forensic Compositor. Forwarded to beat patrol and crime database search.</div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px;">
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #0f172a;">Investigating Officer / Dispatcher:</div>
            <div style="font-size: 12px; font-weight: 600;">Inspector Rajesh Varma (Women Safety Cell)</div>
            <div style="font-size: 10px; color: #64748b;">Central Police Control Room, Delhi</div>
          </div>
          <div class="seal">
            ALERTX<br/>VERIFIED<br/>OFFICIAL SEAL
          </div>
        </div>

        <div class="footer">
          <span>AlertX Digital Dispatch System • Electronic Verification QR: #AUT-${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          <span>Page 1 of 1</span>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  }
}

// Global instance
window.AdminDashboard = AdminDashboard;

