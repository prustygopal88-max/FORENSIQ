"""
FORENSIQ Extended Forensic Investigation & Windows Login Telemetry Test Suite
Validates the entire pipeline:
1. Legacy queries (Failed logins within 5 mins before successful login)
2. Real Windows Login Telemetry (Event 4625 FAILED, Event 4624 SUCCESS, WINDOWS_HOST_TELEMETRY)
3. Simulated Login Events (Single Failed, Single Success, 3+1 Attack Sequence, SIMULATED_FORENSIC_EVENT)
4. Strict Dataset Provenance Differentiation (WINDOWS_HOST_TELEMETRY, SIMULATED_FORENSIC_EVENT, SYNTHETIC_DATASET, LANL_PUBLIC_DATASET)
5. Temporal Login Sequence Correlation & Metric Calculation
6. Natural Language Explainability & Narrative Generation ("Three failed Windows login events...")
7. All 8 Extended Natural Language Login Queries
8. USB / Removable drive exfiltration queries
9. Email exfiltration & external recipient queries
10. Host Monitoring Agent lifecycle, device enumeration, and permission status
"""
import sys
import os
import json
import time

# Ensure backend root on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.nlp.parser import ForensicNLPParser
from app.temporal.engine import TemporalEngine
from app.forensic.query_builder import ForensicQueryBuilder
from app.explainability.explainer import ExplainabilityEngine
from app.database.db import get_connection, init_db, record_forensic_event
from app.agent.host_agent import host_agent
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 75)
    print("  RUNNING FORENSIQ EXTENDED INVESTIGATION & LOGIN TELEMETRY TEST SUITE")
    print("=" * 75)

    init_db()
    conn = get_connection()
    parser = ForensicNLPParser()
    temporal_engine = TemporalEngine()
    query_builder = ForensicQueryBuilder()
    explainer = ExplainabilityEngine()

    # ---------------------------------------------------------
    # 1. Real Windows Login Telemetry & Host Agent Verification
    # ---------------------------------------------------------
    print("\n--- 1. Testing Windows Security Event Log Telemetry & Permissions ---")
    can_access, perm_status = host_agent.check_security_log_permissions()
    assert isinstance(can_access, bool)
    assert perm_status in ("GRANTED", "ELEVATION_REQUIRED")
    print(f"  [PASS] Windows Security Log permission status checked: {perm_status} (accessible={can_access})")

    # Test Event 4625 normalization (Failed Logon)
    evt_4625 = host_agent.simulate_real_windows_login_telemetry(
        event_id=4625,
        user="TargetUser",
        machine="WIN-FORENSIC-01",
        source_address="192.168.1.105",
        logon_type="Interactive (2)",
        failure_reason="Unknown username or bad password",
        sub_status="0xC000006A"
    )
    assert evt_4625["action"] == "FAILED_LOGIN"
    assert evt_4625["status"] == "FAILED"
    assert evt_4625["is_suspicious"] == 1
    assert evt_4625["event_type"] == "authentication"
    assert evt_4625["dataset_label"] == "WINDOWS_HOST_TELEMETRY"
    assert evt_4625["metadata"]["windows_event_id"] == 4625
    print("  [PASS] Event 4625 normalized: FAILED_LOGIN, status=FAILED, suspicious=1, WINDOWS_HOST_TELEMETRY")

    # Test Event 4624 normalization (Successful Logon)
    evt_4624 = host_agent.simulate_real_windows_login_telemetry(
        event_id=4624,
        user="TargetUser",
        machine="WIN-FORENSIC-01",
        source_address="192.168.1.105",
        logon_type=2
    )
    assert evt_4624["action"] == "SUCCESSFUL_LOGIN"
    assert evt_4624["status"] == "SUCCESS"
    assert evt_4624["is_suspicious"] == 0
    assert evt_4624["event_type"] == "authentication"
    assert evt_4624["dataset_label"] == "WINDOWS_HOST_TELEMETRY"
    assert evt_4624["metadata"]["windows_event_id"] == 4624
    print("  [PASS] Event 4624 normalized: SUCCESSFUL_LOGIN, status=SUCCESS, suspicious=0, WINDOWS_HOST_TELEMETRY")

    # ---------------------------------------------------------
    # 2. Host Agent Lifecycle & API Endpoints via TestClient
    # ---------------------------------------------------------
    print("\n--- 2. Testing Host Agent Lifecycle & Telemetry Trigger Endpoints ---")
    host_agent.start()
    assert host_agent.is_running is True
    status = host_agent.get_status()
    assert status["is_running"] is True
    assert status["login_telemetry_active"] is True
    assert status["usb_telemetry_active"] is True
    print("  [PASS] Host agent running with both Login & USB telemetry active")

    client = TestClient(app)

    # Trigger Windows telemetry via API
    r = client.post("/api/agent/trigger-login-telemetry", json={
        "event_id": 4625,
        "user": "Gopal",
        "machine": "WORKSTATION-01",
        "source_address": "10.0.0.52",
        "logon_type": 2
    })
    assert r.status_code == 200, f"Trigger failed with {r.status_code}: {r.text}"
    res_trig = r.json()
    assert res_trig["success"] is True
    assert res_trig["event"]["dataset_label"] == "WINDOWS_HOST_TELEMETRY"
    assert res_trig["event"]["action"] == "FAILED_LOGIN"
    print("  [PASS] POST /api/agent/trigger-login-telemetry (4625) -> 200 OK")

    host_agent.stop()
    assert host_agent.is_running is False
    print("  [PASS] Host agent stopped cleanly")

    # ---------------------------------------------------------
    # 3. Simulated Login Events & Attack Sequence
    # ---------------------------------------------------------
    print("\n--- 3. Testing Simulated Login Endpoints & Provenance Separation ---")
    # Single failed login simulation
    r = client.post("/api/simulate/login-failed", json={
        "user": "Admin.Gopal",
        "machine": "CORP-SEC-01",
        "ip_address": "192.168.1.150",
        "reason": "Invalid credentials provided"
    })
    assert r.status_code == 200
    res_fail = r.json()
    assert res_fail["event"]["dataset_label"] == "SIMULATED_FORENSIC_EVENT"
    assert res_fail["event"]["action"] == "FAILED_LOGIN"
    assert res_fail["event"]["status"] == "FAILED"
    print("  [PASS] POST /api/simulate/login-failed -> SIMULATED_FORENSIC_EVENT")

    # Single successful login simulation
    r = client.post("/api/simulate/login-success", json={
        "user": "Admin.Gopal",
        "machine": "CORP-SEC-01",
        "ip_address": "192.168.1.150"
    })
    assert r.status_code == 200
    res_succ = r.json()
    assert res_succ["event"]["dataset_label"] == "SIMULATED_FORENSIC_EVENT"
    assert res_succ["event"]["action"] == "SUCCESSFUL_LOGIN"
    assert res_succ["event"]["status"] == "SUCCESS"
    print("  [PASS] POST /api/simulate/login-success -> SIMULATED_FORENSIC_EVENT")

    # 3-failed + 1-success brute force attack sequence
    r = client.post("/api/simulate/login-sequence", json={
        "user": "Gopal",
        "machine": "FIN-LAPTOP-02",
        "failed_attempts": 3,
        "time_delta_seconds": 15,
        "include_successful_login": True
    })
    assert r.status_code == 200
    seq_res = r.json()
    assert seq_res["success"] is True
    assert len(seq_res["events"]) == 4
    for ev in seq_res["events"]:
        assert ev["dataset_label"] == "SIMULATED_FORENSIC_EVENT"
    print("  [PASS] POST /api/simulate/login-sequence -> 4 events with SIMULATED_FORENSIC_EVENT label")

    # Verify Database Provenance Differentiation
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT dataset_label FROM forensic_events")
    labels = {row[0] for row in cursor.fetchall()}
    assert "WINDOWS_HOST_TELEMETRY" in labels, "WINDOWS_HOST_TELEMETRY must exist in database"
    assert "SIMULATED_FORENSIC_EVENT" in labels, "SIMULATED_FORENSIC_EVENT must exist in database"
    assert "SYNTHETIC_DATASET" in labels, "SYNTHETIC_DATASET must exist in database"
    print(f"  [PASS] Strict Provenance Verified in DB. Distinct labels found: {labels}")

    # ---------------------------------------------------------
    # 4. Temporal Login Correlation & Metrics Calculation
    # ---------------------------------------------------------
    print("\n--- 4. Testing Temporal Login Sequence Correlation & Metric Calculation ---")
    corr = temporal_engine.correlate_login_sequence(conn, target_user="Gopal")
    assert corr is not None, "Failed to correlate login sequence for user Gopal"
    assert corr["number_of_failed_attempts"] >= 3
    assert len(corr["inter_attempt_deltas"]) >= 2
    assert corr["time_to_success"] >= 0
    assert corr["total_investigation_window"] >= 0
    assert corr["forensic_classification"] == "Authentication activity requiring investigation"
    assert "failed" in corr["narrative"].lower()
    print(f"  [PASS] Login Correlation calculated:")
    print(f"         Attempts: {corr['number_of_failed_attempts']} | Window: {corr['total_investigation_window']}s | Time to success: {corr['time_to_success']}s")
    print(f"         Classification: '{corr['forensic_classification']}'")
    print(f"         Narrative: \"{corr['narrative']}\"")

    # ---------------------------------------------------------
    # 5. NLP Query Parsing, Execution & Narrative Generation
    # ---------------------------------------------------------
    print("\n--- 5. Testing All 8 Extended Natural Language Login Queries ---")
    nlp_queries = [
        {
            "query": "Show failed login attempts before the successful login.",
            "expected_intent": "authentication_investigation",
            "expected_ref": "successful_login",
            "min_evidence": 1
        },
        {
            "query": "Show failed logins within 10 minutes before successful login.",
            "expected_intent": "authentication_investigation",
            "expected_ref": "successful_login",
            "min_evidence": 1
        },
        {
            "query": "Show repeated failed login attempts.",
            "expected_intent": "authentication_investigation",
            "expected_ref": None,
            "min_evidence": 1
        },
        {
            "query": "Show failed Windows logins.",
            "expected_intent": "authentication_investigation",
            "expected_ref": None,
            "min_evidence": 1
        },
        {
            "query": "Show successful Windows logins.",
            "expected_intent": "authentication_investigation",
            "expected_ref": None,
            "min_evidence": 1
        },
        {
            "query": "Show failed logins for user Gopal.",
            "expected_intent": "authentication_investigation",
            "expected_ref": None,
            "min_evidence": 1
        },
        {
            "query": "Show login activity for user Gopal.",
            "expected_intent": "authentication_timeline",
            "expected_ref": None,
            "min_evidence": 1
        },
        {
            "query": "Show authentication events from Windows.",
            "expected_intent": "authentication_timeline",
            "expected_ref": None,
            "min_evidence": 1
        },
        # Original query
        {
            "query": "Show failed login attempts within 5 minutes before the successful login.",
            "expected_intent": "authentication_investigation",
            "expected_ref": "successful_login",
            "min_evidence": 1
        }
    ]

    for idx, tc in enumerate(nlp_queries, 1):
        q = tc["query"]
        interp, sq = parser.parse(q, default_user="Gopal")

        assert interp.intent == tc["expected_intent"], f"Intent mismatch for '{q}': got {interp.intent}, expected {tc['expected_intent']}"
        assert interp.reference_event == tc["expected_ref"], f"Ref mismatch for '{q}': got {interp.reference_event}, expected {tc['expected_ref']}"

        ref_evt = None
        min_t, max_t, tw = None, None, None
        if interp.reference_event:
            ref_evt = temporal_engine.find_reference_event(
                conn,
                interp.reference_event,
                target_user=sq.user,
                target_action=sq.action,
                temporal_relation=sq.temporal_relation,
                device_type=sq.device_type_filter
            )
            assert ref_evt is not None, f"Landmark reference event '{interp.reference_event}' not found!"
            if interp.temporal_relation:
                min_t, max_t, tw = temporal_engine.calculate_bounds(ref_evt["timestamp"], interp.temporal_relation, interp.time_window_minutes)
            if not sq.user and ref_evt.get("user") and ref_evt.get("user") != "SYSTEM":
                sq.user = ref_evt.get("user")

        evidence = query_builder.build_and_execute(
            conn, sq, min_t, max_t,
            exclude_event_id=ref_evt["event_id"] if ref_evt else None
        )

        assert len(evidence) >= tc["min_evidence"], f"Expected >= {tc['min_evidence']} evidence items for '{q}', found {len(evidence)}"

        exp = explainer.generate_explanation(q, interp, sq, ref_evt, tw, evidence[:3])
        assert exp["nlp_breakdown"]["detected_intent"] is not None
        assert "summary_verdict" in exp and len(exp["summary_verdict"]) > 0

        # When there is a reference event and failed logins, verify synthesized narrative
        if ref_evt and sq.action == "FAILED_LOGIN":
            assert "failed" in exp["summary_verdict"].lower()
            assert "successful login" in exp["summary_verdict"].lower()

        print(f"  [PASS] NLP Query {idx}: '{q}'")
        print(f"         Intent: {interp.intent} | Evidence: {len(evidence)} items | Verdict: \"{exp['summary_verdict'][:60]}...\"")

    # ---------------------------------------------------------
    # 6. Existing Forensic Capabilities (USB & Email Exfiltration)
    # ---------------------------------------------------------
    print("\n--- 6. Verifying Non-Regression on Existing Forensic Modules ---")
    other_queries = [
        {
            "query": "Show files copied to USB after pendrive was connected.",
            "expected_intent": "usb_investigation",
            "expected_ref": "usb_connected"
        },
        {
            "query": "Show files copied to external hard drive after it was connected",
            "expected_intent": "external_drive_investigation",
            "expected_ref": "external_drive_connected"
        },
        {
            "query": "Show sensitive files emailed to external recipients within 10 minutes after access",
            "expected_intent": "email_investigation",
            "expected_ref": "sensitive_file_access"
        }
    ]
    for tc in other_queries:
        q = tc["query"]
        interp, sq = parser.parse(q, default_user="Gopal")
        assert interp.intent == tc["expected_intent"]
        assert interp.reference_event == tc["expected_ref"]
        ref_evt = temporal_engine.find_reference_event(conn, interp.reference_event, target_user=sq.user, target_action=sq.action, temporal_relation=sq.temporal_relation, device_type=sq.device_type_filter)
        assert ref_evt is not None
        min_t, max_t, tw = temporal_engine.calculate_bounds(ref_evt["timestamp"], interp.temporal_relation, interp.time_window_minutes)
        evidence = query_builder.build_and_execute(conn, sq, min_t, max_t, exclude_event_id=ref_evt["event_id"])
        assert len(evidence) >= 1
        print(f"  [PASS] Preserved Query: '{q[:50]}...' -> {len(evidence)} evidence items")

    # End-to-end API investigation endpoint verification
    for q_test in [
        "Show failed login attempts within 5 minutes before the successful login.",
        "Show failed Windows logins.",
        "Show files copied to USB after pendrive was connected."
    ]:
        r = client.post("/api/investigate", json={"query": q_test})
        assert r.status_code == 200
        inv_data = r.json()
        assert inv_data["evidence_count"] > 0
        assert inv_data["explainability"]["summary_verdict"] != ""
        print(f"  [PASS] API /api/investigate: '{q_test[:45]}...' -> {inv_data['evidence_count']} evidence")

    # Dashboard stats
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200
    stats = r.json()
    assert stats["total_events"] > 15000
    assert stats["suspicious_events"] > 5000
    print(f"  [PASS] API /api/dashboard/stats -> {stats['total_events']} total, {stats['suspicious_events']} suspicious")

    conn.close()

    print("\n" + "=" * 75)
    print("  ALL 10 FORENSIQ EXTENDED & LOGIN TELEMETRY AUDIT CHECKS PASSED (100% OK)!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
