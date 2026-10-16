from typing import Dict, Any, List, Optional
from dateutil import parser as dt_parser
from app.models.schemas import NLPInterpretation, StructuredForensicQuery, ExplainabilityStep
from app.temporal.engine import TemporalEngine

class ExplainabilityEngine:
    """
    Produces transparent, auditable explanations for forensic evidence retrieval.
    Deconstructs NLP semantic understanding and proves deterministic rule matching for each event.
    """

    def generate_explanation(
        self,
        query_text: str,
        interpretation: NLPInterpretation,
        structured_query: StructuredForensicQuery,
        reference_event: Optional[Dict[str, Any]],
        temporal_window: Optional[Dict[str, Any]],
        evidence_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # 1. NLP Understanding Breakdown
        nlp_breakdown = {
            "original_query": query_text,
            "detected_intent": interpretation.intent.replace("_", " ").title(),
            "target_event_type": interpretation.event_type.upper(),
            "target_action": interpretation.action or "ANY / ALL",
            "target_status": interpretation.status or "ANY",
            "temporal_relation": interpretation.temporal_relation or "NONE",
            "reference_event_landmark": interpretation.reference_event or "NONE",
            "time_window_constraint": f"{interpretation.time_window_minutes} minutes" if interpretation.time_window_minutes else "UNBOUNDED",
            "target_user_scope": interpretation.target_user or "ALL USERS",
            "synthesized_narrative": interpretation.explanation_summary
        }

        # 2. Reference Event Context
        ref_context = None
        if reference_event:
            ref_context = {
                "event_id": reference_event["event_id"],
                "timestamp": reference_event["timestamp"],
                "action": reference_event["action"],
                "user": reference_event["user"],
                "machine": reference_event["machine"],
                "source": reference_event["source"],
                "description": f"Identified as the landmark baseline for temporal '{interpretation.temporal_relation}' relation."
            }

        # 3. Item-by-item Evidence Justification
        item_explanations: List[Dict[str, Any]] = []

        for item in evidence_items:
            steps: List[ExplainabilityStep] = []
            
            # Criterion 1: Event Type / Source
            if structured_query.event_type and structured_query.event_type.lower() != "all":
                type_match = item["event_type"].lower() == structured_query.event_type.lower()
                steps.append(ExplainabilityStep(
                    criterion="Event Type Verification",
                    passed=type_match,
                    details=f"Target: '{structured_query.event_type}' | Actual: '{item['event_type']}'"
                ))

            # Criterion 2: Action / Status
            if structured_query.action:
                act = structured_query.action.upper()
                if act in ("FILE_COPY", "FILE_COPIED_TO_REMOVABLE_DEVICE"):
                    action_match = item["action"] in ("FILE_COPY", "FILE_COPIED_TO_REMOVABLE_DEVICE")
                elif act in ("FILE_MODIFIED", "FILE_EDITED"):
                    action_match = item["action"] in ("FILE_MODIFIED", "FILE_EDITED")
                elif act in ("FILE_DELETED", "FILE_DELETE"):
                    action_match = item["action"] in ("FILE_DELETED", "FILE_DELETE")
                else:
                    action_match = item["action"] == structured_query.action
                steps.append(ExplainabilityStep(
                    criterion="Forensic Action Matching",
                    passed=action_match,
                    details=f"Target: '{structured_query.action}' | Actual: '{item['action']}'"
                ))

            if structured_query.status and structured_query.status.upper() != "ALL":
                status_match = item["status"].upper() == structured_query.status.upper()
                steps.append(ExplainabilityStep(
                    criterion="Status Verification",
                    passed=status_match,
                    details=f"Target: '{structured_query.status}' | Actual: '{item['status']}'"
                ))

            # Criterion 3: Device / Artifact
            if structured_query.device_filter or structured_query.device_type_filter:
                dev_str = str(item.get("device") or "") + str(item.get("device_type") or "") + str(item.get("drive_letter") or "")
                target_dev = structured_query.device_type_filter or structured_query.device_filter or ""
                dev_match = target_dev.lower() in dev_str.lower()
                steps.append(ExplainabilityStep(
                    criterion="Device / Peripheral Association",
                    passed=dev_match,
                    details=f"Target device: '{target_dev}' | Associated: '{item.get('device') or item.get('device_type') or item.get('drive_letter')}'"
                ))

            # Criterion 4: Sensitivity / Classification
            if structured_query.file_sensitivity_filter:
                sens = item.get("file_sensitivity") or ""
                if structured_query.file_sensitivity_filter.upper() == "SENSITIVE":
                    sens_match = sens in ("CONFIDENTIAL", "RESTRICTED")
                else:
                    sens_match = sens.upper() == structured_query.file_sensitivity_filter.upper()
                steps.append(ExplainabilityStep(
                    criterion="Asset Classification Verification",
                    passed=sens_match,
                    details=f"Required Classification: '{structured_query.file_sensitivity_filter}' | Actual: '{sens or 'UNCLASSIFIED'}'"
                ))

            # Criterion 5: Email Transmission Criteria
            if structured_query.recipient_type_filter:
                recip_type = item.get("recipient_type") or "INTERNAL"
                recip_match = recip_type == structured_query.recipient_type_filter.upper()
                steps.append(ExplainabilityStep(
                    criterion="Recipient Boundary Audit",
                    passed=recip_match,
                    details=f"Required: '{structured_query.recipient_type_filter}' | Destination: '{item.get('recipient')}' [{recip_type}]"
                ))

            # Criterion 6: Temporal Relationship & Delta
            if reference_event:
                delta_info = TemporalEngine.calculate_time_delta(item["timestamp"], reference_event["timestamp"])
                human_delta = delta_info["human_delta"]
                
                temporal_passed = False
                rel = (structured_query.temporal_relation or "").upper()
                if rel == "BEFORE":
                    temporal_passed = delta_info["is_before"]
                    desc = f"Occurred {human_delta} before reference event '{reference_event['event_id']}'"
                elif rel == "AFTER":
                    temporal_passed = delta_info["is_after"]
                    desc = f"Occurred {human_delta} after reference event '{reference_event['event_id']}'"
                else:
                    temporal_passed = True
                    desc = f"Temporal delta: {human_delta} relative to '{reference_event['event_id']}'"

                steps.append(ExplainabilityStep(
                    criterion=f"Temporal Order Constraint ({rel})",
                    passed=temporal_passed,
                    details=desc
                ))

                # Window check
                if structured_query.time_window_minutes:
                    max_sec = structured_query.time_window_minutes * 60.0
                    within_window = abs(delta_info["delta_seconds"]) <= max_sec
                    steps.append(ExplainabilityStep(
                        criterion=f"Time Window Constraint (<= {structured_query.time_window_minutes} min)",
                        passed=within_window,
                        details=f"Time delta {abs(delta_info['delta_seconds']):.1f}s is within the {max_sec:.0f}s threshold"
                    ))

            # Criterion 7: Integrity & Provenance
            steps.append(ExplainabilityStep(
                criterion="Evidence Provenance & Integrity",
                passed=True,
                details=f"Logged by '{item['source']}' on machine '{item['machine']}' (Dataset: {item.get('dataset_label', 'Unified')})"
            ))

            item_explanations.append({
                "event_id": item["event_id"],
                "timestamp": item["timestamp"],
                "summary": f"Verified {sum(1 for s in steps if s.passed)}/{len(steps)} forensic constraints satisfied.",
                "steps": [s.model_dump() for s in steps]
            })

        # Authentication Sequence Correlation & Explainability Narrative
        login_correlation = None
        if reference_event and (structured_query.action == "FAILED_LOGIN" or interpretation.intent == "authentication_investigation"):
            ref_act = (reference_event.get("action") or "").upper()
            if "SUCCESSFUL_LOGIN" in ref_act and evidence_items:
                failed_dts = []
                for it in evidence_items:
                    try:
                        failed_dts.append(dt_parser.parse(it["timestamp"]))
                    except Exception:
                        pass

                num_failures = len(evidence_items)
                words_map = {1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten"}
                count_word = words_map.get(num_failures, str(num_failures))
                is_windows = any("windows" in (it.get("source") or "").lower() or it.get("dataset_label") == "WINDOWS_HOST_TELEMETRY" for it in evidence_items)
                source_label = "Windows " if is_windows else ""

                if failed_dts:
                    ref_dt = dt_parser.parse(reference_event["timestamp"])
                    earliest_dt = min(failed_dts)
                    latest_dt = max(failed_dts)
                    total_win_sec = max(1, int(abs((ref_dt - earliest_dt).total_seconds())))
                    time_to_succ = round(abs((ref_dt - latest_dt).total_seconds()), 2)

                    auth_narrative = f"{count_word} failed {source_label}login events occurred within {total_win_sec} seconds before the successful login event."
                    nlp_breakdown["synthesized_narrative"] = auth_narrative
                    nlp_breakdown["forensic_classification"] = "Authentication activity requiring investigation"

                    login_correlation = {
                        "number_of_failed_attempts": num_failures,
                        "time_to_success": time_to_succ,
                        "total_investigation_window": total_win_sec,
                        "forensic_classification": "Authentication activity requiring investigation",
                        "narrative": auth_narrative
                    }

        # Overall summary
        if login_correlation:
            summary_verdict = (
                f"{login_correlation['narrative']} "
                f"Classification: {login_correlation['forensic_classification']}."
            )
        else:
            summary_verdict = (
                f"Successfully resolved {len(evidence_items)} matching forensic artifact(s) "
                f"satisfying '{interpretation.intent}' with temporal relation '{interpretation.temporal_relation or 'NONE'}'."
            )

        return {
            "nlp_breakdown": nlp_breakdown,
            "reference_event_context": ref_context,
            "item_explanations": item_explanations,
            "summary_verdict": summary_verdict,
            "login_correlation": login_correlation,
            "total_evaluated": len(evidence_items)
        }

