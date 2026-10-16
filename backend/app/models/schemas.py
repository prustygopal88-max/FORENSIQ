from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ForensicEventSchema(BaseModel):
    event_id: str
    timestamp: str
    event_type: str
    user: str
    machine: str
    source: str
    action: str
    status: str
    device: Optional[str] = None
    file: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    dataset_label: str = "Live Authentication"
    destination: Optional[str] = None
    device_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    drive_letter: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_sensitivity: Optional[str] = None
    email_service: Optional[str] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    recipient_type: Optional[str] = None
    recipient_domain: Optional[str] = None
    process: Optional[str] = None
    scenario_type: Optional[str] = None
    is_suspicious: Optional[int] = 0
    description: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    machine: Optional[str] = "FORENSIQ-PC"

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "investigator"

class QueryRequest(BaseModel):
    query: str
    user_context: Optional[str] = None

class NLPInterpretation(BaseModel):
    intent: str
    event_type: str
    action: Optional[str] = None
    status: Optional[str] = None
    target_user: Optional[str] = None
    temporal_relation: Optional[str] = None  # BEFORE, AFTER, WITHIN, BETWEEN, ALL
    reference_event: Optional[str] = None
    time_window_minutes: Optional[float] = None
    device: Optional[str] = None
    device_type: Optional[str] = None
    file: Optional[str] = None
    file_sensitivity: Optional[str] = None
    email_service: Optional[str] = None
    recipient_type: Optional[str] = None
    source_filter: Optional[str] = None
    explanation_summary: str


class StructuredForensicQuery(BaseModel):
    intent: str
    event_type: str
    action: Optional[str] = None
    status: Optional[str] = None
    user: Optional[str] = None
    temporal_relation: Optional[str] = None
    reference_event: Optional[str] = None
    time_window_minutes: Optional[float] = None
    device_filter: Optional[str] = None
    device_type_filter: Optional[str] = None
    file_filter: Optional[str] = None
    file_sensitivity_filter: Optional[str] = None
    email_service_filter: Optional[str] = None
    recipient_type_filter: Optional[str] = None
    source_filter: Optional[str] = None
    scenario_type_filter: Optional[str] = None
    is_suspicious_filter: Optional[int] = None

class ExplainabilityStep(BaseModel):
    criterion: str
    passed: bool
    details: str

class EventExplainability(BaseModel):
    event_id: str
    timestamp: str
    summary: str
    steps: List[ExplainabilityStep]

class InvestigationResponse(BaseModel):
    query: str
    interpretation: NLPInterpretation
    structured_query: Dict[str, Any]
    reference_event_found: Optional[Dict[str, Any]] = None
    temporal_window: Optional[Dict[str, Any]] = None
    evidence_count: int
    evidence: List[Dict[str, Any]]
    explainability: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    execution_time_ms: float

class CaseCreate(BaseModel):
    title: str
    description: str
    assigned_investigator: Optional[str] = "Gopal"

class CaseResponse(BaseModel):
    case_id: str
    title: str
    description: str
    status: str
    created_date: str
    evidence_count: int
    assigned_investigator: str

class DashboardStats(BaseModel):
    total_events: int
    authentication_events: int
    file_events: int
    usb_events: int
    system_events: int
    email_events: int = 0
    network_events: int = 0
    host_telemetry_events: int = 0
    suspicious_events: int = 0
    active_cases: int
    queries_executed: int
    recent_events: List[Dict[str, Any]]
    recent_investigations: List[Dict[str, Any]]
    event_distribution: Dict[str, int]

class DeviceTelemetry(BaseModel):
    drive_letter: str
    device_type: str
    manufacturer: str
    model: str
    serial_number: str
    total_size_mb: Optional[int] = None
    free_size_mb: Optional[int] = None
    volume_label: Optional[str] = None
    connected_at: Optional[str] = None
    is_active: bool = True

class AgentStatus(BaseModel):
    is_running: bool
    started_at: Optional[str] = None
    monitored_drives: List[str] = []
    events_captured_count: int = 0
    connected_devices: List[Dict[str, Any]] = []
    last_event_time: Optional[str] = None
    login_telemetry_active: bool = True
    usb_telemetry_active: bool = True
    security_log_accessible: bool = False
    security_log_permission_status: str = "ELEVATION_REQUIRED"
    recent_login_telemetry: List[Dict[str, Any]] = []

class AgentActionResponse(BaseModel):
    status: str
    message: str
    active: bool

class EmailSimulationRequest(BaseModel):
    scenario: str = "confidential_leak"  # confidential_leak, customer_pii_exfil, code_repo_leak, routine_report
    user: Optional[str] = "Gopal"
    email_service: Optional[str] = "OUTLOOK"  # GMAIL, OUTLOOK, CORPORATE_MAIL
    recipient: Optional[str] = None
    file_name: Optional[str] = None
    file_sensitivity: Optional[str] = "CONFIDENTIAL"

class LoginTelemetryTriggerRequest(BaseModel):
    event_id: int = 4625  # 4624 (SUCCESS) or 4625 (FAILED)
    user: Optional[str] = "Gopal"
    machine: Optional[str] = None
    logon_type: int = 2  # 2: Interactive, 3: Network, 10: RemoteDesktop
    source_address: str = "127.0.0.1"
    auth_package: str = "Negotiate"
    process: str = "C:\\Windows\\System32\\winlogon.exe"

class LoginSequenceSimulationRequest(BaseModel):
    user: Optional[str] = "Gopal"
    failed_attempts_count: int = 3
    interval_seconds: int = 15
    machine: Optional[str] = "FORENSIQ-PC"

class SingleLoginFailedRequest(BaseModel):
    user: Optional[str] = "Gopal"
    machine: Optional[str] = "FORENSIQ-PC"
    reason: Optional[str] = "Bad credentials"

class SingleLoginSuccessRequest(BaseModel):
    user: Optional[str] = "Gopal"
    machine: Optional[str] = "FORENSIQ-PC"

