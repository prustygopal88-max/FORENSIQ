from fastapi import APIRouter
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.agent.host_agent import host_agent
from app.models.schemas import AgentStatus, AgentActionResponse, LoginTelemetryTriggerRequest

router = APIRouter(prefix="/agent", tags=["Windows Host Monitoring Agent"])

class TelemetryTriggerRequest(BaseModel):
    event_type: str = "usb"  # usb or file
    action: str = "USB_CONNECTED"  # USB_CONNECTED, USB_REMOVED, FILE_COPIED_TO_REMOVABLE_DEVICE
    device_model: str = "SanDisk Extreme Pro USB 3.2"
    device_type: str = "USB_FLASH_DRIVE"  # USB_FLASH_DRIVE, EXTERNAL_HDD, EXTERNAL_SSD
    drive_letter: str = "E:"
    file_name: Optional[str] = "Confidential_Product_Roadmap_2026.docx"

@router.get("/status", response_model=AgentStatus)
def get_agent_status():
    """Returns the live state, uptime, monitored drives, and active device count of the host agent."""
    return host_agent.get_status()

@router.post("/start", response_model=AgentActionResponse)
def start_agent():
    """Starts the Windows Host Monitoring Agent background telemetry thread."""
    success = host_agent.start()
    return AgentActionResponse(
        status="ACTIVE" if success else "ERROR",
        message="Windows Host Monitoring Agent is actively monitoring removable drives, file operations, and login telemetry.",
        active=host_agent.is_running
    )

@router.post("/stop", response_model=AgentActionResponse)
def stop_agent():
    """Stops the Windows Host Monitoring Agent background telemetry thread."""
    success = host_agent.stop()
    return AgentActionResponse(
        status="INACTIVE" if success else "ERROR",
        message="Windows Host Monitoring Agent has been stopped.",
        active=host_agent.is_running
    )

@router.get("/devices")
def get_connected_devices():
    """Returns all currently connected removable storage drives detected by Win32/WMI."""
    status = host_agent.get_status()
    # Also do an immediate probe
    live_drives = host_agent.detect_removable_drives()
    devices = list(live_drives.values())
    return {
        "count": len(devices),
        "devices": devices,
        "agent_running": status["is_running"]
    }

@router.post("/trigger-test-telemetry")
def trigger_telemetry(req: TelemetryTriggerRequest):
    """
    Triggers an authorized endpoint telemetry event for automated evaluation, testing,
    and verifying the complete pipeline when physical hardware is not plugged in.
    """
    evt = host_agent.simulate_telemetry_event(
        event_type=req.event_type,
        action=req.action,
        device_model=req.device_model,
        device_type=req.device_type,
        drive_letter=req.drive_letter,
        file_name=req.file_name if req.event_type == "file" else None
    )
    return {
        "success": True,
        "message": f"Generated WINDOWS_HOST_TELEMETRY event: {req.action}",
        "event": evt
    }

@router.post("/trigger-login-telemetry")
def trigger_login_telemetry(req: LoginTelemetryTriggerRequest):
    """
    Triggers an authorized Windows Security Event Log login telemetry event (Event 4624 or 4625)
    normalized into WINDOWS_HOST_TELEMETRY.
    """
    evt = host_agent.simulate_real_windows_login_telemetry(
        event_id=req.event_id,
        user=req.user,
        machine=req.machine,
        logon_type=req.logon_type,
        source_address=req.source_address,
        auth_package=req.auth_package,
        process=req.process
    )
    return {
        "success": True,
        "message": f"Generated WINDOWS_HOST_TELEMETRY event: {evt.get('action') if isinstance(evt, dict) else 'LOGIN_TELEMETRY'}",
        "event": evt
    }

