import time
import json
from fastapi import APIRouter
from datetime import datetime, timezone
from app.models.schemas import QueryRequest, InvestigationResponse
from app.database.db import get_connection
from app.nlp.parser import ForensicNLPParser
from app.temporal.engine import TemporalEngine
from app.forensic.query_builder import ForensicQueryBuilder
from app.explainability.explainer import ExplainabilityEngine

router = APIRouter(prefix="/investigate", tags=["Investigation"])

nlp_parser = ForensicNLPParser()
temporal_engine = TemporalEngine()
query_builder = ForensicQueryBuilder()
explainer = ExplainabilityEngine()

@router.post("", response_model=InvestigationResponse)
def execute_investigation(req: QueryRequest):
    start_time = time.perf_counter()
    query_text = req.query.strip()
    user_context = req.user_context

    # 1. NLP Interpretation & Structured Query Generation
    interpretation, structured_query = nlp_parser.parse(query_text, default_user=user_context)

    conn = get_connection()

    # 2. Temporal Reference Resolution
    reference_event = None
    min_time = None
    max_time = None
    temporal_window_meta = None

    if structured_query.reference_event:
        reference_event = temporal_engine.find_reference_event(
            conn=conn,
            reference_type=structured_query.reference_event,
            target_user=structured_query.user,
            target_action=structured_query.action,
            temporal_relation=structured_query.temporal_relation,
            device_type=structured_query.device_type_filter
        )

        if reference_event:
            min_time, max_time, temporal_window_meta = temporal_engine.calculate_bounds(
                reference_timestamp_str=reference_event["timestamp"],
                relation=structured_query.temporal_relation or "BEFORE",
                window_minutes=structured_query.time_window_minutes
            )
            if not structured_query.user and reference_event.get("user") and reference_event.get("user") != "SYSTEM":
                structured_query.user = reference_event.get("user")

    # 3. Database Execution
    evidence = query_builder.build_and_execute(
        conn=conn,
        structured_query=structured_query,
        min_time=min_time,
        max_time=max_time,
        exclude_event_id=reference_event["event_id"] if reference_event else None
    )

    # 4. Explainable Reasoning Generation
    explainability = explainer.generate_explanation(
        query_text=query_text,
        interpretation=interpretation,
        structured_query=structured_query,
        reference_event=reference_event,
        temporal_window=temporal_window_meta,
        evidence_items=evidence
    )

    # 5. Build Timeline Array
    timeline_items = []
    
    # Add evidence items
    for item in evidence:
        time_delta_str = ""
        if reference_event:
            delta_info = TemporalEngine.calculate_time_delta(item["timestamp"], reference_event["timestamp"])
            time_delta_str = delta_info["human_delta"]

        timeline_items.append({
            "event_id": item["event_id"],
            "timestamp": item["timestamp"],
            "action": item["action"],
            "status": item["status"],
            "event_type": item["event_type"],
            "user": item["user"],
            "machine": item["machine"],
            "source": item["source"],
            "file": item.get("file"),
            "device": item.get("device"),
            "is_landmark": False,
            "delta_from_landmark": time_delta_str,
            "description": f"{item['action']} ({item['status']}) by {item['user']}"
        })

    # Add landmark reference event to timeline if present
    if reference_event:
        timeline_items.append({
            "event_id": reference_event["event_id"],
            "timestamp": reference_event["timestamp"],
            "action": reference_event["action"],
            "status": reference_event["status"],
            "event_type": reference_event["event_type"],
            "user": reference_event["user"],
            "machine": reference_event["machine"],
            "source": reference_event["source"],
            "file": reference_event.get("file"),
            "device": reference_event.get("device"),
            "is_landmark": True,
            "delta_from_landmark": "REFERENCE POINT (0s)",
            "description": f"REFERENCE: {reference_event['action']} by {reference_event['user']}"
        })

    # Sort timeline chronologically
    timeline_items.sort(key=lambda x: x["timestamp"])

    # 6. Record to Investigation History Table
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO investigation_history (query_text, timestamp, results_count, structured_query)
    VALUES (?, ?, ?, ?)
    """, (
        query_text,
        datetime.now(timezone.utc).isoformat(),
        len(evidence),
        json.dumps(structured_query.model_dump())
    ))
    conn.commit()
    conn.close()

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return InvestigationResponse(
        query=query_text,
        interpretation=interpretation,
        structured_query=structured_query.model_dump(),
        reference_event_found=reference_event,
        temporal_window=temporal_window_meta,
        evidence_count=len(evidence),
        evidence=evidence,
        explainability=explainability,
        timeline=timeline_items,
        execution_time_ms=elapsed_ms
    )
