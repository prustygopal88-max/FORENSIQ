import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

print("========================================================")
print("LIVE FORENSIQ DEMO VERIFICATION")
print("========================================================")

# Step 1: Check Health
status, res = make_req("/health")
print(f"[1] Health Check: Status={status} -> {res}")
assert status == 200

# Step 2: Configure Demo User Gopal
status, res = make_req("/auth/register", "POST", {
    "username": "Gopal",
    "password": "password123",
    "role": "investigator"
})
print(f"[2] Account Config (Gopal): Status={status} -> {res.get('message')}")
assert status == 200

# Step 3: Live Login Demo - 3 Wrong Passwords + 1 Correct Password
print("\n[3] Executing Live Authentication Demo Sequence...")

print("  Attempt 1: Intentional Wrong Password ('bad_pass_1')...")
status, res = make_req("/auth/login", "POST", {"username": "Gopal", "password": "bad_pass_1", "machine": "FORENSIQ-PC"})
print(f"  -> HTTP {status} (Expected 401)")
evt1 = res.get("detail", {}).get("forensic_event", {})
print(f"  -> Generated Forensic Event: {evt1.get('event_id')} | Action={evt1.get('action')} | Status={evt1.get('status')} | Time={evt1.get('timestamp')}")
assert status == 401
time.sleep(1)

print("  Attempt 2: Intentional Wrong Password ('bad_pass_2')...")
status, res = make_req("/auth/login", "POST", {"username": "Gopal", "password": "bad_pass_2", "machine": "FORENSIQ-PC"})
print(f"  -> HTTP {status} (Expected 401)")
evt2 = res.get("detail", {}).get("forensic_event", {})
print(f"  -> Generated Forensic Event: {evt2.get('event_id')} | Action={evt2.get('action')} | Status={evt2.get('status')} | Time={evt2.get('timestamp')}")
assert status == 401
time.sleep(1)

print("  Attempt 3: Intentional Wrong Password ('bad_pass_3')...")
status, res = make_req("/auth/login", "POST", {"username": "Gopal", "password": "bad_pass_3", "machine": "FORENSIQ-PC"})
print(f"  -> HTTP {status} (Expected 401)")
evt3 = res.get("detail", {}).get("forensic_event", {})
print(f"  -> Generated Forensic Event: {evt3.get('event_id')} | Action={evt3.get('action')} | Status={evt3.get('status')} | Time={evt3.get('timestamp')}")
assert status == 401
time.sleep(1)

print("  Attempt 4: Correct Password ('password123')...")
status, res = make_req("/auth/login", "POST", {"username": "Gopal", "password": "password123", "machine": "FORENSIQ-PC"})
print(f"  -> HTTP {status} (Expected 200)")
evt4 = res.get("forensic_event", {})
print(f"  -> Generated Forensic Event: {evt4.get('event_id')} | Action={evt4.get('action')} | Status={evt4.get('status')} | Time={evt4.get('timestamp')}")
assert status == 200

# Step 4: Verify Database has these events
status, res = make_req("/events?event_type=authentication&limit=10")
print(f"\n[4] Querying SQLite for Auth Events: Found {res.get('count')} records")
events = res.get("events", [])
for e in events[:4]:
    print(f"    - {e.get('event_id')} | {e.get('timestamp')} | {e.get('action')} | {e.get('status')} | {e.get('user')}")

# Step 5: Test Natural Language Query A: "Show me failed login attempts before the successful login."
print("\n[5] Testing NLP Query A: 'Show me failed login attempts before the successful login.'")
status, res = make_req("/investigate", "POST", {
    "query": "Show me failed login attempts before the successful login.",
    "user_context": "Gopal"
})
assert status == 200
print(f"  - Detected Intent: {res['interpretation']['intent']}")
print(f"  - Event Type: {res['interpretation']['event_type']} | Status: {res['interpretation']['status']}")
print(f"  - Temporal Relation: {res['interpretation']['temporal_relation']} | Landmark: {res['interpretation']['reference_event']}")
print(f"  - Landmark Event Resolved: {res['reference_event_found']['event_id']} ({res['reference_event_found']['action']})")
print(f"  - Structured Query: {json.dumps(res['structured_query'])}")
print(f"  - Evidence Retrieved: {res['evidence_count']} events")
for ev in res['evidence']:
    print(f"    * {ev['event_id']} | {ev['action']} | Status={ev['status']} | Time={ev['timestamp']}")
assert res['evidence_count'] >= 3

print(f"  - Timeline Items: {len(res['timeline'])}")
for t in res['timeline']:
    lm = " [LANDMARK]" if t.get('is_landmark') else ""
    print(f"    * {t['timestamp']} -> {t['action']} ({t['status']}) - Delta: {t['delta_from_landmark']}{lm}")

print(f"  - Explainability Summary: {res['explainability']['summary_verdict']}")
print(f"  - Sample Item Explanation (for {res['explainability']['item_explanations'][0]['event_id']}):")
for step in res['explainability']['item_explanations'][0]['steps']:
    print(f"    [x] {step['criterion']}: {step['details']}")

# Step 6: Test Natural Language Query B: "Show me failed login attempts within 5 minutes before the successful login."
print("\n[6] Testing NLP Query B: 'Show me failed login attempts within 5 minutes before the successful login.'")
status, res = make_req("/investigate", "POST", {
    "query": "Show me failed login attempts within 5 minutes before the successful login.",
    "user_context": "Gopal"
})
assert status == 200
print(f"  - Time window extracted: {res['interpretation']['time_window_minutes']} minutes")
print(f"  - Window bounds: Start={res['temporal_window']['range_start']} | End={res['temporal_window']['range_end']}")
print(f"  - Evidence count: {res['evidence_count']}")
assert res['evidence_count'] >= 3

# Step 7: Test USB Investigation Flow
print("\n[7] Testing USB Investigation Flow...")
print("  Simulating 4-step sequence (Connect -> File Access -> File Copy -> Remove)...")
status, res = make_req("/simulate/sequence?user=Gopal", "POST")
assert status == 200
print(f"  -> Generated {len(res['events'])} USB/file events")

print("  Executing USB Natural Language Query: 'What files were copied to USB after it was connected?'")
status, res = make_req("/investigate", "POST", {
    "query": "What files were copied to USB after it was connected?",
    "user_context": "Gopal"
})
assert status == 200
print(f"  - Intent: {res['interpretation']['intent']}")
print(f"  - Landmark Event Resolved: {res['reference_event_found']['event_id']} ({res['reference_event_found']['action']})")
print(f"  - Evidence Retrieved: {res['evidence_count']}")
for ev in res['evidence']:
    print(f"    * File: {ev.get('file')} | Action: {ev.get('action')} | Device: {ev.get('device')} | Status: {ev.get('status')}")
assert res['evidence_count'] >= 1
assert any(ev.get('file') == 'Financial_Report.xlsx' for ev in res['evidence'])

# Step 8: Test Dashboard Stats
print("\n[8] Testing Dashboard Stats API...")
status, res = make_req("/dashboard/stats")
assert status == 200
print(f"  - Total Events in SQLite: {res['total_events']}")
print(f"  - Authentication Events: {res['authentication_events']}")
print(f"  - File Events: {res['file_events']}")
print(f"  - USB Events: {res['usb_events']}")
print(f"  - Active Cases: {res['active_cases']}")
print(f"  - Queries Executed: {res['queries_executed']}")

# Step 9: Test Cases API
print("\n[9] Testing Cases API...")
status, res = make_req("/cases")
assert status == 200
print(f"  - Active Cases: {len(res)} cases available")
for c in res:
    print(f"    * {c['case_id']}: {c['title']} ({c['status']})")

print("\n========================================================")
print("ALL LIVE VERIFICATION CHECKS PASSED END-TO-END!")
print("========================================================")
