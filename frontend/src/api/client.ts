import { 
  ForensicEvent, 
  InvestigationResult, 
  CaseItem, 
  DashboardStats, 
  AgentStatus, 
  ConnectedDevice, 
  EmailSimulationRequest,
  LoginTelemetryTriggerRequest,
  LoginSequenceSimulationRequest
} from '../types';

const API_BASE = '/api';


export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function loginUser(username: string, password: string, machine = 'FORENSIQ-PC') {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, machine }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw { status: res.status, detail: data.detail };
  }
  return data;
}

export async function registerDemoUser(username: string, password: string, role = 'investigator') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  return res.json();
}

export async function getDemoUsers() {
  const res = await fetch(`${API_BASE}/auth/users`);
  return res.json();
}

export async function executeInvestigation(query: string, userContext?: string): Promise<InvestigationResult> {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_context: userContext }),
  });
  if (!res.ok) {
    throw new Error(`Investigation failed with status ${res.status}`);
  }
  return res.json();
}

export async function getEvidenceEvents(params?: {
  search?: string;
  event_type?: string;
  source?: string;
  status?: string;
  user?: string;
  dataset_label?: string;
  is_suspicious?: number;
  scenario_type?: string;
  limit?: number;
}): Promise<{ events: ForensicEvent[]; count: number }> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.event_type && params.event_type !== 'ALL') q.append('event_type', params.event_type);
  if (params?.source && params.source !== 'ALL') q.append('source', params.source);
  if (params?.status && params.status !== 'ALL') q.append('status', params.status);
  if (params?.user && params.user !== 'ALL') q.append('user', params.user);
  if (params?.dataset_label && params.dataset_label !== 'ALL') q.append('dataset_label', params.dataset_label);
  if (params?.is_suspicious !== undefined) q.append('is_suspicious', params.is_suspicious.toString());
  if (params?.scenario_type && params.scenario_type !== 'ALL') q.append('scenario_type', params.scenario_type);
  if (params?.limit) q.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/events?${q.toString()}`);
  return res.json();
}

export async function getTimelineEvents(): Promise<{ timeline: ForensicEvent[]; total: number }> {
  const res = await fetch(`${API_BASE}/events/timeline`);
  return res.json();
}

export async function getEventDetail(eventId: string): Promise<ForensicEvent> {
  const res = await fetch(`${API_BASE}/events/${eventId}`);
  return res.json();
}

// Windows Host Monitoring Agent APIs
export async function getAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API_BASE}/agent/status`);
  return res.json();
}

export async function startAgent(): Promise<{ status: string; message: string; active: boolean }> {
  const res = await fetch(`${API_BASE}/agent/start`, { method: 'POST' });
  return res.json();
}

export async function stopAgent(): Promise<{ status: string; message: string; active: boolean }> {
  const res = await fetch(`${API_BASE}/agent/stop`, { method: 'POST' });
  return res.json();
}

export async function getConnectedDevices(): Promise<{ count: number; devices: ConnectedDevice[]; agent_running: boolean }> {
  const res = await fetch(`${API_BASE}/agent/devices`);
  return res.json();
}

export async function triggerTestTelemetry(data: {
  event_type: string;
  action: string;
  device_model?: string;
  device_type?: string;
  drive_letter?: string;
  file_name?: string;
}) {
  const res = await fetch(`${API_BASE}/agent/trigger-test-telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function triggerLoginTelemetry(data: LoginTelemetryTriggerRequest) {
  const res = await fetch(`${API_BASE}/agent/trigger-login-telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function simulateLoginSequence(data?: LoginSequenceSimulationRequest) {
  const params = new URLSearchParams();
  if (data?.user) params.append('user', data.user);
  if (data?.failed_attempts_count) params.append('failed_attempts_count', data.failed_attempts_count.toString());
  if (data?.interval_seconds) params.append('interval_seconds', data.interval_seconds.toString());
  if (data?.machine) params.append('machine', data.machine);

  const res = await fetch(`${API_BASE}/simulate/login-sequence?${params.toString()}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateSingleLoginFailed(user = 'Gopal', reason = 'Bad credentials') {
  const res = await fetch(`${API_BASE}/simulate/login-failed?user=${encodeURIComponent(user)}&reason=${encodeURIComponent(reason)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateSingleLoginSuccess(user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/login-success?user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}


// Email Exfiltration Simulator
export async function simulateEmailSequence(req: EmailSimulationRequest) {
  const res = await fetch(`${API_BASE}/simulate/email/sequence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return res.json();
}

// USB Simulators
export async function simulateUsbConnect(deviceId = 'USB-001', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/usb-connect?device_id=${encodeURIComponent(deviceId)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateFileAccess(filename = 'Financial_Report.xlsx', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/file-access?filename=${encodeURIComponent(filename)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateFileCopy(filename = 'Financial_Report.xlsx', deviceId = 'USB-001', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/file-copy?filename=${encodeURIComponent(filename)}&destination_device=${encodeURIComponent(deviceId)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateFileModify(filename = 'Financial_Report.xlsx', deviceId = 'USB-001', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/file-modify?filename=${encodeURIComponent(filename)}&destination_device=${encodeURIComponent(deviceId)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateFileDelete(filename = 'Financial_Report.xlsx', deviceId = 'USB-001', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/file-delete?filename=${encodeURIComponent(filename)}&destination_device=${encodeURIComponent(deviceId)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateUsbRemove(deviceId = 'USB-001', user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/usb-remove?device_id=${encodeURIComponent(deviceId)}&user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function simulateFullSequence(user = 'Gopal') {
  const res = await fetch(`${API_BASE}/simulate/sequence?user=${encodeURIComponent(user)}`, {
    method: 'POST'
  });
  return res.json();
}

// Cases
export async function getCases(): Promise<CaseItem[]> {
  const res = await fetch(`${API_BASE}/cases`);
  return res.json();
}

export async function createCase(title: string, description: string, investigator = 'Gopal'): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, assigned_investigator: investigator }),
  });
  return res.json();
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  return res.json();
}
