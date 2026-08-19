/**
 * AlertX Smart Response - Master Application Coordinator
 * Handles SPA navigation, role toggling (Citizen vs Admin), auth state, toasts, and initialization.
 */

class AlertXApp {
  constructor() {
    this.currentRole = 'user'; // 'user' or 'admin'
    this.currentUser = {
      id: 1,
      name: 'Priya Sharma',
      email: 'priya@alertx.org',
      phone: '+91 98765 43210',
      role: 'user',
      blood_group: 'O+',
      emergency_notes: 'Asthma patient, carries emergency inhaler',
      contacts: [
        { id: 1, name: 'Aarti Sharma', phone: '+91 98111 22334', relation: 'Mother', is_primary: 1 },
        { id: 2, name: 'Rohit Sharma', phone: '+91 98222 33445', relation: 'Brother', is_primary: 0 },
        { id: 3, name: 'College Security Desk', phone: '+91 98333 44556', relation: 'Campus Security', is_primary: 0 }
      ]
    };

    this.currentView = 'home';
  }

  init() {
    // 1. Initialize Submodules
    window.sketcher = new SuspectSketcher('sketchCanvas');
    window.sosController = new SOSController();
    window.reportManager = new ReportManager();
    window.alertxMap = new AlertXMap('mapContainer');
    window.safetyTools = new SafetyTools();
    window.adminDashboard = new AdminDashboard();

    // 2. Load User Profile from backend
    this.fetchUserProfile();
    this.fetchActiveSOS();

    // 3. Initial Icons Render
    lucide.createIcons();

    // 4. Set current date & time in report form
    const dateInput = document.getElementById('reportDate');
    const timeInput = document.getElementById('reportTime');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (timeInput) timeInput.value = new Date().toTimeString().slice(0, 5);

    // 5. Polling for live alerts & map updates
    setInterval(() => {
      this.fetchActiveSOS();
      if (this.currentRole === 'admin') {
        window.adminDashboard.fetchActiveSOS();
      }
    }, 8000);
  }

  // --- View Switcher ---
  switchView(viewName) {
    this.currentView = viewName;

    // Hide all view containers
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // Show target view
    const target = document.getElementById(`view_${viewName}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Nav links active states
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('text-red-400', 'bg-slate-800/80', 'font-bold');
        link.classList.remove('text-slate-300');
      } else {
        link.classList.remove('text-red-400', 'bg-slate-800/80', 'font-bold');
        link.classList.add('text-slate-300');
      }
    });

    // Special view initializations
    if (viewName === 'map') {
      setTimeout(() => {
        if (window.alertxMap && window.alertxMap.map) {
          window.alertxMap.map.invalidateSize();
          window.alertxMap.renderAll();
        }
      }, 200);
    } else if (viewName === 'sketch') {
      setTimeout(() => {
        if (window.sketcher) window.sketcher.render();
      }, 100);
    } else if (viewName === 'admin_overview' || viewName === 'admin_incidents') {
      window.adminDashboard.fetchIncidents();
      window.adminDashboard.fetchActiveSOS();
      window.adminDashboard.initAnalytics();
    }

    lucide.createIcons();
  }

  // --- Role Switcher (Citizen vs Admin) ---
  toggleRole(role) {
    this.currentRole = role;

    const citizenNav = document.getElementById('citizenNavItems');
    const adminNav = document.getElementById('adminNavItems');
    const roleToggleBtn = document.getElementById('roleToggleBtn');
    const userBadge = document.getElementById('currentUserBadge');

    if (role === 'admin') {
      if (citizenNav) citizenNav.classList.add('hidden');
      if (adminNav) adminNav.classList.remove('hidden');
      if (roleToggleBtn) {
        roleToggleBtn.innerHTML = `<i data-lucide="shield" class="w-4 h-4 text-emerald-400"></i> Mode: <b>Police Admin</b>`;
        roleToggleBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 transition";
      }
      if (userBadge) userBadge.textContent = 'Inspector Rajesh (Dispatcher)';
      this.switchView('admin_overview');
      this.showToast('Switched to Police Dispatcher & Control Center mode', 'info');
    } else {
      if (citizenNav) citizenNav.classList.remove('hidden');
      if (adminNav) adminNav.classList.add('hidden');
      if (roleToggleBtn) {
        roleToggleBtn.innerHTML = `<i data-lucide="user" class="w-4 h-4 text-red-400"></i> Mode: <b>Citizen Portal</b>`;
        roleToggleBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-700/60 hover:bg-red-900 transition";
      }
      if (userBadge) userBadge.textContent = this.currentUser.name || 'Priya Sharma';
      this.switchView('home');
      this.showToast('Switched to Citizen Emergency Portal', 'info');
    }

    lucide.createIcons();
  }

  // --- Send Suspect Sketch to Report Form ---
  useSketchInReport() {
    if (!window.sketcher) return;
    const sketchDataUrl = window.sketcher.getDataURL();
    window.reportManager.attachSketch(sketchDataUrl);
    this.switchView('report');
    this.showToast('Suspect Sketch composite attached to Crime Report!', 'success');
  }

  // --- Fetch User Profile ---
  async fetchUserProfile() {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data;
        this.renderProfileView();
      }
    } catch (e) {
      console.warn('Using local fallback profile:', e);
    }
  }

  renderProfileView() {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const phoneEl = document.getElementById('profilePhone');
    const bloodEl = document.getElementById('profileBloodGroup');
    const notesEl = document.getElementById('profileNotes');
    const contactsContainer = document.getElementById('profileContactsList');

    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (emailEl) emailEl.textContent = this.currentUser.email;
    if (phoneEl) phoneEl.textContent = this.currentUser.phone;
    if (bloodEl) bloodEl.textContent = this.currentUser.blood_group || 'O+';
    if (notesEl) notesEl.textContent = this.currentUser.emergency_notes || 'None';

    if (contactsContainer && this.currentUser.contacts) {
      contactsContainer.innerHTML = this.currentUser.contacts.map(c => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-sm">
              ${c.name.slice(0, 1)}
            </div>
            <div>
              <div class="font-bold text-sm text-slate-100 flex items-center gap-2">
                ${c.name}
                ${c.is_primary ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-600/30 text-red-300 border border-red-500/40">PRIMARY</span>` : ''}
              </div>
              <div class="text-xs text-slate-400 font-mono">${c.phone} • <span class="text-slate-300">${c.relation}</span></div>
            </div>
          </div>
          <button onclick="window.safetyTools.dialHelpline('${c.phone}', '${c.name}')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-emerald-400 transition" title="Test Alert Broadcast">
            <i data-lucide="phone" class="w-4 h-4"></i>
          </button>
        </div>
      `).join('');
    }

    lucide.createIcons();
  }

  // --- Add Emergency Contact ---
  async addContact() {
    const name = document.getElementById('newContactName')?.value.trim();
    const phone = document.getElementById('newContactPhone')?.value.trim();
    const relation = document.getElementById('newContactRelation')?.value.trim() || 'Family';
    const isPrimary = document.getElementById('newContactPrimary')?.checked ? 1 : 0;

    if (!name || !phone) {
      this.showToast('Please provide contact name and phone number', 'error');
      return;
    }

    try {
      const res = await fetch('/api/user/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.currentUser.id,
          name,
          phone,
          relation,
          is_primary: isPrimary
        })
      });
      const data = await res.json();

      if (data.success) {
        this.currentUser.contacts = data.contacts;
        this.renderProfileView();
        document.getElementById('newContactName').value = '';
        document.getElementById('newContactPhone').value = '';
        document.getElementById('addContactModal')?.classList.add('hidden');
        this.showToast('Emergency contact added successfully!', 'success');
      }
    } catch (e) {
      this.showToast('Contact saved in demo session.', 'info');
    }
  }

  // --- Fetch Active SOS for header banner ---
  async fetchActiveSOS() {
    try {
      const res = await fetch('/api/sos/active');
      const data = await res.json();
      const count = data.count || 0;

      const topBanner = document.getElementById('globalSOSActiveBanner');
      if (topBanner) {
        if (count > 0) {
          topBanner.classList.remove('hidden');
          document.getElementById('globalSosCountText').textContent = `${count} Active Distress Alert${count > 1 ? 's' : ''}`;
        } else {
          topBanner.classList.add('hidden');
        }
      }
    } catch (e) {}
  }

  // --- Toast Notification Engine ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    let bgClass = 'bg-slate-800 border-slate-700 text-slate-100';
    let iconName = 'info';

    if (type === 'error') {
      bgClass = 'bg-red-950/90 border-red-700/80 text-red-100';
      iconName = 'alert-triangle';
    } else if (type === 'success') {
      bgClass = 'bg-emerald-950/90 border-emerald-700/80 text-emerald-100';
      iconName = 'check-circle-2';
    }

    toast.className = `p-3.5 rounded-xl border shadow-xl flex items-center gap-3 animate-fade-in backdrop-blur-md max-w-sm ${bgClass}`;
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 shrink-0 ${type === 'error' ? 'text-red-400' : type === 'success' ? 'text-emerald-400' : 'text-blue-400'}"></i>
      <div class="text-xs font-semibold leading-snug flex-1">${message}</div>
      <button onclick="this.parentElement.remove()" class="p-1 text-slate-400 hover:text-white"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Reset Demo Data ---
  async resetDemoData() {
    if (!confirm('Re-seed AlertX database with fresh demo data?')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        this.showToast('✨ Database refreshed with demo records!', 'success');
        setTimeout(() => location.reload(), 800);
      }
    } catch (e) {
      location.reload();
    }
  }
}

// Global App bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AlertXApp();
  window.app.init();
});
