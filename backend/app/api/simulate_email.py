from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.database.db import record_forensic_event
from app.models.schemas import EmailSimulationRequest

router = APIRouter(prefix="/simulate/email", tags=["Email Exfiltration Simulation"])

@router.post("/sequence")
def simulate_email_exfiltration_sequence(req: EmailSimulationRequest):
    """
    Simulates a multi-stage data exfiltration audit sequence via email:
    Stage 1: Sensitive internal document accessed (FILE_ACCESS)
    Stage 2: File attached to email draft (FILE_ATTACHED_TO_EMAIL)
    Stage 3: Email transmitted to external untrusted recipient (EMAIL_SENT)
    
    Safe Simulation: Zero actual emails sent, zero credential access.
    Forensic Telemetry Only.
    """
    now = datetime.now(timezone.utc)
    t1 = (now - timedelta(minutes=4)).isoformat()
    t2 = (now - timedelta(minutes=2)).isoformat()
    t3 = (now - timedelta(minutes=1)).isoformat()

    user = req.user or "Gopal"
    svc = (req.email_service or "OUTLOOK").upper()
    sens = req.file_sensitivity or "CONFIDENTIAL"

    default_files = {
        "confidential_leak": ("Merger_Strategy_Confidential_2026.docx", "RESTRICTED", 4200000),
        "customer_pii_exfil": ("Customer_PII_SSN_Export.csv", "RESTRICTED", 18200000),
        "code_repo_leak": ("Core_Algorithm_Source_Master.zip", "CONFIDENTIAL", 85000000),
        "routine_report": ("Public_Financial_Summary.pdf", "INTERNAL", 520000)
    }

    preset = default_files.get(req.scenario, ("Confidential_Audit_Report.pdf", sens, 3500000))
    file_name = req.file_name or preset[0]
    file_sens = req.file_sensitivity or preset[1]
    file_size = preset[2]

    recipient = req.recipient or "external_leak_drop@proton.me"
    recip_domain = recipient.split("@")[-1] if "@" in recipient else "proton.me"
    sender_mail = f"{user.lower().replace('.', '')}@corp.internal"
    recip_type = "INTERNAL" if recip_domain.endswith("corp.internal") else "EXTERNAL"
    is_susp = 1 if recip_type == "EXTERNAL" or file_sens in ("CONFIDENTIAL", "RESTRICTED") else 0

    # Stage 1: FILE_ACCESS
    e1 = record_forensic_event(
        event_type="file",
        action="FILE_ACCESS",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="Windows File System Monitor",
        file=file_name,
        file_path=f"C:\\Corporate_Assets\\{file_name}",
        file_size=file_size,
        file_sensitivity=file_sens,
        timestamp=t1,
        process="OUTLOOK.EXE" if svc == "OUTLOOK" else "chrome.exe",
        scenario_type="EMAIL_DATA_EXFILTRATION",
        is_suspicious=is_susp,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"File '{file_name}' ({file_sens}) accessed from local disk by {user}",
        metadata={"sensitivity": file_sens, "app": svc, "simulation_scenario": req.scenario}
    )

    # Stage 2: FILE_ATTACHED_TO_EMAIL
    e2 = record_forensic_event(
        event_type="email",
        action="FILE_ATTACHED_TO_EMAIL",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source=f"{svc} Mail Client Monitor",
        file=file_name,
        file_path=f"C:\\Corporate_Assets\\{file_name}",
        file_size=file_size,
        file_sensitivity=file_sens,
        email_service=svc,
        sender=sender_mail,
        recipient=recipient,
        recipient_type=recip_type,
        recipient_domain=recip_domain,
        destination=recipient,
        timestamp=t2,
        process="OUTLOOK.EXE" if svc == "OUTLOOK" else "chrome.exe",
        scenario_type="EMAIL_DATA_EXFILTRATION",
        is_suspicious=is_susp,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"Document '{file_name}' attached to draft email in {svc}",
        metadata={"attachment_size_bytes": file_size, "service": svc}
    )

    # Stage 3: EMAIL_SENT
    e3 = record_forensic_event(
        event_type="email",
        action="EMAIL_SENT",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source=f"{svc} SMTP Transport Engine",
        file=file_name,
        file_size=file_size,
        file_sensitivity=file_sens,
        email_service=svc,
        sender=sender_mail,
        recipient=recipient,
        recipient_type=recip_type,
        recipient_domain=recip_domain,
        destination=recipient,
        timestamp=t3,
        process="OUTLOOK.EXE" if svc == "OUTLOOK" else "chrome.exe",
        scenario_type="EMAIL_DATA_EXFILTRATION",
        is_suspicious=is_susp,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"Email with sensitive attachment '{file_name}' dispatched to {recipient} [{recip_type}]",
        metadata={
            "recipient_domain": recip_domain,
            "has_attachment": True,
            "alert": "EXTERNAL_DATA_EXFILTRATION" if is_susp else "BENIGN_TRANSFER"
        }
    )

    return {
        "success": True,
        "message": f"Successfully simulated 3-stage email exfiltration scenario ({req.scenario}).",
        "events": [e1, e2, e3],
        "scenario_summary": {
            "user": user,
            "service": svc,
            "file": file_name,
            "sensitivity": file_sens,
            "recipient": recipient,
            "is_suspicious": is_susp
        }
    }
