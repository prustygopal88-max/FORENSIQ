import re
from typing import Optional, Dict, Any, Tuple
from app.models.schemas import NLPInterpretation, StructuredForensicQuery

class ForensicNLPParser:
    """
    Deterministic rule-based NLP engine for digital forensic queries.
    Parses natural language investigator questions into structured forensic query parameters.
    Supports endpoint telemetry, USB/removable drives, file copying, and email exfiltration.
    """

    def parse(self, query: str, default_user: Optional[str] = None) -> Tuple[NLPInterpretation, StructuredForensicQuery]:
        text = query.strip()
        lower = text.lower()

        # ---------------------------------------------------------
        # 1. Temporal Relation Extraction
        # ---------------------------------------------------------
        temporal_relation: Optional[str] = None
        if re.search(r'\b(before|prior to|preceding|preceded|ahead of)\b', lower):
            temporal_relation = "BEFORE"
        elif re.search(r'\b(after|following|subsequent to|post)\b', lower):
            temporal_relation = "AFTER"
        elif re.search(r'\b(between)\b', lower):
            temporal_relation = "BETWEEN"
        elif re.search(r'\b(within|in the last)\b', lower):
            if "before" in lower or "prior" in lower:
                temporal_relation = "BEFORE"
            elif "after" in lower or "following" in lower:
                temporal_relation = "AFTER"
            else:
                temporal_relation = "WITHIN"

        # ---------------------------------------------------------
        # 2. Time Window Extraction (e.g. "within 5 minutes", "within 10 mins")
        # ---------------------------------------------------------
        time_window_minutes: Optional[float] = None
        window_match = re.search(r'\b(?:within|in)\s+(\d+(?:\.\d+)?)\s*(minutes?|mins?|seconds?|secs?|hours?|hrs?)\b', lower)
        if window_match:
            val = float(window_match.group(1))
            unit = window_match.group(2)
            if "sec" in unit:
                time_window_minutes = round(val / 60.0, 3)
            elif "hour" in unit or "hr" in unit:
                time_window_minutes = val * 60.0
            else:
                time_window_minutes = val

        # ---------------------------------------------------------
        # 3. User Extraction
        # ---------------------------------------------------------
        target_user: Optional[str] = None
        user_explicit = False
        user_match = re.search(r'\b(?:for\s+user|user|investigator|account|by|for)\s+([a-zA-Z0-9_\-@\.]+)\b', lower)
        if user_match:
            extracted = user_match.group(1).strip()
            # Ignore common stop words
            stop_words = {
                "the", "a", "an", "failed", "successful", "all", "any", "usb",
                "login", "logins", "investigation", "external", "email", "emails", "sensitive",
                "files", "file", "access", "connection", "device", "pendrive", "storage",
                "windows", "system", "authentication", "repeated", "recent", "me"
            }
            if extracted not in stop_words and not extracted.endswith((".docx", ".xlsx", ".pdf", ".sql", ".zip", ".csv")):
                target_user = extracted
                user_explicit = True


        # ---------------------------------------------------------
        # 4. Reference Event Extraction (Landmarks for temporal constraints)
        # ---------------------------------------------------------
        reference_event: Optional[str] = None
        if temporal_relation:
            if re.search(r'\b(successful(?:\s+\w+)?\s+logins?|successful authentication|success login|logged in successfully|successful log in)\b', lower):
                reference_event = "successful_login"
            elif re.search(r'\b(failed(?:\s+\w+)?\s+logins?|failed attempts?|failed authentication)\b', lower):
                reference_event = "failed_login"
            elif re.search(r'\b(external hard drive.*connected|external drive.*connected|external ssd.*connected|hdd.*connected)\b', lower):
                reference_event = "external_drive_connected"
            elif re.search(r'\b(usb.*connected|pendrive.*connected|pen drive.*connected|flash drive.*connected|it was connected|was connected|plugged in|device was connected|insertion)\b', lower):
                reference_event = "usb_connected"
            elif re.search(r'\b(usb.*removed|pendrive.*removed|unplugged|disconnected|removal)\b', lower):
                reference_event = "usb_removed"
            elif re.search(r'\b(after access|after.*accessed|sensitive file was accessed|file was accessed)\b', lower):
                reference_event = "sensitive_file_access"
            elif re.search(r'\b(file was copied|files were copied|copied to usb)\b', lower):
                reference_event = "file_copy"
            elif re.search(r'\b(attached to email|file was attached)\b', lower):
                reference_event = "file_attached_to_email"
            elif re.search(r'\b(email was sent|sent email)\b', lower):
                reference_event = "email_sent"


        # ---------------------------------------------------------
        # 5. Target Event, Intent, and Filter Attributes Extraction
        # ---------------------------------------------------------
        intent = "general_investigation"
        event_type = "all"
        action: Optional[str] = None
        status: Optional[str] = None
        device: Optional[str] = None
        device_type_filter: Optional[str] = None
        file_target: Optional[str] = None
        file_sensitivity_filter: Optional[str] = None
        email_service_filter: Optional[str] = None
        recipient_type_filter: Optional[str] = None
        is_suspicious_filter: Optional[int] = None
        scenario_type_filter: Optional[str] = None
        source_filter: Optional[str] = None


        if "windows" in lower:
            source_filter = "Windows"

        # Check sensitivity keywords
        if re.search(r'\b(confidential)\b', lower):
            file_sensitivity_filter = "CONFIDENTIAL"
        elif re.search(r'\b(restricted)\b', lower):
            file_sensitivity_filter = "RESTRICTED"
        elif re.search(r'\b(sensitive)\b', lower):
            file_sensitivity_filter = "SENSITIVE"  # Matches CONFIDENTIAL or RESTRICTED

        # Check email service keywords
        if "gmail" in lower:
            email_service_filter = "GMAIL"
        elif "outlook" in lower:
            email_service_filter = "OUTLOOK"

        # Check recipient keywords (specifically for email / messaging boundaries)
        if re.search(r'\b(external recipients?|external domain|external email|external mail)\b', lower):
            recipient_type_filter = "EXTERNAL"
        elif re.search(r'\b(internal recipients?|internal domain|internal email|internal mail)\b', lower):
            recipient_type_filter = "INTERNAL"

        # Check device type keywords
        if re.search(r'\b(external hard drive|external hdd|hdd)\b', lower):
            device_type_filter = "EXTERNAL_HDD"
        elif re.search(r'\b(external ssd|ssd)\b', lower):
            device_type_filter = "EXTERNAL_SSD"
        elif re.search(r'\b(pendrive|pen drive|flash drive|thumb drive|usb flash)\b', lower):
            device_type_filter = "USB_FLASH_DRIVE"

        # --- A. EMAIL INVESTIGATION & EXFILTRATION ---
        if re.search(r'\b(email.*exfiltration|emailed|sent email|emails? sent|attached to email|email exfiltration)\b', lower):
            intent = "email_investigation"
            event_type = "email"
            if "attached" in lower:
                action = "FILE_ATTACHED_TO_EMAIL"
            elif "sent" in lower or "emailed" in lower:
                action = "EMAIL_SENT"
            status = "SUCCESS"

            if "external" in lower:
                recipient_type_filter = "EXTERNAL"
                is_suspicious_filter = 1

            if "sensitive" in lower or "confidential" in lower or "restricted" in lower:
                is_suspicious_filter = 1

        # --- B. EXTERNAL HARD DRIVE / BULK STORAGE INVESTIGATION ---
        elif re.search(r'\b(external hard drive|external hdd|external ssd|external drive)\b', lower) and re.search(r'\b(copied|transferred|files?|written)\b', lower):
            intent = "external_drive_investigation"
            event_type = "file"
            action = "FILE_COPIED_TO_REMOVABLE_DEVICE"
            status = "SUCCESS"
            device = "EXTERNAL"
            scenario_type_filter = "EXTERNAL_DRIVE_DATA_EXFILTRATION"
            if not reference_event and "connect" in lower:
                reference_event = "external_drive_connected"
                if not temporal_relation:
                    temporal_relation = "AFTER"

        # --- C. USB / PENDRIVE / REMOVABLE MEDIA INVESTIGATION ---
        elif re.search(r'\b(files?.*(?:copied|transferred).*(?:usb|pendrive|flash|removable)|copied to (?:usb|pendrive|flash|removable)|transferred to (?:usb|pendrive|removable)|what files were copied)\b', lower):
            intent = "usb_investigation"
            event_type = "file"
            action = "FILE_COPIED_TO_REMOVABLE_DEVICE"
            status = "SUCCESS"
            device = "USB"
            if not reference_event and ("connect" in lower or "plug" in lower):
                reference_event = "usb_connected"
                if not temporal_relation:
                    temporal_relation = "AFTER"

        elif re.search(r'\b(files?.*(?:edited|modified|changed).*(?:usb|pendrive|flash|removable)|edited on (?:usb|pendrive|flash|removable)|modified on (?:usb|pendrive|flash|removable)|what files were edited|what files were modified)\b', lower):
            intent = "usb_investigation"
            event_type = "file"
            action = "FILE_MODIFIED"
            status = "SUCCESS"
            device = "USB"
            if not reference_event and ("connect" in lower or "plug" in lower):
                reference_event = "usb_connected"
                if not temporal_relation:
                    temporal_relation = "AFTER"

        elif re.search(r'\b(files?.*(?:deleted|removed).*(?:usb|pendrive|flash|removable)|deleted from (?:usb|pendrive|flash|removable)|what files were deleted)\b', lower):
            intent = "usb_investigation"
            event_type = "file"
            action = "FILE_DELETED"
            device = "USB"
            if not reference_event and ("connect" in lower or "plug" in lower):
                reference_event = "usb_connected"
                if not temporal_relation:
                    temporal_relation = "AFTER"

        elif re.search(r'\b(file activity.*(?:usb|pendrive|flash|removable)|files?.*(?:copied|edited|deleted).*(?:usb|pendrive|removable)|all file activity|file events on usb)\b', lower):
            intent = "usb_investigation"
            event_type = "file"
            action = None
            device = "USB"
            if not reference_event and ("connect" in lower or "plug" in lower):
                reference_event = "usb_connected"
                if not temporal_relation:
                    temporal_relation = "AFTER"

        elif re.search(r'\b(usb.*(connect|remove|insert|detect|unplug)|pendrive.*(connect|remove)|show.*usb|removable.*(connect|remove))\b', lower):
            intent = "usb_investigation"
            event_type = "usb"
            device = "USB"
            if "remove" in lower or "unplug" in lower or "disconnect" in lower:
                action = "USB_REMOVED"
            elif "connect" in lower or "insert" in lower or "plug" in lower:
                action = "USB_CONNECTED"

        # --- D. AUTHENTICATION INVESTIGATION (PRESERVED 100%) ---
        elif re.search(r'\b(failed(?:\s+\w+)?\s+logins?|failed(?:\s+\w+)?\s+attempts?|login failure|authentication failure|wrong password)\b', lower):
            intent = "authentication_investigation"
            event_type = "authentication"
            action = "FAILED_LOGIN"
            status = "FAILED"
            if "repeated" in lower or "multiple" in lower:
                is_suspicious_filter = 1

        elif re.search(r'\b(successful(?:\s+\w+)?\s+logins?|successful(?:\s+\w+)?\s+attempts?|success login|logged in successfully|successful log in)\b', lower) and not temporal_relation:
            intent = "authentication_investigation"
            event_type = "authentication"
            action = "SUCCESSFUL_LOGIN"
            status = "SUCCESS"


        elif re.search(r'\b(authentication timeline|auth timeline|login history|logins|login attempts|login activity|authentication events)\b', lower):
            intent = "authentication_timeline"
            event_type = "authentication"

        # --- E. SENSITIVE FILE ACCESS INVESTIGATION ---
        elif re.search(r'\b(sensitive files?|confidential files?|files? accessed|file access)\b', lower):
            intent = "file_investigation"
            event_type = "file"
            action = "FILE_ACCESS"

        # --- F. GENERAL TIMELINE & FALLBACK ---
        elif re.search(r'\b(what happened|show events|all events|list events|show activity)\b', lower):
            intent = "temporal_timeline"
            event_type = "all"

        # Default fallback refinements
        if ("usb" in lower or "pendrive" in lower) and intent == "general_investigation":
            intent = "usb_investigation"
            device = "USB"
        elif "email" in lower and intent == "general_investigation":
            intent = "email_investigation"
        # Fallback to default_user for authentication queries if no user was explicitly specified
        # Only scope to default user if relative landmark query without system-wide source or repeated filters
        if not target_user and intent == "authentication_investigation" and default_user:
            if reference_event and not source_filter and is_suspicious_filter is None:
                target_user = default_user

        # ---------------------------------------------------------
        # 6. Generate Explainable Natural Language Summary
        # ---------------------------------------------------------
        summary_parts = []
        if intent == "authentication_investigation":
            summary_parts.append("Authentication failure investigation")
        elif intent == "usb_investigation":
            summary_parts.append("Removable storage / USB data movement investigation")
        elif intent == "external_drive_investigation":
            summary_parts.append("External hard drive bulk exfiltration investigation")
        elif intent == "email_investigation":
            summary_parts.append("Email data exfiltration and message dispatch investigation")
        elif intent == "authentication_timeline":
            summary_parts.append("Full authentication audit timeline")
        else:
            summary_parts.append("Forensic event correlation")

        if source_filter:
            summary_parts.append(f"filtered by source '{source_filter}'")

        if is_suspicious_filter == 1:
            summary_parts.append("flagged as suspicious / repeated attempts")

        if file_sensitivity_filter:
            summary_parts.append(f"restricted to {file_sensitivity_filter} assets")

        if recipient_type_filter:
            summary_parts.append(f"dispatched to {recipient_type_filter} recipients")

        if temporal_relation and reference_event:
            rel_str = f"occurring {temporal_relation} reference event '{reference_event}'"
            if time_window_minutes:
                rel_str += f" (within {time_window_minutes} min)"
            summary_parts.append(rel_str)

        if target_user:
            summary_parts.append(f"scoped to user '{target_user}'")

        explanation_summary = ". ".join(summary_parts) + "."

        interpretation = NLPInterpretation(
            intent=intent,
            event_type=event_type,
            action=action,
            status=status,
            target_user=target_user,
            temporal_relation=temporal_relation,
            reference_event=reference_event,
            time_window_minutes=time_window_minutes,
            device=device,
            device_type=device_type_filter,
            file=file_target,
            file_sensitivity=file_sensitivity_filter,
            email_service=email_service_filter,
            recipient_type=recipient_type_filter,
            source_filter=source_filter,
            explanation_summary=explanation_summary
        )

        structured_query = StructuredForensicQuery(
            intent=intent,
            event_type=event_type,
            action=action,
            status=status,
            user=target_user,
            temporal_relation=temporal_relation,
            reference_event=reference_event,
            time_window_minutes=time_window_minutes,
            device_filter=device,
            device_type_filter=device_type_filter,
            file_filter=file_target,
            file_sensitivity_filter=file_sensitivity_filter,
            email_service_filter=email_service_filter,
            recipient_type_filter=recipient_type_filter,
            source_filter=source_filter,
            scenario_type_filter=scenario_type_filter,
            is_suspicious_filter=is_suspicious_filter
        )

        return interpretation, structured_query

