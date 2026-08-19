# 🛡️ AlertX Smart Response
### Smart Emergency & Crime Reporting System for Women Safety & Law Enforcement

**AlertX** is an intelligent, high-responsiveness web application engineered for rapid emergency dispatch, women safety, and crime reporting. Designed for high-impact college hackathons and law enforcement integration, AlertX connects citizens in distress with police control rooms, patrol units, and emergency contacts within milliseconds.

---

## 🌟 Key Features

### 1. 🚨 One-Tap Emergency SOS Hub
- **Giant Pulsating SOS Button**: High-visibility glowing button with instant activation.
- **3-Second Abort Safeguard**: Countdown buffer with audio beeps to prevent accidental triggers.
- **Live GPS Geolocation Telemetry**: Captures precise coordinates, reverse-geocoded street address, battery level, and live updates.
- **Web Audio Dual-Oscillator Siren**: High-pitch synthesizer simulating emergency police wails directly through device speakers.
- **Emergency Broadcast Simulation**: Generates simulated SMS and WhatsApp alerts to saved emergency contacts containing a live GPS tracking link.

### 2. 📝 Smart Incident Reporting with Real-Time AI Priority Classifier
- **Comprehensive Incident Categories**: Stalking, Harassment, Physical Assault, Domestic Violence, Cybercrime, Robbery, and Suspicious Activities.
- **Intelligent NLP Priority Engine**:
  - Automatically evaluates narrative text, weapons, pursuit indicators, late-night vulnerability, and distress words in real time.
  - Dynamically classifies reports as **CRITICAL (90-100%)**, **HIGH (65-89%)**, **MEDIUM (40-64%)**, or **LOW (0-39%)**.
  - Provides a transparent, real-time rationale breakdown.
- **Live Audio Evidence Recorder**: Uses the browser's MediaRecorder API to record live microphone audio notes.
- **Evidence Media Pool**: Attach photos, CCTV screenshots, and documents with instant preview.

### 3. 👤 Interactive Suspect Sketch Compositor
- **HTML5 Canvas & Layered Vector Engine**:
  - **Face & Jaw Shapes**: Oval, Round, Square/Chiseled, Sharp Diamond V-Chin, Heart.
  - **Skin Tones**: Light Fair, Medium Wheatish, Olive Tan, Dark Brown, Deep Dark.
  - **Hair Styles**: Side-Part, Crew Cut, Curly/Afro, Spiky, Slicked Back, Buzzcut, Long Wavy, Ponytail, Bald.
  - **Hair & Brow Colors**: Jet Black, Dark Brown, Chestnut, Auburn, Grey/Silver.
  - **Eyebrows & Eyes**: Natural Arch, Bushy, Slanted/Angry, Thin, Almond, Round, Narrow, Deep-Set.
  - **Noses**: Standard Straight, Aquiline / Roman Hook, Wide, Button, Pointed.
  - **Mouth & Lips**: Neutral, Thin, Full, Smirk, Frown.
  - **Facial Hair**: Clean Shaven, 5 o'clock Stubble, Full Beard, Goatee, Mustache, French Beard.
  - **Accessories & Marks**: Wire Glasses, Thick Nerd Specs, Sunglasses, Baseball Cap, Beanie, Mask, Cheek Scar, Piercings.
- **Forensic Rendering Modes**: Toggle between **Realistic Composite** and **Forensic Charcoal Pencil Sketch**.
- **Actions**: Randomize suspect, download high-res PNG, or 1-click **"Use in Crime Report"** to attach directly to an incident filing.

### 4. 🗺️ Interactive Safety Radar & Safe Haven Locator (Leaflet.js)
- **Live Distress Radar**: Renders animated pulsing red beacons for active SOS triggers.
- **Crime Heatmap & Markers**: Displays reported incidents color-coded by priority (Red = Critical, Orange = High, Yellow = Medium, Blue = Low).
- **Verified Safe Havens**: Police Stations, Pink Patrol Booths, 24/7 Hospitals, and Women Shelters.
- **Smart Safe Route Guidance**: Calculates Haversine distance and draws real-time navigation routes to the nearest verified safe haven.

### 5. 🛠️ Emergency Safety Utilities
- **Fake Call Escape Generator**: Generates an authentic incoming phone call with ringtone audio and simulated police dispatcher voice ("Stay calm Priya, patrol unit is approaching your location").
- **120dB Screaming Deterrent Siren**: High-frequency piercing alarm to scare off attackers in dark alleys.
- **National Helplines Directory**: 1-tap quick dial simulation for **112**, **1091** (Women Helpline), **181** (Women Domestic Cell), **1930** (Cybercrime), **1098** (Childline).
- **Legal Rights & Zero FIR Pocket Guide**: Explains Zero FIR rights, virtual complaint procedures, and legal self-defense provisions.

### 6. 🚓 Admin & Dispatcher Control Center
- **Real-Time Emergency Feed**: Live monitor of all SOS triggers with audible chimes and instant dispatch triage.
- **Unit Dispatching & Status Management**: Assign patrol units (*Pink Patrol 01, Pink Patrol 02, PCR Van 09, QRT Alpha, Trauma Ambulance 03*), log responder notes, and transition statuses (`Pending` -> `Dispatched` -> `Investigating` -> `Resolved`).
- **Suspect & Evidence Inspection Modal**: High-res suspect sketch viewer, recorded voice note playback, and evidence gallery.
- **Chart.js Analytics**: Priority distribution donut chart and category frequency bar chart.

---

## 🚀 How to Run (Zero Setup Required)

The application runs using Python 3 built-in modules (`http.server` + `sqlite3`). No Node.js or third-party packages required!

### Windows Quick Start:
1. Double-click `run_server.bat` **OR** run the following command in terminal:
```bash
python server.py
```
2. Open your web browser and navigate to:
```
http://localhost:8080
```

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Name | Credentials | Purpose |
|---|---|---|---|
| **Citizen** | Priya Sharma | `priya@alertx.org` / `password123` | SOS trigger, crime report, sketch builder, fake call |
| **Police Dispatcher** | Inspector Rajesh Varma | `admin@alertx.org` / `admin123` | Live SOS feed, unit dispatch, analytics, status triage |

> 💡 **Hackathon Tip**: Use the top-right **"Mode: Citizen Portal / Police Admin"** button to toggle roles instantly with 1 click without needing to re-login!

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Server health check |
| `POST` | `/api/sos` | Trigger new SOS emergency alert with GPS |
| `GET` | `/api/sos/active` | Retrieve list of active emergency SOS alerts |
| `POST` | `/api/sos/resolve` | Mark SOS as resolved / safe |
| `POST` | `/api/classify` | NLP Priority scoring engine |
| `POST` | `/api/reports` | Submit crime report with AI priority and attached sketch |
| `GET` | `/api/reports` | Filterable list of crime reports (priority, status, search) |
| `GET` | `/api/reports/{id}` | Get single report details with evidence & suspect sketch |
| `POST` | `/api/admin/dispatch` | Assign responder unit and update report status |
| `GET` | `/api/safe-zones` | List verified police stations, hospitals, pink booths |
| `GET` | `/api/analytics` | Aggregate analytics metrics and chart data |
| `POST` | `/api/reset-demo` | Re-seed clean demo dataset |

---

## 🏆 College Hackathon Pitch & Demonstration Flow

1. **The Problem**: Women in emergency situations face delayed response times, lack of immediate GPS dispatch, difficulty describing perpetrators to police, and barriers in filing actionable crime reports.
2. **Step 1 (Emergency SOS)**: Demonstrate the 1-Tap SOS with 3-second abort buffer, realistic Web Audio police wail siren, and live SMS/WhatsApp broadcast simulation.
3. **Step 2 (Suspect Sketch Studio)**: Compose a suspect's facial composite (jaw shape, hair, eyes, facial hair, glasses, scars) and export the forensic portrait.
4. **Step 3 (AI Priority Report)**: Type a realistic incident description (e.g., "Assaulted by 2 armed men with a knife near bus stop") and demonstrate the **AI Priority Classifier** instantly jumping to **CRITICAL (92%)** with real-time keyword reasoning. Attach the sketch and recorded voice note.
5. **Step 4 (Admin Control Room)**: Switch to **Police Admin Mode** with 1 click. Watch the live emergency feed pop up, inspect the suspect sketch and victim profile, and dispatch **Pink Patrol 01** to the scene.
6. **Step 5 (Safe Havens & Tools)**: Show the interactive map with safe zones, the **Fake Call escape utility**, and the high-pitch deterrent alarm.
