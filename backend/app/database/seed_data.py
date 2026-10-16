import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from app.database.db import get_connection, hash_password
from app.config import LANL_SAMPLE_PATH

def seed_database():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Seed default demo accounts
    cursor.execute("SELECT COUNT(*) as count FROM users")
    user_count = cursor.fetchone()["count"]

    if user_count == 0:
        now_str = datetime.now(timezone.utc).isoformat()
        
        # User Gopal (as requested in demo spec)
        gopal_hash, gopal_salt = hash_password("password123")
        cursor.execute("""
        INSERT INTO users (username, password_hash, salt, role, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, ("Gopal", gopal_hash, gopal_salt, "investigator", now_str))

        # Admin user
        admin_hash, admin_salt = hash_password("forensiq2026")
        cursor.execute("""
        INSERT INTO users (username, password_hash, salt, role, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, ("admin", admin_hash, admin_salt, "admin", now_str))

    # 2. Seed initial cases
    cursor.execute("SELECT COUNT(*) as count FROM cases")
    case_count = cursor.fetchone()["count"]

    if case_count == 0:
        cursor.execute("""
        INSERT INTO cases (case_id, title, description, status, created_date, evidence_count, assigned_investigator)
        VALUES 
        ('CAS-2026-001', 'Anomalous Multi-Factor & Host Authentication Burst', 'Investigating sequential failed authentications followed by privileged elevation.', 'INVESTIGATING', '2026-09-28T09:00:00Z', 4, 'Gopal'),
        ('CAS-2026-002', 'Suspected USB Exfiltration on Engineering Workstation', 'Investigating removable storage insertion and bulk file transfer of proprietary reports.', 'OPEN', '2026-09-28T11:30:00Z', 6, 'Gopal'),
        ('CAS-2026-003', 'Enterprise Lateral Movement & Credential Stuffing', 'Cross-machine Kerberos ticket anomaly derived from LANL public telemetry sample.', 'OPEN', '2026-09-28T13:45:00Z', 5, 'Security Ops')
        """)

    # 3. Seed LANL and Baseline Events if forensic_events is empty
    cursor.execute("SELECT COUNT(*) as count FROM forensic_events")
    event_count = cursor.fetchone()["count"]

    if event_count == 0:
        # Load LANL sample if available
        if LANL_SAMPLE_PATH.exists():
            try:
                with open(LANL_SAMPLE_PATH, "r", encoding="utf-8") as f:
                    lanl_events = json.load(f)
                    for evt in lanl_events:
                        cursor.execute("""
                        INSERT OR IGNORE INTO forensic_events (
                            event_id, timestamp, event_type, user, machine, source, action, status, device, file, metadata, dataset_label
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            evt["event_id"],
                            evt["timestamp"],
                            evt["event_type"],
                            evt["user"],
                            evt["machine"],
                            evt["source"],
                            evt["action"],
                            evt["status"],
                            evt.get("device"),
                            evt.get("file"),
                            json.dumps(evt.get("metadata", {})),
                            evt.get("dataset_label", "Public Dataset")
                        ))
            except Exception as e:
                print(f"Warning loading LANL sample: {e}")

        # Baseline system telemetry
        base_time = datetime.now(timezone.utc) - timedelta(hours=2)
        baseline_events = [
            ("EVT-SYS-0001", (base_time + timedelta(minutes=5)).isoformat(), "system", "SYSTEM", "FORENSIQ-PC", "System Audit Log", "SERVICE_START", "SUCCESS", None, "kernel32.dll", json.dumps({"service": "SecurityHealthService"}), "Simulated Forensic Source"),
            ("EVT-NET-0002", (base_time + timedelta(minutes=10)).isoformat(), "network", "SYSTEM", "FORENSIQ-PC", "Firewall Telemetry", "CONNECTION_OPEN", "SUCCESS", None, None, json.dumps({"port": 443, "dest": "internal-gateway"}), "Simulated Forensic Source"),
            ("EVT-FILE-0003", (base_time + timedelta(minutes=15)).isoformat(), "file", "SYSTEM", "FORENSIQ-PC", "File System Monitor", "FILE_READ", "SUCCESS", None, "config.sys", json.dumps({"path": "C:\\Windows\\config.sys"}), "Simulated Forensic Source"),
        ]
        for evt in baseline_events:
            cursor.execute("""
            INSERT OR IGNORE INTO forensic_events (
                event_id, timestamp, event_type, user, machine, source, action, status, device, file, metadata, dataset_label
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, evt)

    conn.commit()
    conn.close()
