import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
from app.config import DATABASE_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    hashed, _ = hash_password(password, salt)
    return hashed == password_hash

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Forensic events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS forensic_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        user TEXT NOT NULL,
        machine TEXT NOT NULL,
        source TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        device TEXT,
        file TEXT,
        metadata TEXT,
        dataset_label TEXT NOT NULL DEFAULT 'Live Authentication',
        destination TEXT,
        device_type TEXT,
        manufacturer TEXT,
        model TEXT,
        serial_number TEXT,
        drive_letter TEXT,
        file_path TEXT,
        file_size INTEGER,
        file_sensitivity TEXT,
        email_service TEXT,
        sender TEXT,
        recipient TEXT,
        recipient_type TEXT,
        recipient_domain TEXT,
        process TEXT,
        scenario_type TEXT,
        is_suspicious INTEGER DEFAULT 0,
        description TEXT
    )
    """)

    # Dynamic schema migration for existing databases:
    cursor.execute("PRAGMA table_info(forensic_events)")
    existing_columns = {col["name"] for col in cursor.fetchall()}

    columns_to_add = [
        ("destination", "TEXT"),
        ("device_type", "TEXT"),
        ("manufacturer", "TEXT"),
        ("model", "TEXT"),
        ("serial_number", "TEXT"),
        ("drive_letter", "TEXT"),
        ("file_path", "TEXT"),
        ("file_size", "INTEGER"),
        ("file_sensitivity", "TEXT"),
        ("email_service", "TEXT"),
        ("sender", "TEXT"),
        ("recipient", "TEXT"),
        ("recipient_type", "TEXT"),
        ("recipient_domain", "TEXT"),
        ("process", "TEXT"),
        ("scenario_type", "TEXT"),
        ("is_suspicious", "INTEGER DEFAULT 0"),
        ("description", "TEXT"),
    ]

    for col_name, col_def in columns_to_add:
        if col_name not in existing_columns:
            cursor.execute(f"ALTER TABLE forensic_events ADD COLUMN {col_name} {col_def}")

    # Indexes for fast temporal and forensic queries
    indexes = [
        ("idx_timestamp", "forensic_events(timestamp)"),
        ("idx_event_type", "forensic_events(event_type)"),
        ("idx_action", "forensic_events(action)"),
        ("idx_user", "forensic_events(user)"),
        ("idx_dataset_label", "forensic_events(dataset_label)"),
        ("idx_device_type", "forensic_events(device_type)"),
        ("idx_file_sensitivity", "forensic_events(file_sensitivity)"),
        ("idx_email_service", "forensic_events(email_service)"),
        ("idx_is_suspicious", "forensic_events(is_suspicious)"),
        ("idx_scenario_type", "forensic_events(scenario_type)"),
    ]
    for idx_name, idx_target in indexes:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {idx_target};")

    # 2. Users table (for dynamic investigator / suspect account demo)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'investigator',
        created_at TEXT NOT NULL
    )
    """)

    # 3. Cases table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'OPEN',
        created_date TEXT NOT NULL,
        evidence_count INTEGER DEFAULT 0,
        assigned_investigator TEXT DEFAULT 'Gopal'
    )
    """)

    # 4. Investigation query history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        structured_query TEXT
    )
    """)

    conn.commit()
    conn.close()

def record_forensic_event(
    event_type: str,
    action: str,
    status: str,
    user: str,
    machine: str = "FORENSIQ-PC",
    source: str = "Application Login",
    device: Optional[str] = None,
    file: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    dataset_label: str = "Live Authentication",
    timestamp: Optional[str] = None,
    destination: Optional[str] = None,
    device_type: Optional[str] = None,
    manufacturer: Optional[str] = None,
    model: Optional[str] = None,
    serial_number: Optional[str] = None,
    drive_letter: Optional[str] = None,
    file_path: Optional[str] = None,
    file_size: Optional[int] = None,
    file_sensitivity: Optional[str] = None,
    email_service: Optional[str] = None,
    sender: Optional[str] = None,
    recipient: Optional[str] = None,
    recipient_type: Optional[str] = None,
    recipient_domain: Optional[str] = None,
    process: Optional[str] = None,
    scenario_type: Optional[str] = None,
    is_suspicious: int = 0,
    description: Optional[str] = None,
    event_id: Optional[str] = None
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    if not event_id:
        cursor.execute("SELECT COUNT(*) as count FROM forensic_events")
        count = cursor.fetchone()["count"] + 1
        prefix = {
            "authentication": "AUTH",
            "file": "FILE",
            "usb": "USB",
            "system": "SYS",
            "network": "NET",
            "email": "MAIL"
        }.get(event_type.lower(), "EVT")
        event_id = f"EVT-{prefix}-{count:06d}"

    metadata_json = json.dumps(metadata or {})

    cursor.execute("""
    INSERT INTO forensic_events (
        event_id, timestamp, event_type, user, machine, source, action, status,
        device, file, metadata, dataset_label, destination, device_type,
        manufacturer, model, serial_number, drive_letter, file_path, file_size,
        file_sensitivity, email_service, sender, recipient, recipient_type,
        recipient_domain, process, scenario_type, is_suspicious, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_id, timestamp, event_type, user, machine, source, action, status,
        device, file, metadata_json, dataset_label, destination, device_type,
        manufacturer, model, serial_number, drive_letter, file_path, file_size,
        file_sensitivity, email_service, sender, recipient, recipient_type,
        recipient_domain, process, scenario_type, is_suspicious, description
    ))
    conn.commit()
    conn.close()

    return {
        "event_id": event_id,
        "timestamp": timestamp,
        "event_type": event_type,
        "user": user,
        "machine": machine,
        "source": source,
        "action": action,
        "status": status,
        "device": device,
        "file": file,
        "metadata": metadata or {},
        "dataset_label": dataset_label,
        "destination": destination,
        "device_type": device_type,
        "manufacturer": manufacturer,
        "model": model,
        "serial_number": serial_number,
        "drive_letter": drive_letter,
        "file_path": file_path,
        "file_size": file_size,
        "file_sensitivity": file_sensitivity,
        "email_service": email_service,
        "sender": sender,
        "recipient": recipient,
        "recipient_type": recipient_type,
        "recipient_domain": recipient_domain,
        "process": process,
        "scenario_type": scenario_type,
        "is_suspicious": is_suspicious,
        "description": description
    }

def record_forensic_events_batch(events: List[Dict[str, Any]]) -> int:
    """
    High-throughput batch insertion for large synthetic datasets and telemetry imports.
    """
    if not events:
        return 0

    conn = get_connection()
    cursor = conn.cursor()

    rows = []
    for evt in events:
        meta = evt.get("metadata")
        meta_json = json.dumps(meta) if isinstance(meta, dict) else (meta or "{}")
        rows.append((
            evt.get("event_id"),
            evt.get("timestamp"),
            evt.get("event_type"),
            evt.get("user"),
            evt.get("machine", "FORENSIQ-PC"),
            evt.get("source", "System Telemetry"),
            evt.get("action"),
            evt.get("status", "SUCCESS"),
            evt.get("device"),
            evt.get("file"),
            meta_json,
            evt.get("dataset_label", "SYNTHETIC_DATASET"),
            evt.get("destination"),
            evt.get("device_type"),
            evt.get("manufacturer"),
            evt.get("model"),
            evt.get("serial_number"),
            evt.get("drive_letter"),
            evt.get("file_path"),
            evt.get("file_size"),
            evt.get("file_sensitivity"),
            evt.get("email_service"),
            evt.get("sender"),
            evt.get("recipient"),
            evt.get("recipient_type"),
            evt.get("recipient_domain"),
            evt.get("process"),
            evt.get("scenario_type"),
            evt.get("is_suspicious", 0),
            evt.get("description")
        ))

    cursor.executemany("""
    INSERT INTO forensic_events (
        event_id, timestamp, event_type, user, machine, source, action, status,
        device, file, metadata, dataset_label, destination, device_type,
        manufacturer, model, serial_number, drive_letter, file_path, file_size,
        file_sensitivity, email_service, sender, recipient, recipient_type,
        recipient_domain, process, scenario_type, is_suspicious, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)

    conn.commit()
    inserted_count = cursor.rowcount
    conn.close()
    return inserted_count
