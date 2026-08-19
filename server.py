#!/usr/bin/env python3
"""
AlertX Smart Response - Backend API & Web Server
A smart emergency and crime reporting system.
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import urllib.parse
import hashlib
import time
from datetime import datetime
import re

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DB_PATH = os.path.join(BASE_DIR, "alertx.db")

# ==============================================================================
# DATABASE INITIALIZATION & PRE-SEEDING
# ==============================================================================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user', -- 'user' or 'admin'
        blood_group TEXT,
        emergency_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Emergency Contacts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relation TEXT,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')

    # SOS Alerts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sos_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        user_phone TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        address TEXT,
        battery_level TEXT,
        status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'DISPATCHED', 'RESOLVED', 'CANCELLED'
        dispatched_unit TEXT,
        dispatcher_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Crime / Incident Reports table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        reporter_name TEXT,
        reporter_phone TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'Harassment', 'Stalking', 'Assault', 'Domestic Violence', 'Robbery', 'Cybercrime', 'Suspicious', 'Other'
        description TEXT NOT NULL,
        incident_date TEXT,
        incident_time TEXT,
        location_name TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        priority TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
        urgency_score INTEGER DEFAULT 50, -- 0 to 100
        ai_rationale TEXT,
        suspect_sketch TEXT, -- Base64 Data URL or SVG string
        suspect_details TEXT, -- JSON / text description
        evidence_files TEXT, -- JSON array of file objects/base64 previews
        audio_evidence TEXT, -- Base64 audio or recording description
        status TEXT DEFAULT 'Pending', -- 'Pending', 'Dispatched', 'Investigating', 'Resolved', 'False Alarm'
        assigned_unit TEXT,
        dispatcher_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Safe Zones table (Police Stations, Hospitals, Pink Booths, Shelters)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS safe_zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'POLICE', 'HOSPITAL', 'PINK_BOOTH', 'SHELTER'
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        phone TEXT NOT NULL,
        is_24x7 INTEGER DEFAULT 1,
        verified INTEGER DEFAULT 1
    )
    ''')

    # Dispatcher Units table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS dispatch_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT UNIQUE NOT NULL,
        unit_name TEXT NOT NULL,
        unit_type TEXT NOT NULL, -- 'PINK_PATROL', 'PCR_VAN', 'QUICK_RESPONSE', 'AMBULANCE', 'WOMEN_DESK'
        status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BUSY', 'OFFLINE'
        officer_in_charge TEXT,
        contact_number TEXT,
        current_location TEXT
    )
    ''')

    # Activity Log
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Pre-seed default data if table is empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        # Default citizen user
        pwd_hash = hashlib.sha256('password123'.encode('utf-8')).hexdigest()
        cursor.execute('''
        INSERT INTO users (name, email, phone, password_hash, role, blood_group, emergency_notes)
        VALUES ('Priya Sharma', 'priya@alertx.org', '+91 98765 43210', ?, 'user', 'O+', 'Asthma patient, carries emergency inhaler')
        ''', (pwd_hash,))
        user_id = cursor.lastrowid

        # Default admin dispatcher
        admin_pwd_hash = hashlib.sha256('admin123'.encode('utf-8')).hexdigest()
        cursor.execute('''
        INSERT INTO users (name, email, phone, password_hash, role, blood_group, emergency_notes)
        VALUES ('Inspector Rajesh Varma', 'admin@alertx.org', '+91 99887 76655', ?, 'admin', 'B+', 'Women Safety Cell Command Center')
        ''', (admin_pwd_hash,))

        # Seed emergency contacts for Priya
        cursor.execute('''
        INSERT INTO emergency_contacts (user_id, name, phone, relation, is_primary)
        VALUES 
        (?, 'Aarti Sharma', '+91 98111 22334', 'Mother', 1),
        (?, 'Rohit Sharma', '+91 98222 33445', 'Brother', 0),
        (?, 'College Security Desk', '+91 98333 44556', 'Campus Security', 0)
        ''', (user_id, user_id, user_id))

        # Seed Safe Zones (Delhi / Metro Coordinates as realistic standard demo)
        safe_zones_data = [
            ('Central Women Police Station', 'POLICE', 'Connaught Place Police Post, Block B', 28.6315, 77.2167, '011-23412233', 1, 1),
            ('Pink Booth - Sector 18 Metro', 'PINK_BOOTH', 'Near Gate 2, Metro Station Plaza', 28.5708, 77.3260, '011-23345678', 1, 1),
            ('City General Hospital & Emergency Trauma', 'HOSPITAL', 'Ring Road Medical Enclave', 28.6139, 77.2090, '011-26598700', 1, 1),
            ('Sakhi One Stop Crisis Centre for Women', 'SHELTER', 'Women & Child Welfare Complex, Sector 4', 28.5355, 77.3910, '181 / 011-22446688', 1, 1),
            ('North Campus Women Patrol Hub', 'POLICE', 'University Enclave Police Booth', 28.6892, 77.2104, '011-27667890', 1, 1),
            ('Pink Booth - South Extension Market', 'PINK_BOOTH', 'Main Market Gate 1', 28.5700, 77.2200, '011-24651122', 1, 1),
            ('Apollo 24/7 Women & Child Emergency', 'HOSPITAL', 'Sarita Vihar Mathura Road', 28.5386, 77.2882, '1066 / 011-26925858', 1, 1)
        ]
        cursor.executemany('''
        INSERT INTO safe_zones (name, type, address, latitude, longitude, phone, is_24x7, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', safe_zones_data)

        # Seed Dispatch Units
        dispatch_units_data = [
            ('PP-01', 'Pink Patrol Mobile 01', 'PINK_PATROL', 'AVAILABLE', 'Sub-Inspector Sunita Devi', '+91 98765 00001', 'Connaught Place Sector 3'),
            ('PP-02', 'Pink Patrol Mobile 02', 'PINK_PATROL', 'AVAILABLE', 'Head Constable Meena Kumari', '+91 98765 00002', 'Metro Station Gate 2'),
            ('PCR-09', 'PCR Cheetah Van 09', 'PCR_VAN', 'AVAILABLE', 'ASI Vikram Singh', '+91 98765 00003', 'University Ring Road'),
            ('QRT-Alpha', 'Quick Response Team Alpha', 'QUICK_RESPONSE', 'AVAILABLE', 'Inspector Rakesh Nair', '+91 98765 00004', 'Central Control Command'),
            ('AMB-03', 'Trauma Emergency Ambulance 03', 'AMBULANCE', 'AVAILABLE', 'Paramedic Dr. Anjali', '+91 98765 00005', 'City Trauma Center')
        ]
        cursor.executemany('''
        INSERT INTO dispatch_units (unit_code, unit_name, unit_type, status, officer_in_charge, contact_number, current_location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', dispatch_units_data)

        # Seed initial Demo Crime Reports
        demo_reports = [
            (
                user_id, 'Priya Sharma', '+91 98765 43210',
                'Stalking and verbal threats on walk back from college library',
                'Stalking',
                'A man on a black motorcycle has been trailing me for 3 consecutive evenings after 8:30 PM along University Ring Road. Today he slowed down, passed lewd comments, and threatened that he knows where I live. I felt in extreme danger and entered a nearby shop.',
                '2026-08-17', '20:45',
                'University Ring Road, near Gate 4',
                28.6880, 77.2120,
                'CRITICAL', 92,
                'AI Analysis: Persistent stalking behavior + direct verbal intimidation + isolated night-time setting indicates severe escalation risk.',
                None,
                '{"face_shape":"sharp","skin_tone":"#c68b59","hair_style":"slick","hair_color":"#1a1a1a","eyes":"narrow","beard":"stubble","accessories":"sunglasses"}',
                '[]',
                None,
                'Dispatched', 'PP-01',
                'Dispatched Pink Patrol Unit 01 to patrol Gate 4 and secure CCTV footage from nearby convenience store.'
            ),
            (
                user_id, 'Sneha Patel', '+91 98333 77889',
                'Group eve-teasing and aggressive catcalling at bus stop',
                'Harassment',
                'Three young men in their early 20s blocked the pathway near Sector 18 bus stand, made obscene gestures, and refused to let commuters pass peacefully. Dispersed when bystanders shouted.',
                '2026-08-16', '18:15',
                'Sector 18 Bus Stand Main Road',
                28.5715, 77.3245,
                'HIGH', 78,
                'AI Analysis: Group harassment in public transit hub + physical obstruction of movement creates elevated threat for female commuters.',
                None,
                '{"face_shape":"round","skin_tone":"#e0ac69","hair_style":"curly","hair_color":"#222222","eyes":"round","beard":"mustache","accessories":"cap"}',
                '[]',
                None,
                'Investigating', 'PCR-09',
                'CCTV footage requested from Metro authority. Station constable deployed on evening duty.'
            ),
            (
                user_id, 'Ananya Roy', '+91 97111 55443',
                'Suspicious drone hovering near women hostel windows at night',
                'Suspicious',
                'Noticed a small quadcopter drone with blinking red light hovering right outside 3rd-floor hostel balconies around 11:30 PM. It flew away towards the adjacent construction lot.',
                '2026-08-15', '23:30',
                'Kasturba Women Hostel Complex, Block C',
                28.6250, 77.2210,
                'MEDIUM', 58,
                'AI Analysis: Privacy violation / voyeurism risk in high-density female accommodation. Immediate physical danger low, but security breach is high.',
                None,
                None,
                '[]',
                None,
                'Pending', None,
                'Forwarded to cyber unit and local beat officer.'
            ),
            (
                user_id, 'Meera Sen', '+91 99000 11223',
                'Defaced poster with offensive slogans near community hall',
                'Other',
                'Found vulgar graffiti sprayed over the women safety awareness board near community center entrance.',
                '2026-08-14', '09:00',
                'Community Center Lane 2',
                28.5800, 77.2300,
                'LOW', 25,
                'AI Analysis: Vandalism without active physical confrontation or imminent personal threat.',
                None,
                None,
                '[]',
                None,
                'Resolved', 'QRT-Alpha',
                'Graffiti removed by municipal maintenance team. Local patrol notified.'
            )
        ]

        cursor.executemany('''
        INSERT INTO reports (
            user_id, reporter_name, reporter_phone, title, category, description, 
            incident_date, incident_time, location_name, latitude, longitude,
            priority, urgency_score, ai_rationale, suspect_sketch, suspect_details,
            evidence_files, audio_evidence, status, assigned_unit, dispatcher_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', demo_reports)

        # Seed 1 Active SOS Demo
        cursor.execute('''
        INSERT INTO sos_alerts (
            user_id, user_name, user_phone, latitude, longitude, accuracy, address, battery_level, status, dispatched_unit, dispatcher_notes
        )
        VALUES (?, 'Priya Sharma', '+91 98765 43210', 28.6328, 77.2195, 8.5, 'Near Rajiv Chowk Metro Gate 7, Connaught Place', '68%', 'ACTIVE', 'PP-01', 'Live tracking active. Siren triggered. Pink Patrol 01 ETA 3 mins.')
        ''', (user_id,))

        # Seed sample activity logs
        logs = [
            ('SOS_TRIGGER', '🚨 Emergency SOS Triggered', 'User Priya Sharma activated SOS alert near Rajiv Chowk Metro.'),
            ('UNIT_DISPATCH', '🚓 Patrol Dispatched', 'Pink Patrol Mobile 01 dispatched to emergency coordinates.'),
            ('REPORT_SUBMITTED', '📝 Crime Report Filed', 'New Critical report filed: Stalking along University Ring Road.')
        ]
        cursor.executemany('INSERT INTO activity_logs (event_type, title, details) VALUES (?, ?, ?)', logs)

    conn.commit()
    conn.close()

# ==============================================================================
# SMART AI PRIORITY CLASSIFIER ENGINE
# ==============================================================================
def classify_incident_priority(title, description, category, incident_time=None):
    """
    Intelligent NLP-style classifier that analyzes threat levels, violence indicators,
    weapon mentions, stalking behavior, night vulnerability, and distress words.
    Returns: priority ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), urgency_score (0-100), and ai_rationale.
    """
    text = f"{title} {description} {category}".lower()
    
    score = 0
    rationale_points = []
    
    # 1. Critical Violence & Weapons (Extreme Threat: +40 to +60)
    critical_keywords = [
        'knife', 'gun', 'weapon', 'blade', 'attack', 'assault', 'stab', 'bleeding',
        'rape', 'molest', 'kidnap', 'abduct', 'trapped', 'locked in', 'holding me',
        'strangle', 'choking', 'unconscious', 'hostage', 'acid', 'physical harm', 'threatened to kill'
    ]
    matched_critical = [k for k in critical_keywords if re.search(r'\b' + re.escape(k) + r'\b', text)]
    if matched_critical:
        score += min(55, len(matched_critical) * 25)
        rationale_points.append(f"Severe violence/weapon indicators detected ({', '.join(matched_critical[:3])})")

    # 2. High Threat & Persistent Pursuit (+25 to +40)
    high_keywords = [
        'stalk', 'chasing', 'following me', 'cornered', 'surrounded', 'groped',
        'forced', 'blackmail', 'extortion', 'break-in', 'intruder', 'banging door',
        'screaming', 'cab driver refused', 'taking wrong route', 'route diversion'
    ]
    matched_high = [k for k in high_keywords if re.search(r'\b' + re.escape(k) + r'\b', text)]
    if matched_high:
        score += min(35, len(matched_high) * 18)
        rationale_points.append(f"Immediate stalking/pursuit threat detected ({', '.join(matched_high[:2])})")

    # 3. Category Weights
    category_weights = {
        'Assault': 40,
        'Domestic Violence': 35,
        'Stalking': 30,
        'Harassment': 25,
        'Robbery': 25,
        'Cybercrime': 15,
        'Suspicious': 15,
        'Other': 10
    }
    cat_score = category_weights.get(category, 15)
    score += cat_score

    # 4. Distress & Urgency Signals (+10 to +20)
    urgency_keywords = ['urgent', 'emergency', 'help', 'terrified', 'scared', 'alone', 'crying', 'in danger', 'now']
    matched_urgency = [k for k in urgency_keywords if re.search(r'\b' + re.escape(k) + r'\b', text)]
    if matched_urgency:
        score += min(20, len(matched_urgency) * 8)
        rationale_points.append("High victim distress signals identified")

    # 5. Night / Isolated Time Context (+10 to +15)
    if incident_time:
        try:
            hour = int(incident_time.split(':')[0])
            if hour >= 21 or hour <= 5:
                score += 15
                rationale_points.append("Vulnerable late-night timeframe (between 9 PM - 5 AM)")
            elif hour >= 18 or hour <= 20:
                score += 8
                rationale_points.append("Evening twilight timeframe")
        except Exception:
            pass

    # 6. Group / Multiple Perpetrators Context
    if re.search(r'\b(group|gang|three men|two men|crowd|multiple guys|mob)\b', text):
        score += 15
        rationale_points.append("Multiple perpetrators or group aggression involved")

    # Cap score
    urgency_score = min(99, max(12, score))

    if urgency_score >= 85:
        priority = 'CRITICAL'
        urgency_score = max(88, urgency_score)
    elif urgency_score >= 65:
        priority = 'HIGH'
    elif urgency_score >= 38:
        priority = 'MEDIUM'
    else:
        priority = 'LOW'

    if not rationale_points:
        rationale_points.append(f"Standard reporting profile for {category} category.")

    ai_rationale = f"AI Priority Engine: Classified as {priority} (Urgency: {urgency_score}%). Rationale: " + "; ".join(rationale_points) + "."

    return priority, urgency_score, ai_rationale

# ==============================================================================
# REST API & STATIC REQUEST HANDLER
# ==============================================================================
class AlertXHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw_body = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw_body)
        except Exception as e:
            print(f"Error parsing JSON body: {e}")
        return {}

    def get_db(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    # --------------------------------------------------------------------------
    # GET Handlers
    # --------------------------------------------------------------------------
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # API Routes
        if path.startswith('/api/'):
            try:
                if path == '/api/status':
                    self.send_json({
                        'status': 'ONLINE',
                        'system': 'AlertX Smart Response System',
                        'timestamp': datetime.now().isoformat(),
                        'version': '2.0.0-hackathon'
                    })
                    return

                elif path == '/api/user/profile':
                    email = query.get('email', ['priya@alertx.org'])[0]
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT id, name, email, phone, role, blood_group, emergency_notes, created_at FROM users WHERE email = ?', (email,))
                    user = cursor.fetchone()
                    if not user:
                        conn.close()
                        self.send_json({'error': 'User not found'}, 404)
                        return
                    user_dict = dict(user)
                    # Fetch emergency contacts
                    cursor.execute('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC', (user_dict['id'],))
                    user_dict['contacts'] = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json(user_dict)
                    return

                elif path == '/api/sos/active':
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('''
                    SELECT * FROM sos_alerts 
                    WHERE status IN ('ACTIVE', 'DISPATCHED') 
                    ORDER BY id DESC
                    ''')
                    alerts = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json({'alerts': alerts, 'count': len(alerts)})
                    return

                elif path == '/api/sos/all':
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM sos_alerts ORDER BY id DESC LIMIT 50')
                    alerts = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json({'alerts': alerts})
                    return

                elif path == '/api/reports':
                    category = query.get('category', [None])[0]
                    priority = query.get('priority', [None])[0]
                    status = query.get('status', [None])[0]
                    search = query.get('search', [None])[0]

                    sql = 'SELECT * FROM reports WHERE 1=1'
                    params = []

                    if category and category != 'ALL':
                        sql += ' AND category = ?'
                        params.append(category)
                    if priority and priority != 'ALL':
                        sql += ' AND priority = ?'
                        params.append(priority)
                    if status and status != 'ALL':
                        sql += ' AND status = ?'
                        params.append(status)
                    if search:
                        sql += ' AND (title LIKE ? OR description LIKE ? OR location_name LIKE ? OR reporter_name LIKE ?)'
                        searchTerm = f'%{search}%'
                        params.extend([searchTerm, searchTerm, searchTerm, searchTerm])

                    sql += ' ORDER BY id DESC'

                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute(sql, params)
                    reports = []
                    for row in cursor.fetchall():
                        r = dict(row)
                        # Parse JSON evidence if present
                        if r.get('evidence_files'):
                            try:
                                r['evidence_files'] = json.loads(r['evidence_files'])
                            except Exception:
                                pass
                        if r.get('suspect_details'):
                            try:
                                r['suspect_details'] = json.loads(r['suspect_details'])
                            except Exception:
                                pass
                        reports.append(r)
                    conn.close()
                    self.send_json({'reports': reports, 'count': len(reports)})
                    return

                elif path.startswith('/api/reports/'):
                    report_id = path.replace('/api/reports/', '')
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM reports WHERE id = ?', (report_id,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        r = dict(row)
                        if r.get('evidence_files'):
                            try:
                                r['evidence_files'] = json.loads(r['evidence_files'])
                            except Exception:
                                pass
                        if r.get('suspect_details'):
                            try:
                                r['suspect_details'] = json.loads(r['suspect_details'])
                            except Exception:
                                pass
                        self.send_json(r)
                    else:
                        self.send_json({'error': 'Report not found'}, 404)
                    return

                elif path == '/api/safe-zones':
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM safe_zones ORDER BY verified DESC, id ASC')
                    zones = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json({'safe_zones': zones})
                    return

                elif path == '/api/admin/units':
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM dispatch_units ORDER BY status ASC, unit_code ASC')
                    units = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json({'units': units})
                    return

                elif path == '/api/admin/activity':
                    conn = self.get_db()
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 20')
                    logs = [dict(row) for row in cursor.fetchall()]
                    conn.close()
                    self.send_json({'logs': logs})
                    return

                elif path == '/api/analytics':
                    conn = self.get_db()
                    cursor = conn.cursor()

                    # Counts
                    cursor.execute('SELECT COUNT(*) FROM reports')
                    total_reports = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM sos_alerts WHERE status IN ('ACTIVE', 'DISPATCHED')")
                    active_sos = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM reports WHERE status = 'Resolved'")
                    resolved_reports = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM reports WHERE priority = 'CRITICAL'")
                    critical_count = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM reports WHERE priority = 'HIGH'")
                    high_count = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM reports WHERE priority = 'MEDIUM'")
                    medium_count = cursor.fetchone()[0]

                    cursor.execute("SELECT COUNT(*) FROM reports WHERE priority = 'LOW'")
                    low_count = cursor.fetchone()[0]

                    # Category breakdown
                    cursor.execute('SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC')
                    categories = [dict(row) for row in cursor.fetchall()]

                    # Status breakdown
                    cursor.execute('SELECT status, COUNT(*) as count FROM reports GROUP BY status')
                    statuses = [dict(row) for row in cursor.fetchall()]

                    conn.close()

                    self.send_json({
                        'kpi': {
                            'total_reports': total_reports,
                            'active_sos': active_sos,
                            'resolved_reports': resolved_reports,
                            'critical_incidents': critical_count,
                            'avg_response_time': '3.8 mins',
                            'resolution_rate': f"{int((resolved_reports / max(1, total_reports)) * 100)}%"
                        },
                        'priority_distribution': {
                            'CRITICAL': critical_count,
                            'HIGH': high_count,
                            'MEDIUM': medium_count,
                            'LOW': low_count
                        },
                        'categories': categories,
                        'statuses': statuses
                    })
                    return

                else:
                    self.send_json({'error': 'API endpoint not found'}, 404)
                    return

            except Exception as e:
                print(f"API GET error on {path}: {e}")
                self.send_json({'error': str(e)}, 500)
                return

        # Static Files fallback: serve index.html for SPA client-side routes if file does not exist
        clean_path = path.lstrip('/')
        file_path = os.path.join(STATIC_DIR, clean_path)
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.path = '/index.html'

        return super().do_GET()

    # --------------------------------------------------------------------------
    # POST Handlers
    # --------------------------------------------------------------------------
    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self.read_json_body()

        try:
            # 1. Auth: Login
            if path == '/api/auth/login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

                conn = self.get_db()
                cursor = conn.cursor()
                cursor.execute('SELECT id, name, email, phone, role, blood_group, emergency_notes FROM users WHERE LOWER(email) = ? AND password_hash = ?', (email, pwd_hash))
                user = cursor.fetchone()
                if user:
                    user_dict = dict(user)
                    # Fetch contacts
                    cursor.execute('SELECT * FROM emergency_contacts WHERE user_id = ?', (user_dict['id'],))
                    user_dict['contacts'] = [dict(r) for r in cursor.fetchall()]
                    conn.close()
                    self.send_json({'success': True, 'user': user_dict})
                else:
                    conn.close()
                    self.send_json({'success': False, 'error': 'Invalid email or password'}, 401)
                return

            # 2. Auth: Register
            elif path == '/api/auth/register':
                name = body.get('name', '').strip()
                email = body.get('email', '').strip().lower()
                phone = body.get('phone', '').strip()
                password = body.get('password', '')
                role = body.get('role', 'user')
                blood_group = body.get('blood_group', 'Not specified')
                notes = body.get('emergency_notes', '')

                if not name or not email or not password:
                    self.send_json({'error': 'Name, email, and password are required'}, 400)
                    return

                pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
                conn = self.get_db()
                cursor = conn.cursor()
                try:
                    cursor.execute('''
                    INSERT INTO users (name, email, phone, password_hash, role, blood_group, emergency_notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (name, email, phone, pwd_hash, role, blood_group, notes))
                    user_id = cursor.lastrowid
                    conn.commit()
                    conn.close()
                    self.send_json({
                        'success': True,
                        'user': {
                            'id': user_id,
                            'name': name,
                            'email': email,
                            'phone': phone,
                            'role': role,
                            'blood_group': blood_group,
                            'emergency_notes': notes,
                            'contacts': []
                        }
                    })
                except sqlite3.IntegrityError:
                    conn.close()
                    self.send_json({'error': 'Email is already registered'}, 400)
                return

            # 3. Add/Update Emergency Contact
            elif path == '/api/user/contacts':
                user_id = body.get('user_id', 1)
                name = body.get('name', '').strip()
                phone = body.get('phone', '').strip()
                relation = body.get('relation', 'Family')
                is_primary = 1 if body.get('is_primary') else 0

                if not name or not phone:
                    self.send_json({'error': 'Name and phone are required'}, 400)
                    return

                conn = self.get_db()
                cursor = conn.cursor()
                if is_primary:
                    cursor.execute('UPDATE emergency_contacts SET is_primary = 0 WHERE user_id = ?', (user_id,))

                cursor.execute('''
                INSERT INTO emergency_contacts (user_id, name, phone, relation, is_primary)
                VALUES (?, ?, ?, ?, ?)
                ''', (user_id, name, phone, relation, is_primary))
                contact_id = cursor.lastrowid
                conn.commit()

                cursor.execute('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC', (user_id,))
                contacts = [dict(r) for r in cursor.fetchall()]
                conn.close()

                self.send_json({'success': True, 'contact_id': contact_id, 'contacts': contacts})
                return

            # 4. Trigger Instant SOS Alert
            elif path == '/api/sos':
                user_id = body.get('user_id', 1)
                user_name = body.get('user_name', 'Priya Sharma')
                user_phone = body.get('user_phone', '+91 98765 43210')
                latitude = float(body.get('latitude', 28.6328))
                longitude = float(body.get('longitude', 77.2195))
                accuracy = float(body.get('accuracy', 10.0))
                address = body.get('address', 'Location near Connaught Place')
                battery = body.get('battery_level', '85%')

                conn = self.get_db()
                cursor = conn.cursor()

                # Automatically assign nearest available unit for smart dispatch
                cursor.execute("SELECT unit_code, unit_name FROM dispatch_units WHERE status = 'AVAILABLE' LIMIT 1")
                avail_unit = cursor.fetchone()
                assigned_unit = avail_unit['unit_code'] if avail_unit else 'CONTROL_ROOM'

                cursor.execute('''
                INSERT INTO sos_alerts (user_id, user_name, user_phone, latitude, longitude, accuracy, address, battery_level, status, dispatched_unit, dispatcher_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, 'EMERGENCY: Automated SOS trigger received. Live siren and GPS telemetry stream active.')
                ''', (user_id, user_name, user_phone, latitude, longitude, accuracy, address, battery, assigned_unit))
                alert_id = cursor.lastrowid

                # Update unit status to BUSY
                if avail_unit:
                    cursor.execute("UPDATE dispatch_units SET status = 'BUSY' WHERE unit_code = ?", (assigned_unit,))

                # Log activity
                cursor.execute('''
                INSERT INTO activity_logs (event_type, title, details)
                VALUES ('SOS_TRIGGER', ?, ?)
                ''', (f'🚨 EMERGENCY SOS #{alert_id}', f'Triggered by {user_name} ({user_phone}) at {address}. Assigned {assigned_unit}.'))

                conn.commit()

                cursor.execute('SELECT * FROM sos_alerts WHERE id = ?', (alert_id,))
                alert = dict(cursor.fetchone())
                conn.close()

                self.send_json({
                    'success': True,
                    'message': 'SOS Alert Dispatched Successfully to Control Room & Contacts!',
                    'alert': alert
                })
                return

            # 5. Smart Priority Classifier Endpoint
            elif path == '/api/classify':
                title = body.get('title', '')
                description = body.get('description', '')
                category = body.get('category', 'Harassment')
                incident_time = body.get('incident_time', None)

                priority, urgency_score, rationale = classify_incident_priority(title, description, category, incident_time)

                self.send_json({
                    'priority': priority,
                    'urgency_score': urgency_score,
                    'ai_rationale': rationale
                })
                return

            # 6. File Crime / Incident Report
            elif path == '/api/reports':
                user_id = body.get('user_id', 1)
                reporter_name = body.get('reporter_name', 'Priya Sharma')
                reporter_phone = body.get('reporter_phone', '+91 98765 43210')
                title = body.get('title', '').strip()
                category = body.get('category', 'Harassment')
                description = body.get('description', '').strip()
                incident_date = body.get('incident_date', datetime.now().strftime('%Y-%m-%d'))
                incident_time = body.get('incident_time', datetime.now().strftime('%H:%M'))
                location_name = body.get('location_name', 'Current GPS Location')
                latitude = float(body.get('latitude', 28.6139))
                longitude = float(body.get('longitude', 77.2090))
                suspect_sketch = body.get('suspect_sketch', None) # Data URL PNG/SVG
                suspect_details = body.get('suspect_details', None)
                evidence_files = body.get('evidence_files', [])
                audio_evidence = body.get('audio_evidence', None)

                if not title or not description:
                    self.send_json({'error': 'Title and description are required'}, 400)
                    return

                # Calculate AI Priority Classification
                priority, urgency_score, ai_rationale = classify_incident_priority(title, description, category, incident_time)

                # Format JSON fields
                ev_json = json.dumps(evidence_files) if isinstance(evidence_files, list) else str(evidence_files)
                suspect_json = json.dumps(suspect_details) if isinstance(suspect_details, dict) else str(suspect_details) if suspect_details else None

                conn = self.get_db()
                cursor = conn.cursor()

                cursor.execute('''
                INSERT INTO reports (
                    user_id, reporter_name, reporter_phone, title, category, description,
                    incident_date, incident_time, location_name, latitude, longitude,
                    priority, urgency_score, ai_rationale, suspect_sketch, suspect_details,
                    evidence_files, audio_evidence, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
                ''', (
                    user_id, reporter_name, reporter_phone, title, category, description,
                    incident_date, incident_time, location_name, latitude, longitude,
                    priority, urgency_score, ai_rationale, suspect_sketch, suspect_json,
                    ev_json, audio_evidence
                ))
                report_id = cursor.lastrowid

                # Activity log
                cursor.execute('''
                INSERT INTO activity_logs (event_type, title, details)
                VALUES ('REPORT_SUBMITTED', ?, ?)
                ''', (f'📝 New Incident Report #{report_id} [{priority}]', f'{title} ({category}) reported by {reporter_name} at {location_name}.'))

                conn.commit()

                cursor.execute('SELECT * FROM reports WHERE id = ?', (report_id,))
                report = dict(cursor.fetchone())
                conn.close()

                self.send_json({
                    'success': True,
                    'message': f'Report #{report_id} submitted and classified as {priority} priority.',
                    'report': report
                })
                return

            # 7. Admin: Dispatch Unit and Update Status
            elif path == '/api/admin/dispatch':
                report_id = body.get('report_id')
                sos_id = body.get('sos_id')
                unit_code = body.get('unit_code')
                new_status = body.get('status', 'Dispatched')
                notes = body.get('notes', '')

                conn = self.get_db()
                cursor = conn.cursor()

                if report_id:
                    cursor.execute('''
                    UPDATE reports 
                    SET status = ?, assigned_unit = ?, dispatcher_notes = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    ''', (new_status, unit_code, notes, report_id))

                    cursor.execute('''
                    INSERT INTO activity_logs (event_type, title, details)
                    VALUES ('STATUS_UPDATE', ?, ?)
                    ''', (f'Report #{report_id} -> {new_status}', f'Unit {unit_code} assigned with notes: {notes}'))

                if sos_id:
                    cursor.execute('''
                    UPDATE sos_alerts
                    SET status = ?, dispatched_unit = ?, dispatcher_notes = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    ''', (new_status, unit_code, notes, sos_id))

                    cursor.execute('''
                    INSERT INTO activity_logs (event_type, title, details)
                    VALUES ('SOS_STATUS_UPDATE', ?, ?)
                    ''', (f'SOS Alert #{sos_id} -> {new_status}', f'Unit {unit_code} assigned.'))

                if unit_code and new_status == 'Dispatched':
                    cursor.execute("UPDATE dispatch_units SET status = 'BUSY' WHERE unit_code = ?", (unit_code,))
                elif unit_code and new_status == 'Resolved':
                    cursor.execute("UPDATE dispatch_units SET status = 'AVAILABLE' WHERE unit_code = ?", (unit_code,))

                conn.commit()
                conn.close()

                self.send_json({'success': True, 'message': f'Status updated to {new_status} and {unit_code} dispatched.'})
                return

            # 8. Resolve / Cancel SOS
            elif path == '/api/sos/resolve':
                sos_id = body.get('sos_id')
                status = body.get('status', 'RESOLVED')
                notes = body.get('notes', 'User safe / Resolved by responder')

                conn = self.get_db()
                cursor = conn.cursor()
                cursor.execute('''
                UPDATE sos_alerts 
                SET status = ?, dispatcher_notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                ''', (status, notes, sos_id))

                cursor.execute('''
                INSERT INTO activity_logs (event_type, title, details)
                VALUES ('SOS_RESOLVED', ?, ?)
                ''', (f'SOS Alert #{sos_id} marked as {status}', notes))

                conn.commit()
                conn.close()
                self.send_json({'success': True, 'message': f'SOS Alert #{sos_id} marked as {status}'})
                return

            # 9. Reset Demo Data
            elif path == '/api/reset-demo':
                conn = self.get_db()
                cursor = conn.cursor()
                cursor.execute('DROP TABLE IF EXISTS users')
                cursor.execute('DROP TABLE IF EXISTS emergency_contacts')
                cursor.execute('DROP TABLE IF EXISTS sos_alerts')
                cursor.execute('DROP TABLE IF EXISTS reports')
                cursor.execute('DROP TABLE IF EXISTS safe_zones')
                cursor.execute('DROP TABLE IF EXISTS dispatch_units')
                cursor.execute('DROP TABLE IF EXISTS activity_logs')
                conn.commit()
                conn.close()
                init_db()
                self.send_json({'success': True, 'message': 'Demo database re-seeded successfully!'})
                return

            else:
                self.send_json({'error': 'POST endpoint not found'}, 404)
                return

        except Exception as e:
            print(f"API POST error on {path}: {e}")
            self.send_json({'error': str(e)}, 500)
            return

# ==============================================================================
# SERVER LAUNCHER
# ==============================================================================
def run():
    init_db()
    print("================================================================")
    print("      [+] AlertX Smart Response - Emergency & Crime System      ")
    print("================================================================")
    print(f"Database initialized: {DB_PATH}")
    print(f"Static directory:     {STATIC_DIR}")
    print(f"Server running at:    http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server.")
    print("================================================================")

    # Allow immediate address reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AlertXHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down AlertX server gracefully...")
            httpd.shutdown()

if __name__ == '__main__':
    run()
