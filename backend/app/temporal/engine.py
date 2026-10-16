import json
from datetime import datetime, timezone, timedelta
from dateutil import parser as dt_parser
from typing import Optional, Dict, Any, List
import sqlite3

class TemporalEngine:
    """
    Temporal reasoning engine for forensic timeline and interval filtering.
    Resolves reference landmark events and computes temporal boundary windows.
    """

    def find_reference_event(
        self,
        conn: sqlite3.Connection,
        reference_type: str,
        target_user: Optional[str] = None,
        target_action: Optional[str] = None,
        temporal_relation: Optional[str] = None,
        device_type: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        cursor = conn.cursor()

        query_map = {
            "successful_login": "action = 'SUCCESSFUL_LOGIN'",
            "failed_login": "action = 'FAILED_LOGIN'",
            "usb_connected": "action = 'USB_CONNECTED'",
            "usb_removed": "action = 'USB_REMOVED'",
            "external_drive_connected": "action = 'USB_CONNECTED' AND (device_type IN ('EXTERNAL_HDD', 'EXTERNAL_SSD') OR device LIKE '%external%' OR device LIKE '%passport%' OR device LIKE '%shield%')",
            "file_copy": "action IN ('FILE_COPY', 'FILE_COPIED_TO_REMOVABLE_DEVICE')",
            "file_access": "action = 'FILE_ACCESS'",
            "sensitive_file_access": "action = 'FILE_ACCESS' AND (file_sensitivity IN ('CONFIDENTIAL', 'RESTRICTED') OR is_suspicious = 1)",
            "file_attached_to_email": "action = 'FILE_ATTACHED_TO_EMAIL'",
            "email_sent": "action = 'EMAIL_SENT'",
        }

        action_clause = query_map.get(reference_type.lower())
        if not action_clause:
            action_clause = f"action LIKE '%{reference_type}%' OR event_type LIKE '%{reference_type}%'"

        # First attempt: correlated landmark matching if target_action and relation are present
        if target_action and temporal_relation:
            rel_op = ">=" if temporal_relation.upper() == "AFTER" else "<="
            corr_act = target_action.upper()
            act_condition = (
                "e2.action IN ('FILE_COPY', 'FILE_COPIED_TO_REMOVABLE_DEVICE')"
                if corr_act in ("FILE_COPY", "FILE_COPIED_TO_REMOVABLE_DEVICE")
                else f"e2.action = '{corr_act}'"
            )

            dev_type_clause = ""
            dev_type_params = []
            if device_type:
                dev_type_clause = "AND (forensic_events.device_type = ? OR forensic_events.device_type IS NULL)"
                dev_type_params = [device_type]

            # Try with user if provided
            user_clause = "AND (LOWER(forensic_events.user) = LOWER(?) OR forensic_events.user LIKE ? OR forensic_events.user = 'SYSTEM')" if target_user else ""
            user_params = [target_user, f"%{target_user}%"] if target_user else []

            corr_sql = f"""
                SELECT * FROM forensic_events
                WHERE {action_clause} {user_clause} {dev_type_clause}
                AND EXISTS (
                    SELECT 1 FROM forensic_events e2
                    WHERE {act_condition}
                    AND (e2.user = forensic_events.user OR forensic_events.user = 'SYSTEM' OR e2.user = 'SYSTEM')
                    AND e2.timestamp {rel_op} forensic_events.timestamp
                    AND abs(julianday(e2.timestamp) - julianday(forensic_events.timestamp)) * 86400 <= 1800
                )
                ORDER BY timestamp DESC LIMIT 1
            """
            cursor.execute(corr_sql, user_params + dev_type_params)
            corr_row = cursor.fetchone()

            # If not found with user filter, retry correlated search globally across enterprise telemetry
            if not corr_row and target_user:
                corr_sql_global = f"""
                    SELECT * FROM forensic_events
                    WHERE {action_clause} {dev_type_clause}
                    AND EXISTS (
                        SELECT 1 FROM forensic_events e2
                        WHERE {act_condition}
                        AND (e2.user = forensic_events.user OR forensic_events.user = 'SYSTEM' OR e2.user = 'SYSTEM')
                        AND e2.timestamp {rel_op} forensic_events.timestamp
                        AND abs(julianday(e2.timestamp) - julianday(forensic_events.timestamp)) * 86400 <= 1800
                    )
                    ORDER BY timestamp DESC LIMIT 1
                """
                cursor.execute(corr_sql_global, dev_type_params)
                corr_row = cursor.fetchone()

            if corr_row:
                data = dict(corr_row)
                if isinstance(data.get("metadata"), str):
                    try:
                        data["metadata"] = json.loads(data["metadata"])
                    except Exception:
                        pass
                return data

        # Fallback to standard landmark query
        sql = f"SELECT * FROM forensic_events WHERE {action_clause}"
        params = []

        if target_user:
            sql += " AND (LOWER(user) = LOWER(?) OR user LIKE ? OR user = 'SYSTEM')"
            params.extend([target_user, f"%{target_user}%"])

        sql += " ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql, params)

        row = cursor.fetchone()

        if not row and target_user:
            cursor.execute(f"SELECT * FROM forensic_events WHERE {action_clause} ORDER BY timestamp DESC LIMIT 1")
            row = cursor.fetchone()

        if not row:
            return None

        data = dict(row)
        if isinstance(data.get("metadata"), str):
            try:
                data["metadata"] = json.loads(data["metadata"])
            except Exception:
                pass
        return data

    def calculate_bounds(
        self,
        reference_timestamp_str: str,
        relation: str,
        window_minutes: Optional[float] = None
    ) -> tuple[Optional[str], Optional[str], Dict[str, Any]]:
        """
        Computes ISO string lower and upper bounds for the temporal condition.
        Returns (min_iso, max_iso, window_metadata)
        """
        ref_dt = dt_parser.parse(reference_timestamp_str)
        if ref_dt.tzinfo is None:
            ref_dt = ref_dt.replace(tzinfo=timezone.utc)

        min_dt: Optional[datetime] = None
        max_dt: Optional[datetime] = None

        relation_upper = (relation or "").upper()

        if relation_upper == "BEFORE":
            max_dt = ref_dt
            if window_minutes:
                min_dt = ref_dt - timedelta(minutes=window_minutes)

        elif relation_upper == "AFTER":
            min_dt = ref_dt
            if window_minutes:
                max_dt = ref_dt + timedelta(minutes=window_minutes)

        elif relation_upper == "WITHIN":
            if window_minutes:
                min_dt = ref_dt - timedelta(minutes=window_minutes)
                max_dt = ref_dt + timedelta(minutes=window_minutes)
            else:
                max_dt = ref_dt

        min_iso = min_dt.isoformat() if min_dt else None
        max_iso = max_dt.isoformat() if max_dt else None

        window_meta = {
            "reference_timestamp": ref_dt.isoformat(),
            "temporal_relation": relation_upper,
            "window_minutes": window_minutes,
            "range_start": min_iso,
            "range_end": max_iso,
        }

        return min_iso, max_iso, window_meta

    @staticmethod
    def calculate_time_delta(evt_time_str: str, ref_time_str: str) -> Dict[str, Any]:
        """
        Computes the exact delta in seconds and formatted human-readable delta.
        """
        try:
            t_evt = dt_parser.parse(evt_time_str)
            t_ref = dt_parser.parse(ref_time_str)
            delta_seconds = (t_evt - t_ref).total_seconds()
            
            sign = "+" if delta_seconds >= 0 else "-"
            abs_sec = abs(delta_seconds)
            
            if abs_sec < 60:
                human = f"{sign}{int(abs_sec)}s"
            elif abs_sec < 3600:
                mins = int(abs_sec // 60)
                secs = int(abs_sec % 60)
                human = f"{sign}{mins}m {secs}s"
            else:
                hours = int(abs_sec // 3600)
                mins = int((abs_sec % 3600) // 60)
                human = f"{sign}{hours}h {mins}m"

            return {
                "delta_seconds": delta_seconds,
                "human_delta": human,
                "is_before": delta_seconds < 0,
                "is_after": delta_seconds > 0,
            }
        except Exception:
            return {"delta_seconds": 0, "human_delta": "0s", "is_before": False, "is_after": False}

    def correlate_login_sequence(
        self,
        conn: sqlite3.Connection,
        target_user: Optional[str] = None,
        successful_event_id: Optional[str] = None,
        time_window_minutes: float = 5.0
    ) -> Dict[str, Any]:
        """
        Correlates failed login attempts preceding a successful authentication landmark.
        Computes attempt count, intervals between failures, time to success, and total window.
        Produces standardized forensic classification and narrative explainability.
        """
        cursor = conn.cursor()
        success_event = None

        if successful_event_id:
            cursor.execute("SELECT * FROM forensic_events WHERE event_id = ?", (successful_event_id,))
            r = cursor.fetchone()
            if r:
                success_event = dict(r)

        if not success_event:
            user_clause = "AND (user = ? OR user = 'SYSTEM')" if target_user else ""
            params = [target_user] if target_user else []
            cursor.execute(
                f"SELECT * FROM forensic_events WHERE action = 'SUCCESSFUL_LOGIN' {user_clause} ORDER BY timestamp DESC LIMIT 1",
                params
            )
            r = cursor.fetchone()
            if r:
                success_event = dict(r)

        if not success_event:
            return {
                "success": False,
                "message": "No successful login landmark found for correlation.",
                "number_of_failed_attempts": 0,
                "time_between_attempts": [],
                "time_to_success": 0.0,
                "total_investigation_window": 0.0,
                "forensic_classification": "Authentication activity requiring investigation",
                "narrative": "No correlated login sequence identified."
            }

        ref_ts = success_event["timestamp"]
        ref_dt = dt_parser.parse(ref_ts)
        min_dt = ref_dt - timedelta(minutes=time_window_minutes)

        usr = success_event["user"] if not target_user else target_user
        cursor.execute(
            """
            SELECT * FROM forensic_events
            WHERE action = 'FAILED_LOGIN'
              AND (user = ? OR user = 'SYSTEM' OR user = 'Current_User')
              AND timestamp >= ? AND timestamp <= ?
            ORDER BY timestamp ASC
            """,
            (usr, min_dt.isoformat(), ref_ts)
        )
        failed_rows = [dict(r) for r in cursor.fetchall()]

        number_of_failed = len(failed_rows)
        time_between = []
        time_to_success = 0.0
        total_window = 0.0

        if number_of_failed > 0:
            parsed_dts = [dt_parser.parse(ev["timestamp"]) for ev in failed_rows]
            for i in range(1, len(parsed_dts)):
                diff = (parsed_dts[i] - parsed_dts[i-1]).total_seconds()
                time_between.append(round(abs(diff), 2))

            time_to_success = round(abs((ref_dt - parsed_dts[-1]).total_seconds()), 2)
            total_window = round(abs((ref_dt - parsed_dts[0]).total_seconds()), 2)

        words_map = {
            1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five",
            6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten"
        }
        count_word = words_map.get(number_of_failed, str(number_of_failed))

        is_windows = any("Windows" in (ev.get("source") or "") or ev.get("dataset_label") == "WINDOWS_HOST_TELEMETRY" for ev in failed_rows)
        source_label = "Windows " if is_windows else ""

        if number_of_failed > 0:
            window_sec = int(total_window) if total_window >= 1 else 1
            narrative = f"{count_word} failed {source_label}login events occurred within {window_sec} seconds before the successful login event."
        else:
            narrative = "No failed login attempts detected in the specified temporal window before successful authentication."

        return {
            "success": True,
            "target_user": usr,
            "landmark_event_id": success_event["event_id"],
            "landmark_timestamp": ref_ts,
            "number_of_failed_attempts": number_of_failed,
            "time_between_attempts": time_between,
            "inter_attempt_deltas": time_between,
            "time_to_success": time_to_success,
            "total_investigation_window": total_window,
            "forensic_classification": "Authentication activity requiring investigation",
            "narrative": narrative,
            "failed_events": failed_rows
        }

