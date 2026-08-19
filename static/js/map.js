/**
 * AlertX Smart Response - Interactive Safety Map & Safe Haven Locator
 * Powered by Leaflet.js: Renders active SOS pulses, crime pins, verified safe zones, and safe routing guidance.
 */

class AlertXMap {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.sosLayer = null;
    this.reportsLayer = null;
    this.safeZonesLayer = null;
    this.routeLayer = null;
    this.userMarker = null;

    this.filters = {
      sos: true,
      reports: true,
      safeZones: true
    };

    this.initMap();
  }

  initMap() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    const defaultLat = 28.6328;
    const defaultLng = 77.2195;

    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView([defaultLat, defaultLng], 13);

    // Dark-styled map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    // Initialize layer groups
    this.sosLayer = L.layerGroup().addTo(this.map);
    this.reportsLayer = L.layerGroup().addTo(this.map);
    this.safeZonesLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);

    // Add user marker
    this.updateUserPosition(defaultLat, defaultLng);

    // Initial render
    this.renderAll();
  }

  updateUserPosition(lat, lng) {
    if (!this.map) return;

    const userIcon = L.divIcon({
      className: 'user-loc-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
          <span class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      this.userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(this.map)
        .bindPopup('<b class="text-xs">Your Current GPS Location</b>');
    }
  }

  async renderAll() {
    if (!this.map) return;
    await Promise.all([
      this.renderActiveSOS(),
      this.renderReports(),
      this.renderSafeZones()
    ]);
  }

  // --- 1. Render Active SOS Beacons ---
  async renderActiveSOS() {
    this.sosLayer.clearLayers();
    if (!this.filters.sos) return;

    try {
      const res = await fetch('/api/sos/active');
      const data = await res.json();
      const alerts = data.alerts || [];

      alerts.forEach(alert => {
        const sosIcon = L.divIcon({
          className: 'sos-map-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="sos-marker-pulse"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([alert.latitude, alert.longitude], { icon: sosIcon });
        marker.bindPopup(`
          <div class="p-1 max-w-xs font-sans text-slate-800">
            <div class="flex items-center gap-1.5 font-bold text-red-600 text-xs mb-1">
              <span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              🚨 ACTIVE EMERGENCY SOS #${alert.id}
            </div>
            <div class="text-xs text-slate-700 font-medium">${alert.user_name} (${alert.user_phone})</div>
            <div class="text-[11px] text-slate-500 mt-1">${alert.address}</div>
            <div class="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[11px]">
              <span class="font-bold text-emerald-700">Unit: ${alert.dispatched_unit || 'Dispatched'}</span>
              <button onclick="window.app.openAdminIncidentModal(${alert.id}, 'sos')" class="px-2 py-0.5 bg-red-600 text-white rounded font-medium hover:bg-red-700">View Feed</button>
            </div>
          </div>
        `);
        this.sosLayer.addLayer(marker);
      });
    } catch (e) {
      console.warn('Failed to load active SOS for map:', e);
    }
  }

  // --- 2. Render Incident Crime Markers ---
  async renderReports() {
    this.reportsLayer.clearLayers();
    if (!this.filters.reports) return;

    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      const reports = data.reports || [];

      reports.forEach(rep => {
        if (!rep.latitude || !rep.longitude) return;

        let pinBg = 'bg-blue-600';
        if (rep.priority === 'CRITICAL') pinBg = 'bg-red-600';
        else if (rep.priority === 'HIGH') pinBg = 'bg-orange-500';
        else if (rep.priority === 'MEDIUM') pinBg = 'bg-yellow-500';

        const repIcon = L.divIcon({
          className: 'report-map-marker',
          html: `
            <div class="w-6 h-6 rounded-full ${pinBg} text-white flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white">
              ${rep.category.slice(0, 1)}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: repIcon });
        marker.bindPopup(`
          <div class="p-1 max-w-xs font-sans text-slate-800">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white ${pinBg}">${rep.priority}</span>
              <span class="text-[10px] text-slate-500 font-mono">${rep.incident_time || ''}</span>
            </div>
            <div class="font-bold text-xs text-slate-900 line-clamp-1">${rep.title}</div>
            <div class="text-[11px] text-slate-600 line-clamp-2 mt-1">${rep.description}</div>
            ${rep.suspect_sketch ? `<div class="mt-1.5"><img src="${rep.suspect_sketch}" class="w-14 h-16 object-cover rounded border border-slate-300" /></div>` : ''}
            <div class="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[11px]">
              <span class="text-slate-500 font-medium">Status: <b>${rep.status}</b></span>
              <button onclick="window.app.openAdminIncidentModal(${rep.id}, 'report')" class="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] hover:bg-slate-800">Details</button>
            </div>
          </div>
        `);
        this.reportsLayer.addLayer(marker);
      });
    } catch (e) {
      console.warn('Failed to load reports for map:', e);
    }
  }

  // --- 3. Render Verified Safe Zones ---
  async renderSafeZones() {
    this.safeZonesLayer.clearLayers();
    if (!this.filters.safeZones) return;

    try {
      const res = await fetch('/api/safe-zones');
      const data = await res.json();
      const zones = data.safe_zones || [];

      zones.forEach(zone => {
        let iconHtml = '🛡️';
        let colorClass = 'bg-blue-800 text-white';

        if (zone.type === 'PINK_BOOTH') {
          iconHtml = '🌸';
          colorClass = 'bg-pink-600 text-white';
        } else if (zone.type === 'HOSPITAL') {
          iconHtml = '🏥';
          colorClass = 'bg-emerald-600 text-white';
        } else if (zone.type === 'SHELTER') {
          iconHtml = '🏠';
          colorClass = 'bg-purple-600 text-white';
        }

        const zoneIcon = L.divIcon({
          className: 'safezone-map-marker',
          html: `
            <div class="w-7 h-7 rounded-full ${colorClass} flex items-center justify-center text-xs shadow-md border-2 border-white cursor-pointer hover:scale-110 transition">
              ${iconHtml}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([zone.latitude, zone.longitude], { icon: zoneIcon });
        marker.bindPopup(`
          <div class="p-1 max-w-xs font-sans text-slate-800">
            <div class="flex items-center gap-1.5 font-bold text-xs mb-1">
              <span class="text-sm">${iconHtml}</span> ${zone.name}
            </div>
            <div class="text-[11px] text-slate-600">${zone.address}</div>
            <div class="text-[11px] text-emerald-700 font-semibold mt-1">📞 ${zone.phone} (24/7 Verified)</div>
            <div class="mt-2 pt-1 border-t border-slate-200">
              <button onclick="window.alertxMap.routeToSafeZone(${zone.latitude}, ${zone.longitude}, '${zone.name}')" class="w-full py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700">
                🧭 Navigate to Safe Haven
              </button>
            </div>
          </div>
        `);
        this.safeZonesLayer.addLayer(marker);
      });
    } catch (e) {
      console.warn('Failed to load safe zones for map:', e);
    }
  }

  // --- 4. Route Guidance to Safe Zone ---
  routeToSafeZone(destLat, destLng, destName) {
    this.routeLayer.clearLayers();

    const userLat = window.sosController?.currentLocation.latitude || 28.6328;
    const userLng = window.sosController?.currentLocation.longitude || 77.2195;

    // Draw route line
    const polyline = L.polyline([
      [userLat, userLng],
      [destLat, destLng]
    ], {
      color: '#10b981',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }).addTo(this.routeLayer);

    this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Haversine distance
    const distKm = this.calculateDistance(userLat, userLng, destLat, destLng);
    const walkMins = Math.round((distKm / 4.5) * 60);

    const banner = document.getElementById('safeRouteBanner');
    if (banner) {
      document.getElementById('safeRouteDestName').textContent = destName;
      document.getElementById('safeRouteDist').textContent = `${distKm.toFixed(2)} km (${walkMins} min walk)`;
      banner.classList.remove('hidden');
    }

    window.app?.showToast(`🧭 Route mapped to ${destName} (${distKm.toFixed(2)} km)`, 'success');
  }

  clearRoute() {
    this.routeLayer.clearLayers();
    const banner = document.getElementById('safeRouteBanner');
    if (banner) banner.classList.add('hidden');
  }

  // Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Filter Toggles
  toggleFilter(type) {
    this.filters[type] = !this.filters[type];
    const btn = document.getElementById(`filter_${type}_btn`);
    if (btn) {
      if (this.filters[type]) {
        btn.classList.add('bg-slate-700', 'text-white');
        btn.classList.remove('opacity-50');
      } else {
        btn.classList.remove('bg-slate-700', 'text-white');
        btn.classList.add('opacity-50');
      }
    }
    this.renderAll();
  }
}

// Global instance
window.AlertXMap = AlertXMap;
