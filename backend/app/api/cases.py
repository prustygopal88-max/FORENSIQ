from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional, List
from app.database.db import get_connection
from app.models.schemas import CaseCreate, CaseResponse

router = APIRouter(prefix="/cases", tags=["Case Management"])

@router.get("", response_model=List[CaseResponse])
def get_all_cases():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT case_id, title, description, status, created_date, evidence_count, assigned_investigator FROM cases ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("", response_model=CaseResponse)
def create_case(case_in: CaseCreate):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count FROM cases")
    count = cursor.fetchone()["count"] + 1
    case_id = f"CAS-2026-{count:03d}"
    now_str = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO cases (case_id, title, description, status, created_date, evidence_count, assigned_investigator)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id,
        case_in.title,
        case_in.description,
        "OPEN",
        now_str,
        0,
        case_in.assigned_investigator or "Gopal"
    ))
    conn.commit()
    conn.close()

    return CaseResponse(
        case_id=case_id,
        title=case_in.title,
        description=case_in.description,
        status="OPEN",
        created_date=now_str,
        evidence_count=0,
        assigned_investigator=case_in.assigned_investigator or "Gopal"
    )

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT case_id, title, description, status, created_date, evidence_count, assigned_investigator FROM cases WHERE case_id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    return dict(row)
