from fastapi import APIRouter, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.database.db import record_forensic_event, get_connection

router = APIRouter(prefix="/simulate", tags=["USB & File Simulation"])

@router.post("/usb-connect")
def simulate_usb_connect(
    device_id: str = "USB-001",
    device_name: str = "SanDisk Ultra USB 3.0",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="usb",
        action="USB_CONNECTED",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="USB Hub Driver",
        device=f"{device_name} ({device_id})",
        metadata={
            "vendor_id": "0x0781",
            "product_id": "0x5581",
            "serial_number": "4C530001221012112345",
            "mount_point": "E:\\",
            "capacity_gb": 64
        },
        dataset_label="Simulated Forensic Source"
    )
    return {"success": True, "event": event, "message": f"Simulated {device_id} connection event recorded."}

@router.post("/file-access")
def simulate_file_access(
    filename: str = "Financial_Report.xlsx",
    path: str = "C:\\Users\\Gopal\\Documents\\Financial_Report.xlsx",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="file",
        action="FILE_ACCESS",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="File System Monitor",
        file=filename,
        metadata={
            "full_path": path,
            "access_type": "READ",
            "process_name": "excel.exe",
            "file_size_kb": 2450
        },
        dataset_label="Simulated Forensic Source"
    )
    return {"success": True, "event": event, "message": f"Simulated access of {filename} recorded."}

@router.post("/file-copy")
def simulate_file_copy(
    filename: str = "Financial_Report.xlsx",
    destination_device: str = "USB-001",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="file",
        action="FILE_COPY",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="File System Monitor",
        device=destination_device,
        file=filename,
        metadata={
            "source_path": f"C:\\Users\\{user}\\Documents\\{filename}",
            "dest_path": f"E:\\{filename}",
            "destination_device": destination_device,
            "bytes_transferred": 2508800,
            "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        dataset_label="Simulated Forensic Source"
    )
@router.post("/file-modify")
def simulate_file_modify(
    filename: str = "Financial_Report.xlsx",
    destination_device: str = "USB-001",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="file",
        action="FILE_MODIFIED",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="File System Monitor",
        device=destination_device,
        file=filename,
        file_path=f"E:\\{filename}",
        file_size=2512000,
        drive_letter="E:",
        destination=f"E:\\{filename}",
        metadata={
            "mount_point": "E:\\",
            "operation": "EDIT / UPDATE",
            "destination_device": destination_device,
            "bytes_written": 3200
        },
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"File '{filename}' modified on removable drive E:"
    )
    return {"success": True, "event": event, "message": f"Simulated file modification of {filename} recorded."}

@router.post("/file-delete")
def simulate_file_delete(
    filename: str = "Financial_Report.xlsx",
    destination_device: str = "USB-001",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="file",
        action="FILE_DELETED",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="File System Monitor",
        device=destination_device,
        file=filename,
        file_path=f"E:\\{filename}",
        file_size=0,
        drive_letter="E:",
        destination=f"E:\\{filename}",
        scenario_type="USB_DATA_EXFILTRATION",
        is_suspicious=1,
        metadata={
            "mount_point": "E:\\",
            "operation": "DELETE",
            "destination_device": destination_device
        },
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"File '{filename}' deleted from removable drive E:"
    )
    return {"success": True, "event": event, "message": f"Simulated file deletion of {filename} recorded."}

@router.post("/usb-remove")
def simulate_usb_remove(
    device_id: str = "USB-001",
    device_name: str = "SanDisk Ultra USB 3.0",
    user: str = "Gopal"
):
    event = record_forensic_event(
        event_type="usb",
        action="USB_REMOVED",
        status="SUCCESS",
        user=user,
        machine="FORENSIQ-PC",
        source="USB Hub Driver",
        device=f"{device_name} ({device_id})",
        metadata={
            "unmount_type": "Sudden / Surprise Removal",
            "mount_point": "E:\\"
        },
        dataset_label="Simulated Forensic Source"
    )
    return {"success": True, "event": event, "message": f"Simulated {device_id} removal event recorded."}

@router.post("/sequence")
def simulate_full_sequence(user: str = "Gopal", filename: str = "Financial_Report.xlsx"):
    """
    Executes a complete 4-step sequence with slight timestamp progression for instant 1-click testing.
    """
    now = datetime.now(timezone.utc)
    t1 = (now - timedelta(minutes=4)).isoformat()
    t2 = (now - timedelta(minutes=3)).isoformat()
    t3 = (now - timedelta(minutes=2)).isoformat()
    t4 = (now - timedelta(minutes=1)).isoformat()

    e1 = record_forensic_event(
        event_type="usb", action="USB_CONNECTED", status="SUCCESS", user=user, machine="FORENSIQ-PC",
        source="USB Hub Driver", device="SanDisk Ultra USB 3.0 (USB-001)", timestamp=t1,
        metadata={"mount_point": "E:\\", "capacity_gb": 64}, dataset_label="Simulated Forensic Source"
    )
    e2 = record_forensic_event(
        event_type="file", action="FILE_ACCESS", status="SUCCESS", user=user, machine="FORENSIQ-PC",
        source="File System Monitor", file=filename, timestamp=t2,
        metadata={"full_path": f"C:\\Users\\{user}\\Documents\\{filename}", "process_name": "excel.exe"},
        dataset_label="Simulated Forensic Source"
    )
    e3 = record_forensic_event(
        event_type="file", action="FILE_COPY", status="SUCCESS", user=user, machine="FORENSIQ-PC",
        source="File System Monitor", device="USB-001", file=filename, timestamp=t3,
        metadata={"source_path": f"C:\\Users\\{user}\\Documents\\{filename}", "dest_path": f"E:\\{filename}"},
        dataset_label="Simulated Forensic Source"
    )
    e4 = record_forensic_event(
        event_type="usb", action="USB_REMOVED", status="SUCCESS", user=user, machine="FORENSIQ-PC",
        source="USB Hub Driver", device="SanDisk Ultra USB 3.0 (USB-001)", timestamp=t4,
        metadata={"unmount_type": "Sudden Removal"}, dataset_label="Simulated Forensic Source"
    )

    return {
        "success": True,
        "message": "Full simulated USB incident sequence generated.",
        "events": [e1, e2, e3, e4]
    }

@router.post("/login-sequence")
async def simulate_login_sequence(
    request: Request,
    user: Optional[str] = None,
    failed_attempts_count: Optional[int] = None,
    interval_seconds: Optional[int] = None,
    machine: Optional[str] = None
):
    """
    Generates a realistic multiple failed login attack sequence followed by a successful login.
    Supports JSON body and URL query parameters.
    Provenance: 'SIMULATED_FORENSIC_EVENT'.
    """
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    target_user = body.get("user") or user or "Gopal"
    target_count = int(body.get("failed_attempts_count") or body.get("failed_attempts") or failed_attempts_count or 3)
    target_interval = int(body.get("interval_seconds") or body.get("time_delta_seconds") or interval_seconds or 15)
    target_machine = body.get("machine") or machine or "FORENSIQ-PC"

    now = datetime.now(timezone.utc)
    events = []

    # Generate failed attempts
    for i in range(target_count):
        offset = (target_count - i) * target_interval
        t_fail = (now - timedelta(seconds=offset)).isoformat()
        evt = record_forensic_event(
            event_type="authentication",
            action="FAILED_LOGIN",
            status="FAILED",
            user=target_user,
            machine=target_machine,
            source="Simulated Authentication Service",
            timestamp=t_fail,
            scenario_type="MULTIPLE_FAILED_LOGIN",
            is_suspicious=1,
            dataset_label="SIMULATED_FORENSIC_EVENT",
            description=f"Simulated failed login attempt {i+1} of {target_count} for user '{target_user}'",
            metadata={
                "attempt_index": i + 1,
                "total_attempts": target_count,
                "failure_reason": "Invalid credential hash",
                "client_ip": "192.168.1.105",
                "auth_method": "Password",
                "simulation": True
            }
        )
        events.append(evt)

    # Generate subsequent successful login
    t_success = now.isoformat()
    success_evt = record_forensic_event(
        event_type="authentication",
        action="SUCCESSFUL_LOGIN",
        status="SUCCESS",
        user=target_user,
        machine=target_machine,
        source="Simulated Authentication Service",
        timestamp=t_success,
        scenario_type="MULTIPLE_FAILED_LOGIN",
        is_suspicious=0,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"Simulated successful login for user '{target_user}' following {target_count} failed attempts",
        metadata={
            "previous_failures": target_count,
            "session_token": f"sim-token-{int(now.timestamp())}",
            "client_ip": "192.168.1.105",
            "auth_method": "Password",
            "simulation": True
        }
    )
    events.append(success_evt)

    return {
        "success": True,
        "message": f"Generated simulated login sequence: {target_count} FAILED_LOGIN + 1 SUCCESSFUL_LOGIN for user '{target_user}'",
        "failed_attempts": target_count,
        "total_window_seconds": target_count * target_interval,
        "events": events
    }

@router.post("/login-failed")
async def simulate_single_login_failed(
    request: Request,
    user: Optional[str] = None,
    machine: Optional[str] = None,
    reason: Optional[str] = None
):
    """Generates an individual simulated failed login event. Supports JSON body and query parameters."""
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    target_user = body.get("user") or user or "Gopal"
    target_machine = body.get("machine") or machine or "FORENSIQ-PC"
    target_reason = body.get("reason") or reason or "Bad credentials"

    evt = record_forensic_event(
        event_type="authentication",
        action="FAILED_LOGIN",
        status="FAILED",
        user=target_user,
        machine=target_machine,
        source="Simulated Authentication Service",
        scenario_type="MULTIPLE_FAILED_LOGIN",
        is_suspicious=1,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"Simulated failed login for user '{target_user}' ({target_reason})",
        metadata={"failure_reason": target_reason, "client_ip": "192.168.1.105", "simulation": True}
    )
    return {"success": True, "event": evt, "message": f"Simulated failed login recorded for {target_user}."}

@router.post("/login-success")
async def simulate_single_login_success(
    request: Request,
    user: Optional[str] = None,
    machine: Optional[str] = None
):
    """Generates an individual simulated successful login event. Supports JSON body and query parameters."""
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    target_user = body.get("user") or user or "Gopal"
    target_machine = body.get("machine") or machine or "FORENSIQ-PC"

    evt = record_forensic_event(
        event_type="authentication",
        action="SUCCESSFUL_LOGIN",
        status="SUCCESS",
        user=target_user,
        machine=target_machine,
        source="Simulated Authentication Service",
        scenario_type="NORMAL_AUTHENTICATION",
        is_suspicious=0,
        dataset_label="SIMULATED_FORENSIC_EVENT",
        description=f"Simulated successful login for user '{target_user}'",
        metadata={"client_ip": "192.168.1.105", "auth_method": "Password", "simulation": True}
    )
    return {"success": True, "event": evt, "message": f"Simulated successful login recorded for {target_user}."}

