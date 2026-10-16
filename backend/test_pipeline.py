from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

print("\n--- TEST 1: Health Check ---")
res = client.get("/api/health")
print(res.status_code, res.json())
assert res.status_code == 200

print("\n--- TEST 2: Demo Account Setup ---")
res = client.post("/api/auth/register", json={"username": "Gopal", "password": "password123", "role": "investigator"})
print("Register:", res.status_code, res.json())
assert res.status_code == 200

print("\n--- TEST 3: Enter WRONG Password (2 times) ---")
res1 = client.post("/api/auth/login", json={"username": "Gopal", "password": "wrong_password_1"})
print("Wrong 1 (expected 401):", res1.status_code)
assert res1.status_code == 401

res2 = client.post("/api/auth/login", json={"username": "Gopal", "password": "wrong_password_2"})
print("Wrong 2 (expected 401):", res2.status_code)
assert res2.status_code == 401

print("\n--- TEST 4: Enter CORRECT Password ---")
res_ok = client.post("/api/auth/login", json={"username": "Gopal", "password": "password123"})
print("Correct (expected 200):", res_ok.status_code, res_ok.json()["message"])
assert res_ok.status_code == 200

print("\n--- TEST 5: Query: 'Show me failed login attempts before the successful login.' ---")
res_inv = client.post("/api/investigate", json={
    "query": "Show me failed login attempts before the successful login.",
    "user_context": "Gopal"
})
print("Investigate Status:", res_inv.status_code)
data = res_inv.json()
print("Detected Intent:", data["interpretation"]["intent"])
print("Structured Query:", json.dumps(data["structured_query"], indent=2))
print("Evidence Count:", data["evidence_count"])
print("Reference Event Found:", data["reference_event_found"]["event_id"] if data["reference_event_found"] else None)
print("Timeline Items:", len(data["timeline"]))
assert data["evidence_count"] >= 2
assert data["reference_event_found"] is not None

print("\n--- TEST 6: Query: 'Show failed login attempts within 5 minutes before the successful login.' ---")
res_inv2 = client.post("/api/investigate", json={
    "query": "Show failed login attempts within 5 minutes before the successful login.",
    "user_context": "Gopal"
})
data2 = res_inv2.json()
print("Window minutes:", data2["interpretation"]["time_window_minutes"])
print("Evidence Count:", data2["evidence_count"])
assert data2["evidence_count"] >= 2

print("\n--- TEST 7: USB Simulation & Query ---")
res_seq = client.post("/api/simulate/sequence", params={"user": "Gopal"})
print("Simulation Sequence:", res_seq.status_code, res_seq.json()["message"])

res_usb_q = client.post("/api/investigate", json={
    "query": "What files were copied to USB after it was connected?",
    "user_context": "Gopal"
})
data_usb = res_usb_q.json()
print("USB Query Intent:", data_usb["interpretation"]["intent"])
print("USB Evidence Count:", data_usb["evidence_count"])
for ev in data_usb["evidence"]:
    print(f"  - File: {ev.get('file')} | Action: {ev.get('action')} | Device: {ev.get('device')}")
assert data_usb["evidence_count"] >= 1

print("\n--- TEST 8: Dashboard Stats ---")
stats = client.get("/api/dashboard/stats").json()
print(f"Stats: Total Events: {stats['total_events']}, Auth: {stats['authentication_events']}, USB: {stats['usb_events']}, File: {stats['file_events']}, Queries: {stats['queries_executed']}")

print("\nALL BACKEND TESTS PASSED FLOCKLESSLY!")
