/**
 * AlertX Smart Response - Suspect Sketch Compositor Engine
 * Generates modular composite suspect portraits using layered vector & canvas rendering.
 */

class SuspectSketcher {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Feature state
    this.state = {
      faceShape: 'oval', // 'oval', 'round', 'square', 'sharp', 'heart'
      skinTone: '#e0ac69', // hex
      hairStyle: 'side_part', // 'short', 'side_part', 'curly', 'slick', 'spiky', 'buzz', 'bald', 'long_wavy', 'ponytail'
      hairColor: '#1c1917', // hex
      eyebrows: 'natural', // 'natural', 'bushy', 'angry', 'thin', 'straight'
      eyes: 'almond', // 'almond', 'round', 'narrow', 'deep_set', 'hooded'
      eyeColor: '#451a03', // hex
      nose: 'standard', // 'standard', 'aquiline', 'wide', 'button', 'pointed'
      mouth: 'neutral', // 'neutral', 'thin', 'full', 'smirk', 'frown'
      beard: 'stubble', // 'none', 'stubble', 'full_beard', 'goatee', 'mustache', 'french'
      beardColor: '#1c1917',
      accessories: 'none', // 'none', 'glasses_wire', 'glasses_thick', 'sunglasses', 'cap', 'beanie', 'mask', 'scar', 'piercing'
      filterMode: 'realistic' // 'realistic', 'charcoal'
    };

    this.render();
  }

  updateFeature(feature, value) {
    this.state[feature] = value;
    if (feature === 'hairColor' && this.state.beardColor === this.state.hairColor) {
      this.state.beardColor = value;
    }
    this.render();
  }

  // Forensic Police Database Match Simulator
  runDatabaseMatch() {
    const modal = document.getElementById('suspectMatchModal');
    const container = document.getElementById('suspectMatchResults');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    container.innerHTML = `
      <div class="p-6 text-center space-y-3">
        <i data-lucide="loader-2" class="w-8 h-8 mx-auto text-purple-400 animate-spin"></i>
        <div class="text-sm font-bold text-white">Scanning Crime Record Database...</div>
        <p class="text-xs text-slate-400">Comparing facial feature ratios, jaw symmetry, hair pattern & accessory markers against active records.</p>
      </div>
    `;
    lucide.createIcons();

    setTimeout(() => {
      // Mock matches
      const matches = [
        {
          name: "Suspect Record #CR-8812",
          alias: "Known Eve-Teaser / Stalker",
          matchScore: 94,
          area: "University Ring Road & North Campus",
          offenses: "Multiple stalking & eve-teasing complaints",
          status: "Under Watchlist / Warrant Active"
        },
        {
          name: "Suspect Record #CR-7429",
          alias: "Transit Snatcher / Motorcycle Trailing",
          matchScore: 78,
          area: "Sector 18 Metro Plaza",
          offenses: "Bag snatching & aggressive harassment",
          status: "Previous Conviction"
        }
      ];

      container.innerHTML = `
        <div class="space-y-3">
          <div class="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 text-xs text-purple-200 flex items-center justify-between">
            <span class="font-bold flex items-center gap-1.5"><i data-lucide="scan-face" class="w-4 h-4 text-purple-400"></i> 2 Potential Forensic Matches Found</span>
            <span class="font-mono text-[10px] text-purple-300">Confidence: HIGH</span>
          </div>

          ${matches.map(m => `
            <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-sm text-white">${m.name}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">${m.matchScore}% MATCH</span>
                </div>
                <div class="text-xs text-slate-300 font-medium">Alias: <span class="text-amber-400">${m.alias}</span></div>
                <div class="text-xs text-slate-400">Past Hotspot: <span class="text-slate-200">${m.area}</span></div>
                <div class="text-[11px] text-slate-400">Prior History: ${m.offenses}</div>
                <div class="text-[11px] text-red-400 font-bold mt-1">Status: ${m.status}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      lucide.createIcons();
    }, 1200);
  }

  randomize() {
    const faceShapes = ['oval', 'round', 'square', 'sharp', 'heart'];
    const skinTones = ['#fcd5b5', '#f3c299', '#e0ac69', '#bb8354', '#8d5524', '#593315'];
    const hairStyles = ['short', 'side_part', 'curly', 'slick', 'spiky', 'buzz', 'bald', 'long_wavy'];
    const hairColors = ['#1c1917', '#38220f', '#543d2b', '#7c2d12', '#475569'];
    const eyebrows = ['natural', 'bushy', 'angry', 'thin', 'straight'];
    const eyes = ['almond', 'round', 'narrow', 'deep_set', 'hooded'];
    const eyeColors = ['#2e1065', '#451a03', '#1e3a8a', '#14532d', '#334155'];
    const noses = ['standard', 'aquiline', 'wide', 'button', 'pointed'];
    const mouths = ['neutral', 'thin', 'full', 'smirk', 'frown'];
    const beards = ['none', 'stubble', 'full_beard', 'goatee', 'mustache', 'french'];
    const accessories = ['none', 'glasses_wire', 'glasses_thick', 'sunglasses', 'cap', 'beanie', 'mask', 'scar', 'piercing'];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    this.state.faceShape = pick(faceShapes);
    this.state.skinTone = pick(skinTones);
    this.state.hairStyle = pick(hairStyles);
    this.state.hairColor = pick(hairColors);
    this.state.beardColor = this.state.hairColor;
    this.state.eyebrows = pick(eyebrows);
    this.state.eyes = pick(eyes);
    this.state.eyeColor = pick(eyeColors);
    this.state.nose = pick(noses);
    this.state.mouth = pick(mouths);
    this.state.beard = pick(beards);
    this.state.accessories = pick(accessories);

    this.render();
    this.syncUIControls();
  }

  syncUIControls() {
    for (const key of Object.keys(this.state)) {
      const select = document.getElementById(`sketch_${key}`);
      if (select) select.value = this.state[key];
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Background / Canvas Paper
    ctx.fillStyle = this.state.filterMode === 'charcoal' ? '#f1f5f9' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper noise / grid lines for forensic look
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let i = 20; i < w; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 20; j < h; j += 25) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2 - 15;

    // Draw layers in order
    this.drawNeckAndShoulders(ctx, cx, cy);
    this.drawEars(ctx, cx, cy);
    this.drawHead(ctx, cx, cy);
    this.drawHairBack(ctx, cx, cy);
    this.drawEyesAndBrows(ctx, cx, cy);
    this.drawNose(ctx, cx, cy);
    this.drawMouth(ctx, cx, cy);
    this.drawFacialHair(ctx, cx, cy);
    this.drawHairFront(ctx, cx, cy);
    this.drawAccessories(ctx, cx, cy);

    // Forensic Ruler Overlay
    this.drawForensicBorder(ctx, w, h);

    // Apply charcoal / sketch filter if selected
    if (this.state.filterMode === 'charcoal') {
      this.applyCharcoalFilter(ctx, w, h);
    }
  }

  // --- Layer 1: Neck & Shoulders ---
  drawNeckAndShoulders(ctx, cx, cy) {
    const skin = this.getToneColor(this.state.skinTone, -15);
    ctx.fillStyle = skin;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.5;

    // Neck
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 90);
    ctx.lineTo(cx - 45, cy + 175);
    ctx.lineTo(cx + 45, cy + 175);
    ctx.lineTo(cx + 45, cy + 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neck shadow under chin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 115, 38, 14, 0, 0, Math.PI);
    ctx.fill();

    // Clothes / Collar
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 250);
    ctx.quadraticCurveTo(cx - 110, cy + 170, cx - 45, cy + 175);
    ctx.lineTo(cx, cy + 205);
    ctx.lineTo(cx + 45, cy + 175);
    ctx.quadraticCurveTo(cx + 110, cy + 170, cx + 150, cy + 250);
    ctx.lineTo(cx - 150, cy + 250);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner shirt collar
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy + 175);
    ctx.lineTo(cx, cy + 195);
    ctx.lineTo(cx + 35, cy + 175);
    ctx.closePath();
    ctx.fill();
  }

  // --- Layer 2: Ears ---
  drawEars(ctx, cx, cy) {
    const skin = this.state.skinTone;
    const shadow = this.getToneColor(skin, -20);
    ctx.fillStyle = skin;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.5;

    // Left Ear
    ctx.beginPath();
    ctx.ellipse(cx - 88, cy + 15, 14, 28, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner left ear lines
    ctx.strokeStyle = shadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - 88, cy + 10, 7, 0, Math.PI * 1.5);
    ctx.stroke();

    // Right Ear
    ctx.fillStyle = skin;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx + 88, cy + 15, 14, 28, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner right ear
    ctx.strokeStyle = shadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + 88, cy + 10, 7, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();
  }

  // --- Layer 3: Head / Face Shape ---
  drawHead(ctx, cx, cy) {
    const skin = this.state.skinTone;
    ctx.fillStyle = skin;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.8;

    ctx.beginPath();

    switch (this.state.faceShape) {
      case 'round':
        ctx.ellipse(cx, cy + 10, 84, 98, 0, 0, Math.PI * 2);
        break;

      case 'square':
        ctx.moveTo(cx - 80, cy - 70);
        ctx.quadraticCurveTo(cx, cy - 88, cx + 80, cy - 70);
        ctx.lineTo(cx + 82, cy + 40);
        ctx.quadraticCurveTo(cx + 78, cy + 105, cx + 45, cy + 115);
        ctx.lineTo(cx - 45, cy + 115);
        ctx.quadraticCurveTo(cx - 78, cy + 105, cx - 82, cy + 40);
        ctx.closePath();
        break;

      case 'sharp':
        ctx.moveTo(cx - 78, cy - 70);
        ctx.quadraticCurveTo(cx, cy - 88, cx + 78, cy - 70);
        ctx.lineTo(cx + 82, cy + 20);
        ctx.lineTo(cx + 25, cy + 125); // Sharp V-chin
        ctx.lineTo(cx - 25, cy + 125);
        ctx.lineTo(cx - 82, cy + 20);
        ctx.closePath();
        break;

      case 'heart':
        ctx.moveTo(cx - 85, cy - 60);
        ctx.quadraticCurveTo(cx, cy - 85, cx + 85, cy - 60);
        ctx.quadraticCurveTo(cx + 85, cy + 30, cx + 30, cy + 120);
        ctx.quadraticCurveTo(cx, cy + 130, cx - 30, cy + 120);
        ctx.quadraticCurveTo(cx - 85, cy + 30, cx - 85, cy - 60);
        ctx.closePath();
        break;

      case 'oval':
      default:
        ctx.moveTo(cx - 80, cy - 60);
        ctx.quadraticCurveTo(cx, cy - 90, cx + 80, cy - 60);
        ctx.quadraticCurveTo(cx + 85, cy + 40, cx + 40, cy + 112);
        ctx.quadraticCurveTo(cx, cy + 122, cx - 40, cy + 112);
        ctx.quadraticCurveTo(cx - 85, cy + 40, cx - 80, cy - 60);
        ctx.closePath();
        break;
    }

    ctx.fill();
    ctx.stroke();

    // Cheekbones and temple shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.beginPath();
    ctx.ellipse(cx - 60, cy + 30, 16, 25, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 60, cy + 30, 16, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Layer 4: Hair Back (for long hair / ponytail) ---
  drawHairBack(ctx, cx, cy) {
    if (this.state.hairStyle !== 'long_wavy' && this.state.hairStyle !== 'ponytail') return;

    ctx.fillStyle = this.state.hairColor;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;

    if (this.state.hairStyle === 'long_wavy') {
      ctx.beginPath();
      ctx.moveTo(cx - 85, cy - 40);
      ctx.quadraticCurveTo(cx - 110, cy + 80, cx - 95, cy + 200);
      ctx.quadraticCurveTo(cx - 70, cy + 190, cx - 50, cy + 170);
      ctx.lineTo(cx - 45, cy + 100);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 85, cy - 40);
      ctx.quadraticCurveTo(cx + 110, cy + 80, cx + 95, cy + 200);
      ctx.quadraticCurveTo(cx + 70, cy + 190, cx + 50, cy + 170);
      ctx.lineTo(cx + 45, cy + 100);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.state.hairStyle === 'ponytail') {
      ctx.beginPath();
      ctx.ellipse(cx + 85, cy - 20, 22, 45, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // --- Layer 5: Eyes & Eyebrows ---
  drawEyesAndBrows(ctx, cx, cy) {
    const eyeY = cy - 2;
    const eyeDist = 38;

    // Eyebrow settings
    const browY = eyeY - 20;
    ctx.fillStyle = this.state.hairColor;
    ctx.strokeStyle = this.state.hairColor;

    // Draw Eyebrows
    const drawBrow = (bx, flip) => {
      ctx.lineWidth = this.state.eyebrows === 'bushy' ? 7 : this.state.eyebrows === 'thin' ? 2.5 : 4.5;
      ctx.beginPath();
      const dir = flip ? -1 : 1;

      switch (this.state.eyebrows) {
        case 'angry':
          ctx.moveTo(bx - (18 * dir), browY + 6);
          ctx.lineTo(bx + (20 * dir), browY - 6);
          break;
        case 'straight':
          ctx.moveTo(bx - (20 * dir), browY);
          ctx.lineTo(bx + (20 * dir), browY);
          break;
        case 'bushy':
          ctx.moveTo(bx - (22 * dir), browY + 4);
          ctx.quadraticCurveTo(bx, browY - 8, bx + (22 * dir), browY + 4);
          break;
        case 'natural':
        default:
          ctx.moveTo(bx - (20 * dir), browY + 4);
          ctx.quadraticCurveTo(bx, browY - 6, bx + (20 * dir), browY + 2);
          break;
      }
      ctx.stroke();
    };

    drawBrow(cx - eyeDist, false);
    drawBrow(cx + eyeDist, true);

    // Draw Eyes
    const drawSingleEye = (ex, flip) => {
      const dir = flip ? -1 : 1;

      // Sclera (White)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      if (this.state.eyes === 'narrow') {
        ctx.moveTo(ex - 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY - 7, ex + 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + 6, ex - 18, eyeY);
      } else if (this.state.eyes === 'round') {
        ctx.moveTo(ex - 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY - 14, ex + 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + 12, ex - 18, eyeY);
      } else if (this.state.eyes === 'deep_set') {
        ctx.moveTo(ex - 19, eyeY + 2);
        ctx.quadraticCurveTo(ex, eyeY - 9, ex + 19, eyeY + 1);
        ctx.quadraticCurveTo(ex, eyeY + 8, ex - 19, eyeY + 2);
      } else { // almond
        ctx.moveTo(ex - 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY - 10, ex + 18, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + 8, ex - 18, eyeY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Iris
      ctx.save();
      ctx.clip();

      ctx.fillStyle = this.state.eyeColor;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Glint highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2.5, eyeY - 2.5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Upper eyelid fold line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ex, eyeY - 7, 13, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    };

    drawSingleEye(cx - eyeDist, false);
    drawSingleEye(cx + eyeDist, true);
  }

  // --- Layer 6: Nose ---
  drawNose(ctx, cx, cy) {
    const noseY = cy + 22;
    ctx.strokeStyle = '#27272a';
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2.4;

    ctx.beginPath();

    switch (this.state.nose) {
      case 'aquiline':
        ctx.moveTo(cx - 3, cy - 8);
        ctx.lineTo(cx - 8, noseY - 5);
        ctx.lineTo(cx, noseY + 12);
        ctx.quadraticCurveTo(cx - 15, noseY + 13, cx - 18, noseY + 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, noseY + 12);
        ctx.quadraticCurveTo(cx + 15, noseY + 13, cx + 18, noseY + 6);
        ctx.stroke();
        break;

      case 'wide':
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx - 5, noseY + 8);
        ctx.lineTo(cx, noseY + 10);
        ctx.stroke();
        // Nostrils wide
        ctx.beginPath();
        ctx.arc(cx - 16, noseY + 7, 7, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 16, noseY + 7, 7, 0, Math.PI);
        ctx.stroke();
        break;

      case 'button':
        ctx.beginPath();
        ctx.arc(cx, noseY + 8, 8, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx - 12, noseY + 7, 4, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 12, noseY + 7, 4, 0, Math.PI);
        ctx.stroke();
        break;

      case 'pointed':
        ctx.moveTo(cx - 4, cy - 5);
        ctx.lineTo(cx - 4, noseY + 12);
        ctx.lineTo(cx, noseY + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 11, noseY + 10);
        ctx.lineTo(cx, noseY + 14);
        ctx.lineTo(cx + 11, noseY + 10);
        ctx.stroke();
        break;

      case 'standard':
      default:
        ctx.moveTo(cx - 4, cy - 2);
        ctx.lineTo(cx - 4, noseY + 8);
        ctx.quadraticCurveTo(cx, noseY + 12, cx + 5, noseY + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx - 13, noseY + 6, 5, 0.2, Math.PI * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 13, noseY + 6, 5, 0.1, Math.PI * 0.8);
        ctx.stroke();
        break;
    }
  }

  // --- Layer 7: Mouth & Lips ---
  drawMouth(ctx, cx, cy) {
    const mouthY = cy + 68;
    const skin = this.state.skinTone;
    const lipColor = this.getToneColor(skin, -25);

    ctx.fillStyle = lipColor;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.4;

    ctx.beginPath();

    switch (this.state.mouth) {
      case 'thin':
        ctx.moveTo(cx - 24, mouthY);
        ctx.lineTo(cx + 24, mouthY);
        ctx.stroke();
        break;

      case 'full':
        // Upper lip
        ctx.moveTo(cx - 26, mouthY);
        ctx.quadraticCurveTo(cx - 10, mouthY - 8, cx, mouthY - 4);
        ctx.quadraticCurveTo(cx + 10, mouthY - 8, cx + 26, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + 2, cx - 26, mouthY);
        ctx.fill();
        ctx.stroke();
        // Lower lip
        ctx.beginPath();
        ctx.moveTo(cx - 24, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + 14, cx + 24, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + 3, cx - 24, mouthY);
        ctx.fill();
        ctx.stroke();
        break;

      case 'smirk':
        ctx.moveTo(cx - 24, mouthY + 3);
        ctx.quadraticCurveTo(cx, mouthY - 2, cx + 26, mouthY - 8);
        ctx.stroke();
        // Lower crease
        ctx.beginPath();
        ctx.arc(cx + 2, mouthY + 6, 12, 0.2, Math.PI * 0.8);
        ctx.stroke();
        break;

      case 'frown':
        ctx.moveTo(cx - 24, mouthY + 5);
        ctx.quadraticCurveTo(cx, mouthY - 4, cx + 24, mouthY + 5);
        ctx.stroke();
        break;

      case 'neutral':
      default:
        // Center separation line
        ctx.moveTo(cx - 25, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + 2, cx + 25, mouthY);
        ctx.stroke();
        // Subtle lower lip line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, mouthY + 3, 14, 0.3, Math.PI * 0.7);
        ctx.stroke();
        break;
    }
  }

  // --- Layer 8: Facial Hair ---
  drawFacialHair(ctx, cx, cy) {
    if (this.state.beard === 'none') return;

    ctx.fillStyle = this.state.beardColor;
    ctx.strokeStyle = this.state.beardColor;

    const mouthY = cy + 68;

    switch (this.state.beard) {
      case 'stubble':
        // Stipple dots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let i = 0; i < 90; i++) {
          const angle = Math.random() * Math.PI;
          const radius = Math.random() * 45;
          const dx = cx + (Math.random() - 0.5) * 80;
          const dy = mouthY + 15 + Math.random() * 38;
          ctx.fillRect(dx, dy, 2, 2);
        }
        break;

      case 'mustache':
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 28, mouthY - 7);
        ctx.quadraticCurveTo(cx - 10, mouthY - 14, cx, mouthY - 7);
        ctx.quadraticCurveTo(cx + 10, mouthY - 14, cx + 28, mouthY - 7);
        ctx.stroke();
        break;

      case 'goatee':
        // Mustache
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 22, mouthY - 7);
        ctx.quadraticCurveTo(cx, mouthY - 12, cx + 22, mouthY - 7);
        ctx.stroke();
        // Chin beard
        ctx.beginPath();
        ctx.ellipse(cx, mouthY + 32, 18, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'french':
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, mouthY + 12, 28, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'full_beard':
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 82, cy + 30);
        ctx.quadraticCurveTo(cx - 85, cy + 120, cx - 40, cy + 145);
        ctx.quadraticCurveTo(cx, cy + 155, cx + 40, cy + 145);
        ctx.quadraticCurveTo(cx + 85, cy + 120, cx + 82, cy + 30);
        ctx.quadraticCurveTo(cx + 70, cy + 90, cx + 30, cy + 100);
        ctx.quadraticCurveTo(cx, cy + 102, cx - 30, cy + 100);
        ctx.quadraticCurveTo(cx - 70, cy + 90, cx - 82, cy + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Mustache connected
        ctx.beginPath();
        ctx.moveTo(cx - 30, mouthY - 8);
        ctx.quadraticCurveTo(cx, mouthY - 15, cx + 30, mouthY - 8);
        ctx.lineWidth = 7;
        ctx.stroke();
        break;
    }
  }

  // --- Layer 9: Hair Front ---
  drawHairFront(ctx, cx, cy) {
    if (this.state.hairStyle === 'bald') return;

    ctx.fillStyle = this.state.hairColor;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;

    ctx.beginPath();

    switch (this.state.hairStyle) {
      case 'buzz':
        ctx.moveTo(cx - 82, cy - 40);
        ctx.quadraticCurveTo(cx, cy - 95, cx + 82, cy - 40);
        ctx.lineTo(cx + 80, cy - 50);
        ctx.quadraticCurveTo(cx, cy - 80, cx - 80, cy - 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'spiky':
        ctx.moveTo(cx - 85, cy - 40);
        ctx.lineTo(cx - 70, cy - 85);
        ctx.lineTo(cx - 50, cy - 75);
        ctx.lineTo(cx - 30, cy - 105);
        ctx.lineTo(cx, cy - 80);
        ctx.lineTo(cx + 30, cy - 110);
        ctx.lineTo(cx + 50, cy - 80);
        ctx.lineTo(cx + 75, cy - 90);
        ctx.lineTo(cx + 85, cy - 40);
        ctx.quadraticCurveTo(cx, cy - 65, cx - 85, cy - 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'curly':
        // Cloud-like bumps
        ctx.arc(cx - 65, cy - 70, 25, 0, Math.PI * 2);
        ctx.arc(cx - 30, cy - 95, 30, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 98, 30, 0, Math.PI * 2);
        ctx.arc(cx + 60, cy - 75, 26, 0, Math.PI * 2);
        ctx.arc(cx + 75, cy - 45, 20, 0, Math.PI * 2);
        ctx.arc(cx - 75, cy - 45, 20, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'slick':
        ctx.moveTo(cx - 85, cy - 40);
        ctx.quadraticCurveTo(cx - 80, cy - 100, cx, cy - 100);
        ctx.quadraticCurveTo(cx + 80, cy - 100, cx + 85, cy - 40);
        ctx.quadraticCurveTo(cx, cy - 68, cx - 85, cy - 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'side_part':
      default:
        ctx.moveTo(cx - 85, cy - 40);
        ctx.quadraticCurveTo(cx - 70, cy - 98, cx - 20, cy - 100);
        ctx.quadraticCurveTo(cx + 60, cy - 95, cx + 88, cy - 35);
        ctx.quadraticCurveTo(cx + 40, cy - 65, cx - 10, cy - 68);
        ctx.quadraticCurveTo(cx - 50, cy - 50, cx - 85, cy - 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  }

  // --- Layer 10: Accessories & Distinguishing Marks ---
  drawAccessories(ctx, cx, cy) {
    if (this.state.accessories === 'none') return;

    const eyeY = cy - 2;
    const mouthY = cy + 68;

    switch (this.state.accessories) {
      case 'glasses_wire':
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        // Left rim
        ctx.strokeRect(cx - 60, eyeY - 14, 44, 28);
        // Right rim
        ctx.strokeRect(cx + 16, eyeY - 14, 44, 28);
        // Bridge
        ctx.beginPath();
        ctx.moveTo(cx - 16, eyeY);
        ctx.lineTo(cx + 16, eyeY);
        ctx.stroke();
        // Arms
        ctx.beginPath();
        ctx.moveTo(cx - 60, eyeY - 8);
        ctx.lineTo(cx - 85, eyeY - 12);
        ctx.moveTo(cx + 60, eyeY - 8);
        ctx.lineTo(cx + 85, eyeY - 12);
        ctx.stroke();
        break;

      case 'glasses_thick':
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 5.5;
        ctx.strokeRect(cx - 62, eyeY - 16, 48, 32);
        ctx.strokeRect(cx + 14, eyeY - 16, 48, 32);
        ctx.beginPath();
        ctx.moveTo(cx - 14, eyeY - 2);
        ctx.lineTo(cx + 14, eyeY - 2);
        ctx.stroke();
        break;

      case 'sunglasses':
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        // Left Lens
        ctx.beginPath();
        ctx.roundRect(cx - 65, eyeY - 16, 52, 34, [4, 4, 18, 18]);
        ctx.fill();
        ctx.stroke();
        // Right Lens
        ctx.beginPath();
        ctx.roundRect(cx + 13, eyeY - 16, 52, 34, [4, 4, 18, 18]);
        ctx.fill();
        ctx.stroke();
        // Bridge
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 13, eyeY - 6);
        ctx.lineTo(cx + 13, eyeY - 6);
        ctx.stroke();
        break;

      case 'cap':
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        // Crown
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 88, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Visor / Brim
        ctx.beginPath();
        ctx.ellipse(cx, cy - 45, 95, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'beanie':
        ctx.fillStyle = '#b91c1c';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 55, 88, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Fold
        ctx.fillRect(cx - 88, cy - 65, 176, 25);
        ctx.strokeRect(cx - 88, cy - 65, 176, 25);
        break;

      case 'mask':
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 75, cy + 35);
        ctx.quadraticCurveTo(cx, cy + 18, cx + 75, cy + 35);
        ctx.lineTo(cx + 65, mouthY + 45);
        ctx.quadraticCurveTo(cx, mouthY + 60, cx - 65, mouthY + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Straps
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx - 75, cy + 35);
        ctx.lineTo(cx - 86, cy + 15);
        ctx.moveTo(cx + 75, cy + 35);
        ctx.lineTo(cx + 86, cy + 15);
        ctx.stroke();
        break;

      case 'scar':
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy + 15);
        ctx.lineTo(cx - 40, cy + 50);
        ctx.stroke();
        // Stitch tick marks
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 53, cy + 25);
        ctx.lineTo(cx - 44, cy + 23);
        ctx.moveTo(cx - 49, cy + 38);
        ctx.lineTo(cx - 41, cy + 36);
        ctx.stroke();
        break;

      case 'piercing':
        // Eyebrow ring
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx - 55, cy - 22, 4, 0, Math.PI * 2);
        ctx.stroke();
        // Nose stud
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx - 16, cy + 28, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  // --- Forensic Border & Measurements ---
  drawForensicBorder(ctx, w, h) {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Header label
    ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText('ALERTX FORENSIC COMPOSITE SYSTEM', 16, 24);
    ctx.fillText(`GEN-ID: ${Date.now().toString().slice(-6)}`, w - 120, 24);

    // Height measurement ticks on left border
    for (let y = 30; y < h - 30; y += 20) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(y % 40 === 0 ? 22 : 16, y);
      ctx.stroke();
    }
  }

  // --- Charcoal Filter Post-Processing ---
  applyCharcoalFilter(ctx, w, h) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      // Grayscale luminance
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // High contrast curve
      const contrast = (v - 128) * 1.4 + 128;
      const finalVal = Math.min(255, Math.max(0, contrast));

      d[i] = finalVal;
      d[i + 1] = finalVal;
      d[i + 2] = finalVal;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Helper color adjuster
  getToneColor(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Export current canvas image as PNG Data URL
  getDataURL() {
    return this.canvas.toDataURL('image/png');
  }

  // Download directly to disk
  download(filename = 'alertx_suspect_sketch.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.getDataURL();
    link.click();
  }
}

// Global instance
window.SuspectSketcher = SuspectSketcher;
