export type EventType = 'authentication' | 'file' | 'usb' | 'system' | 'network' | 'email' | 'all';

export interface ForensicEvent {
  id?: number;
  event_id: string;
  timestamp: string;
  event_type: string;
  user: string;
  machine: string;
  source: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'INFO' | 'WARNING' | string;
  device?: string | null;
  file?: string | null;
  metadata?: Record<string, any>;
  dataset_label: 'Live Authentication' | 'Simulated Forensic Source' | 'Public Dataset' | 'WINDOWS_HOST_TELEMETRY' | 'SYNTHETIC_DATASET' | 'SIMULATED_FORENSIC_EVENT' | string;
  destination?: string | null;
  device_type?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  drive_letter?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_sensitivity?: string | null;
  email_service?: string | null;
  sender?: string | null;
  recipient?: string | null;
  recipient_type?: string | null;
  recipient_domain?: string | null;
  process?: string | null;
  scenario_type?: string | null;
  is_suspicious?: number | null;
  description?: string | null;
}

export interface NLPInterpretation {
  intent: string;
  event_type: string;
  action?: string | null;
  status?: string | null;
  target_user?: string | null;
  temporal_relation?: string | null;
  reference_event?: string | null;
  time_window_minutes?: number | null;
  device?: string | null;
  device_type?: string | null;
  file?: string | null;
  file_sensitivity?: string | null;
  email_service?: string | null;
  recipient_type?: string | null;
  explanation_summary: string;
}

export interface StructuredForensicQuery {
  intent: string;
  event_type: string;
  action?: string | null;
  status?: string | null;
  user?: string | null;
  temporal_relation?: string | null;
  reference_event?: string | null;
  time_window_minutes?: number | null;
  device_filter?: string | null;
  device_type_filter?: string | null;
  file_filter?: string | null;
  file_sensitivity_filter?: string | null;
  email_service_filter?: string | null;
  recipient_type_filter?: string | null;
  source_filter?: string | null;
  scenario_type_filter?: string | null;
  is_suspicious_filter?: number | null;
}

export interface ExplainabilityStep {
  criterion: string;
  passed: boolean;
  details: string;
}

export interface EventExplainabilityItem {
  event_id: string;
  timestamp: string;
  summary: string;
  steps: ExplainabilityStep[];
}

export interface ExplainabilityData {
  nlp_breakdown: {
    original_query: string;
    detected_intent: string;
    target_event_type: string;
    target_action: string;
    target_status: string;
    temporal_relation: string;
    reference_event_landmark: string;
    time_window_constraint: string;
    target_user_scope: string;
    synthesized_narrative: string;
  };
  reference_event_context?: {
    event_id: string;
    timestamp: string;
    action: string;
    user: string;
    machine: string;
    source: string;
    description: string;
  } | null;
  item_explanations: EventExplainabilityItem[];
  summary_verdict: string;
  total_evaluated: number;
}

export interface TimelineItem {
  event_id: string;
  timestamp: string;
  action: string;
  status: string;
  event_type: string;
  user: string;
  machine: string;
  source: string;
  file?: string | null;
  device?: string | null;
  is_landmark: boolean;
  delta_from_landmark: string;
  description: string;
}

export interface InvestigationResult {
  query: string;
  interpretation: NLPInterpretation;
  structured_query: StructuredForensicQuery;
  reference_event_found?: ForensicEvent | null;
  temporal_window?: {
    reference_timestamp: string;
    temporal_relation: string;
    window_minutes?: number | null;
    range_start?: string | null;
    range_end?: string | null;
  } | null;
  evidence_count: number;
  evidence: ForensicEvent[];
  explainability: ExplainabilityData;
  timeline: TimelineItem[];
  execution_time_ms: number;
}

export interface CaseItem {
  case_id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'CLOSED';
  created_date: string;
  evidence_count: number;
  assigned_investigator: string;
}

export interface DashboardStats {
  total_events: number;
  authentication_events: number;
  file_events: number;
  usb_events: number;
  system_events: number;
  email_events?: number;
  network_events?: number;
  host_telemetry_events?: number;
  suspicious_events?: number;
  active_cases: number;
  queries_executed: number;
  recent_events: ForensicEvent[];
  recent_investigations: {
    id: number;
    query_text: string;
    timestamp: string;
    results_count: number;
    structured_query: any;
  }[];
  event_distribution: Record<string, number>;
}

export interface ConnectedDevice {
  drive_letter: string;
  drive_path: string;
  volume_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  device_type: string;
  total_size_mb?: number | null;
  connected_at: string;
  is_active: boolean;
}

export interface AgentStatus {
  is_running: boolean;
  started_at?: string | null;
  monitored_drives: string[];
  events_captured_count: number;
  connected_devices: ConnectedDevice[];
  last_event_time?: string | null;
  login_telemetry_active?: boolean;
  usb_telemetry_active?: boolean;
  security_log_accessible?: boolean;
  security_log_permission_status?: string;
  recent_login_telemetry?: ForensicEvent[];
}

export interface EmailSimulationRequest {
  scenario: 'confidential_leak' | 'customer_pii_exfil' | 'code_repo_leak' | 'routine_report';
  user?: string;
  email_service?: 'OUTLOOK' | 'GMAIL' | 'CORPORATE_MAIL';
  recipient?: string;
  file_name?: string;
  file_sensitivity?: 'CONFIDENTIAL' | 'RESTRICTED' | 'INTERNAL' | 'PUBLIC';
}

export interface LoginTelemetryTriggerRequest {
  event_id: number;
  user?: string;
  logon_type?: number;
  source_address?: string;
  auth_package?: string;
  process?: string;
}

export interface LoginSequenceSimulationRequest {
  user?: string;
  failed_attempts_count?: number;
  interval_seconds?: number;
  machine?: string;
}

