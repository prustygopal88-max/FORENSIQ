import json
import sqlite3
from typing import List, Dict, Any, Optional
from app.models.schemas import StructuredForensicQuery

class ForensicQueryBuilder:
    """
    Constructs parameterized SQL queries from StructuredForensicQuery specifications
    and executes them against the unified forensic events database.
    """

    def build_and_execute(
        self,
        conn: sqlite3.Connection,
        structured_query: StructuredForensicQuery,
        min_time: Optional[str] = None,
        max_time: Optional[str] = None,
        exclude_event_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cursor = conn.cursor()
        clauses = []
        params = []

        # 1. Event Type filter
        if structured_query.event_type and structured_query.event_type.lower() != "all":
            clauses.append("event_type = ?")
            params.append(structured_query.event_type.lower())

        # 2. Action filter (handles legacy FILE_COPY and new FILE_COPIED_TO_REMOVABLE_DEVICE synonymously)
        if structured_query.action:
            act = structured_query.action.upper()
            if act in ("FILE_COPY", "FILE_COPIED_TO_REMOVABLE_DEVICE"):
                clauses.append("action IN ('FILE_COPY', 'FILE_COPIED_TO_REMOVABLE_DEVICE')")
            elif act in ("FILE_MODIFIED", "FILE_EDITED"):
                clauses.append("action IN ('FILE_MODIFIED', 'FILE_EDITED')")
            elif act in ("FILE_DELETED", "FILE_DELETE"):
                clauses.append("action IN ('FILE_DELETED', 'FILE_DELETE')")
            else:
                clauses.append("action = ?")
                params.append(act)

        # 3. Status filter
        if structured_query.status and structured_query.status.upper() != "ALL":
            clauses.append("status = ?")
            params.append(structured_query.status.upper())

        # 4. User filter
        if structured_query.user:
            clauses.append("(LOWER(user) = LOWER(?) OR user LIKE ? OR user = 'SYSTEM')")
            params.extend([structured_query.user, f"%{structured_query.user}%"])


        # 5. Device / Peripheral filter
        if structured_query.device_filter:
            dev_up = structured_query.device_filter.upper()
            if dev_up == "USB":
                clauses.append("""
                    (device_type LIKE '%USB%' OR 
                     device LIKE '%USB%' OR 
                     device LIKE '%flash%' OR 
                     action LIKE '%USB%' OR 
                     action LIKE '%REMOVABLE%' OR 
                     event_type = 'usb')
                """)
            elif dev_up == "EXTERNAL":
                clauses.append("""
                    (device_type LIKE '%EXTERNAL%' OR 
                     device LIKE '%external%' OR 
                     device LIKE '%passport%' OR 
                     device LIKE '%shield%' OR 
                     action LIKE '%REMOVABLE%')
                """)
            else:
                clauses.append("(device LIKE ? OR metadata LIKE ? OR drive_letter LIKE ? OR action LIKE ?)")
                dev_pat = f"%{structured_query.device_filter}%"
                params.extend([dev_pat, dev_pat, dev_pat, dev_pat])

        # 6. Device Type filter (e.g. EXTERNAL_HDD, USB_FLASH_DRIVE)
        if structured_query.device_type_filter:
            clauses.append("(device_type = ? OR device_type LIKE ?)")
            params.extend([
                structured_query.device_type_filter,
                f"%{structured_query.device_type_filter}%"
            ])

        # 7. File filter
        if structured_query.file_filter:
            clauses.append("(file LIKE ? OR file_path LIKE ?)")
            f_pat = f"%{structured_query.file_filter}%"
            params.extend([f_pat, f_pat])

        # 8. File Sensitivity filter
        if structured_query.file_sensitivity_filter:
            if structured_query.file_sensitivity_filter.upper() == "SENSITIVE":
                clauses.append("file_sensitivity IN ('CONFIDENTIAL', 'RESTRICTED')")
            else:
                clauses.append("file_sensitivity = ?")
                params.append(structured_query.file_sensitivity_filter.upper())

        # 9. Email Service & Recipient Type filters
        if structured_query.email_service_filter:
            clauses.append("email_service = ?")
            params.append(structured_query.email_service_filter.upper())

        if structured_query.recipient_type_filter:
            clauses.append("recipient_type = ?")
            params.append(structured_query.recipient_type_filter.upper())

        # 10. Scenario & Suspicious filters
        if structured_query.scenario_type_filter:
            clauses.append("scenario_type = ?")
            params.append(structured_query.scenario_type_filter)

        if structured_query.is_suspicious_filter is not None:
            clauses.append("is_suspicious = ?")
            params.append(structured_query.is_suspicious_filter)

        # 11. Source / Host Telemetry filter
        if structured_query.source_filter:
            if structured_query.source_filter.upper() == "WINDOWS":
                clauses.append("(source LIKE '%Windows%' OR dataset_label = 'WINDOWS_HOST_TELEMETRY')")
            else:
                clauses.append("source LIKE ?")
                params.append(f"%{structured_query.source_filter}%")


        # 11. Temporal bounds
        if min_time:
            clauses.append("timestamp >= ?")
            params.append(min_time)
        if max_time:
            clauses.append("timestamp <= ?")
            params.append(max_time)

        # 12. Exclude reference event itself if needed
        if exclude_event_id:
            clauses.append("event_id != ?")
            params.append(exclude_event_id)

        where_clause = " AND ".join(clauses) if clauses else "1=1"
        sql = f"""
            SELECT * FROM forensic_events
            WHERE {where_clause}
            ORDER BY timestamp ASC
        """

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        results = []
        for r in rows:
            item = dict(r)
            if isinstance(item.get("metadata"), str):
                try:
                    item["metadata"] = json.loads(item["metadata"])
                except Exception:
                    pass
            results.append(item)
        return results

    def query_evidence_explorer(
        self,
        conn: sqlite3.Connection,
        search: Optional[str] = None,
        event_type: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
        user: Optional[str] = None,
        dataset_label: Optional[str] = None,
        is_suspicious: Optional[int] = None,
        scenario_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        cursor = conn.cursor()
        clauses = []
        params = []

        if event_type and event_type != "ALL":
            clauses.append("event_type = ?")
            params.append(event_type.lower())

        if source and source != "ALL":
            clauses.append("source = ?")
            params.append(source)

        if status and status != "ALL":
            clauses.append("status = ?")
            params.append(status.upper())

        if user and user != "ALL":
            clauses.append("user = ?")
            params.append(user)

        if dataset_label and dataset_label != "ALL":
            clauses.append("dataset_label = ?")
            params.append(dataset_label)

        if is_suspicious is not None:
            clauses.append("is_suspicious = ?")
            params.append(is_suspicious)

        if scenario_type and scenario_type != "ALL":
            clauses.append("scenario_type = ?")
            params.append(scenario_type)

        if search:
            clauses.append("""
            (event_id LIKE ? OR action LIKE ? OR user LIKE ? OR machine LIKE ? OR 
             file LIKE ? OR device LIKE ? OR metadata LIKE ? OR source LIKE ? OR 
             recipient LIKE ? OR description LIKE ?)
            """)
            s = f"%{search}%"
            params.extend([s, s, s, s, s, s, s, s, s, s])

        where_clause = " AND ".join(clauses) if clauses else "1=1"
        sql = f"""
            SELECT * FROM forensic_events
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT ?
        """
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        results = []
        for r in rows:
            item = dict(r)
            if isinstance(item.get("metadata"), str):
                try:
                    item["metadata"] = json.loads(item["metadata"])
                except Exception:
                    pass
            results.append(item)
        return results
