import json
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from app.database.db import get_connection
from app.forensic.query_builder import ForensicQueryBuilder

router = APIRouter(prefix="/events", tags=["Forensic Events"])
query_builder = ForensicQueryBuilder()

@router.get("")
def list_events(
    search: Optional[str] = None,
    event_type: Optional[str] = "ALL",
    source: Optional[str] = "ALL",
    status: Optional[str] = "ALL",
    user: Optional[str] = "ALL",
    dataset_label: Optional[str] = "ALL",
    is_suspicious: Optional[int] = None,
    scenario_type: Optional[str] = "ALL",
    limit: int = Query(default=100, le=500)
):
    conn = get_connection()
    events = query_builder.query_evidence_explorer(
        conn=conn,
        search=search,
        event_type=event_type,
        source=source,
        status=status,
        user=user,
        dataset_label=dataset_label,
        is_suspicious=is_suspicious,
        scenario_type=scenario_type,
        limit=limit
    )
    conn.close()
    return {"events": events, "count": len(events)}

@router.get("/timeline")
def get_forensic_timeline(limit: int = 150):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM forensic_events
    ORDER BY timestamp ASC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    events = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get("metadata"), str):
            try:
                d["metadata"] = json.loads(d["metadata"])
            except Exception:
                pass
        events.append(d)

    return {"timeline": events, "total": len(events)}

@router.get("/{event_id}")
def get_event_detail(event_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM forensic_events WHERE event_id = ?", (event_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Forensic event not found")

    item = dict(row)
    if isinstance(item.get("metadata"), str):
        try:
            item["metadata"] = json.loads(item["metadata"])
        except Exception:
            pass
    return item
