import urllib.request
import json

def test_api():
    def get_json(url):
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))

    def post_json(url, data):
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))

    print("=== Testing AlertX REST API ===")
    
    # Status
    status = get_json("http://localhost:8080/api/status")
    print(f"[OK] System Status: {status.get('status')}, Version: {status.get('version')}")

    # Reports
    reports_data = get_json("http://localhost:8080/api/reports")
    reports = reports_data.get("reports", [])
    print(f"[OK] Incidents list retrieved: {len(reports)} reports found.")

    # AI Classifier: Critical case
    clf_crit = post_json("http://localhost:8080/api/classify", {
        "title": "Armed stalker threatening with knife",
        "description": "A man pulled out a blade and is chasing me down the alley screaming threats.",
        "category": "Assault",
        "incident_time": "23:45"
    })
    print(f"[OK] AI Classifier (Critical Threat): Priority={clf_crit.get('priority')}, Score={clf_crit.get('urgency_score')}%")
    assert clf_crit.get('priority') == 'CRITICAL', f"Expected CRITICAL but got {clf_crit.get('priority')}"

    # AI Classifier: Low case
    clf_low = post_json("http://localhost:8080/api/classify", {
        "title": "Lost umbrella near cafeteria",
        "description": "Left my yellow umbrella on the table during lunchtime.",
        "category": "Other",
        "incident_time": "13:00"
    })
    print(f"[OK] AI Classifier (Low Threat): Priority={clf_low.get('priority')}, Score={clf_low.get('urgency_score')}%")
    assert clf_low.get('priority') == 'LOW', f"Expected LOW but got {clf_low.get('priority')}"

    # Safe Zones
    sz_data = get_json("http://localhost:8080/api/safe-zones")
    print(f"[OK] Safe Zones retrieved: {len(sz_data.get('safe_zones', []))} verified stations.")

    # SOS Alert creation
    sos_res = post_json("http://localhost:8080/api/sos", {
        "user_id": 1,
        "user_name": "Priya Sharma",
        "user_phone": "+91 98765 43210",
        "latitude": 28.6328,
        "longitude": 77.2195,
        "accuracy": 5.0,
        "address": "Connaught Place Gate 2",
        "battery_level": "90%"
    })
    print(f"[OK] SOS Alert Triggered: ID={sos_res.get('alert', {}).get('id')}, Status={sos_res.get('alert', {}).get('status')}")

    # File a new Crime Report with attached sketch
    rep_res = post_json("http://localhost:8080/api/reports", {
        "user_id": 1,
        "reporter_name": "Priya Sharma",
        "reporter_phone": "+91 98765 43210",
        "title": "Suspect seen tampering with hostel locks at midnight",
        "category": "Suspicious",
        "description": "Man wearing dark hoodie and glasses was attempting to pry open the ground floor window.",
        "incident_date": "2026-08-18",
        "incident_time": "00:30",
        "location_name": "Hostel Block B",
        "latitude": 28.6250,
        "longitude": 77.2210,
        "suspect_sketch": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "suspect_details": {"face_shape": "sharp", "hair": "hoodie", "glasses": "thick"}
    })
    new_rep = rep_res.get('report', {})
    print(f"[OK] New Crime Report Submitted: ID={new_rep.get('id')}, Priority={new_rep.get('priority')}, Urgency={new_rep.get('urgency_score')}%")

    # Dispatch responder unit
    dispatch_res = post_json("http://localhost:8080/api/admin/dispatch", {
        "report_id": new_rep.get('id'),
        "unit_code": "PP-02",
        "status": "Dispatched",
        "notes": "Patrol vehicle PP-02 dispatched to secure perimeter."
    })
    print(f"[OK] Admin Unit Dispatch: {dispatch_res.get('message')}")

    # Analytics
    analytics = get_json("http://localhost:8080/api/analytics")
    print(f"[OK] Analytics: Total={analytics.get('kpi', {}).get('total_reports')}, Active SOS={analytics.get('kpi', {}).get('active_sos')}, Resolution={analytics.get('kpi', {}).get('resolution_rate')}")

    print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY! AlertX is ready for demonstration.")

if __name__ == '__main__':
    test_api()
