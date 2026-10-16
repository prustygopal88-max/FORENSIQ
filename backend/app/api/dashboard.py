import json
from fastapi import APIRouter
from app.database.db import get_connection
from app.models.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Total events
    cursor.execute("SELECT COUNT(*) as total FROM forensic_events")
    total_events = cursor.fetchone()["total"]

    # 2. Counts by event_type
    cursor.execute("""
    SELECT event_type, COUNT(*) as count 
    FROM forensic_events 
    GROUP BY event_type
    """)
    distribution_rows = cursor.fetchall()
    distribution = {r["event_type"]: r["count"] for r in distribution_rows}

    auth_count = distribution.get("authentication", 0)
    file_count = distribution.get("file", 0)
    usb_count = distribution.get("usb", 0)
    system_count = distribution.get("system", 0)
    email_count = distribution.get("email", 0)
    network_count = distribution.get("network", 0)

    # 3. Host telemetry & Suspicious counts
    cursor.execute("SELECT COUNT(*) as cnt FROM forensic_events WHERE dataset_label = 'WINDOWS_HOST_TELEMETRY'")
    host_telemetry_events = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM forensic_events WHERE is_suspicious = 1")
    suspicious_events = cursor.fetchone()["cnt"]

    # 4. Active cases
    cursor.execute("SELECT COUNT(*) as total FROM cases WHERE status != 'CLOSED'")
    active_cases = cursor.fetchone()["total"]

    # 5. Queries executed
    cursor.execute("SELECT COUNT(*) as total FROM investigation_history")
    queries_executed = cursor.fetchone()["total"]

    # 6. Recent events (latest 10)
    cursor.execute("""
    SELECT * FROM forensic_events
    ORDER BY timestamp DESC
    LIMIT 10
    """)
    recent_events = []
    for r in cursor.fetchall():
        d = dict(r)
        if isinstance(d.get("metadata"), str):
            try:
                d["metadata"] = json.loads(d["metadata"])
            except Exception:
                pass
        recent_events.append(d)

    # 7. Recent investigations (latest 6)
    cursor.execute("""
    SELECT id, query_text, timestamp, results_count, structured_query
    FROM investigation_history
    ORDER BY id DESC
    LIMIT 6
    """)
    recent_investigations = []
    for r in cursor.fetchall():
        d = dict(r)
        if isinstance(d.get("structured_query"), str):
            try:
                d["structured_query"] = json.loads(d["structured_query"])
            except Exception:
                pass
        recent_investigations.append(d)

    conn.close()

    return DashboardStats(
        total_events=total_events,
        authentication_events=auth_count,
        file_events=file_count,
        usb_events=usb_count,
        system_events=system_count,
        email_events=email_count,
        network_events=network_count,
        host_telemetry_events=host_telemetry_events,
        suspicious_events=suspicious_events,
        active_cases=active_cases,
        queries_executed=queries_executed,
        recent_events=recent_events,
        recent_investigations=recent_investigations,
        event_distribution=distribution
    )
