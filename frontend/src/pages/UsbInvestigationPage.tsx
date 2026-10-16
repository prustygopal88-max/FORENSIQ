import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FileText, 
  Copy, 
  Trash2, 
  Play, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Database,
  Laptop,
  Mail,
  Shield,
  Activity,
  Radio,
  Cpu,
  RefreshCw,
  Send,
  Lock,
  KeyRound,
  UserCheck,
  UserX,
  Edit3
} from 'lucide-react';
import { 
  simulateUsbConnect, 
  simulateFileAccess, 
  simulateFileCopy, 
  simulateFileModify,
  simulateFileDelete,
  simulateUsbRemove, 
  simulateFullSequence,
  simulateEmailSequence,
  getEvidenceEvents,
  executeInvestigation,
  getAgentStatus,
  startAgent,
  stopAgent,
  getConnectedDevices,
  triggerTestTelemetry,
  triggerLoginTelemetry,
  simulateLoginSequence
} from '../api/client';
import { ForensicEvent, InvestigationResult, ConnectedDevice, AgentStatus, EmailSimulationRequest } from '../types';
import { EventDetailModal } from '../components/EventDetailModal';


interface UsbInvestigationPageProps {
  currentUser: string | null;
  onNavigateToInvestigate: () => void;
}

export const UsbInvestigationPage: React.FC<UsbInvestigationPageProps> = ({ 
  currentUser,
  onNavigateToInvestigate 
}) => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState('Financial_Report.xlsx');
  const [deviceId, setDeviceId] = useState('USB-001');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ForensicEvent[]>([]);
  const [investigationResult, setInvestigationResult] = useState<InvestigationResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);

  // Agent State
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);

  // Login Telemetry & Simulation State
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);
  const [loginTargetUser, setLoginTargetUser] = useState<string>(currentUser || 'Gopal');

  // Email Simulation State
  const [emailScenario, setEmailScenario] = useState<EmailSimulationRequest['scenario']>('confidential_leak');
  const [emailService, setEmailService] = useState<'OUTLOOK' | 'GMAIL' | 'CORPORATE_MAIL'>('OUTLOOK');
  const [emailRecipient, setEmailRecipient] = useState('external_exfil_drop@proton.me');
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const fetchHostAgentState = async () => {
    try {
      const [status, devicesData] = await Promise.all([
        getAgentStatus(),
        getConnectedDevices()
      ]);
      setAgentStatus(status);
      setConnectedDevices(devicesData.devices || []);
    } catch (err) {
      console.error('Error fetching agent state:', err);
    }
  };

  const fetchUsbAndFileLogs = async () => {
    try {
      const res = await getEvidenceEvents({ limit: 25 });
      const filtered = res.events.filter(e => 
        e.event_type === 'usb' || e.event_type === 'file' || e.event_type === 'email' || e.event_type === 'authentication'
      );
      setLogs(filtered);
      const lastUsb = filtered.find(e => e.event_type === 'usb');
      if (lastUsb && lastUsb.action === 'USB_CONNECTED') {
        setDeviceConnected(true);
      } else if (lastUsb && lastUsb.action === 'USB_REMOVED') {
        setDeviceConnected(false);
      }
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchHostAgentState();
    fetchUsbAndFileLogs();
    const interval = setInterval(() => {
      fetchHostAgentState();
      fetchUsbAndFileLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAgent = async () => {
    setLoading(true);
    try {
      if (agentStatus?.is_running) {
        await stopAgent();
      } else {
        await startAgent();
      }
      await fetchHostAgentState();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTestTelemetry = async () => {
    setLoading(true);
    try {
      await triggerTestTelemetry({
        event_type: 'usb',
        action: 'USB_CONNECTED',
        device_model: 'SanDisk Extreme Pro 3.2',
        device_type: 'USB_FLASH_DRIVE',
        drive_letter: 'E:'
      });
      await fetchUsbAndFileLogs();
      await fetchHostAgentState();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWinLogin = async (eventId: 4624 | 4625) => {
    setLoading(true);
    setLoginFeedback(null);
    try {
      const res = await triggerLoginTelemetry({
        event_id: eventId,
        user: loginTargetUser,
        logon_type: 2,
        source_address: '127.0.0.1 (Local Console)'
      });
      const act = res.event?.action || (eventId === 4625 ? 'FAILED_LOGIN' : 'SUCCESSFUL_LOGIN');
      setLoginFeedback(`Generated Windows Security Event ${eventId} (${act}) for ${loginTargetUser} [WINDOWS_HOST_TELEMETRY]`);
      await fetchUsbAndFileLogs();
      await fetchHostAgentState();
    } catch (err: any) {
      setLoginFeedback('Error triggering Windows login telemetry: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLoginSequence = async () => {
    setLoading(true);
    setLoginFeedback(null);
    try {
      const res = await simulateLoginSequence({
        user: loginTargetUser,
        failed_attempts_count: 3,
        interval_seconds: 15
      });
      setLoginFeedback(`Generated simulated login attack sequence (3 FAILED + 1 SUCCESS) for ${loginTargetUser} [SIMULATED_FORENSIC_EVENT]`);
      await fetchUsbAndFileLogs();
      await fetchHostAgentState();
    } catch (err: any) {
      setLoginFeedback('Error simulating login sequence: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (action: 'connect' | 'access' | 'copy' | 'modify' | 'delete' | 'remove' | 'sequence') => {

    setLoading(true);
    try {
      const user = currentUser || 'Gopal';
      if (action === 'connect') {
        await simulateUsbConnect(deviceId, user);
        setDeviceConnected(true);
      } else if (action === 'access') {
        await simulateFileAccess(selectedFile, user);
      } else if (action === 'copy') {
        await simulateFileCopy(selectedFile, deviceId, user);
      } else if (action === 'modify') {
        await simulateFileModify(selectedFile, deviceId, user);
      } else if (action === 'delete') {
        await simulateFileDelete(selectedFile, deviceId, user);
      } else if (action === 'remove') {
        await simulateUsbRemove(deviceId, user);
        setDeviceConnected(false);
      } else if (action === 'sequence') {
        await simulateFullSequence(user);
        setDeviceConnected(false);
      }
      await fetchUsbAndFileLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateEmail = async () => {
    setLoading(true);
    setEmailFeedback(null);
    try {
      const res = await simulateEmailSequence({
        scenario: emailScenario,
        user: currentUser || 'Gopal',
        email_service: emailService,
        recipient: emailRecipient,
        file_sensitivity: emailScenario === 'routine_report' ? 'INTERNAL' : 'RESTRICTED'
      });
      setEmailFeedback(`Generated 3-stage email exfiltration telemetry (${res.scenario_summary.file} -> ${res.scenario_summary.recipient})`);
      await fetchUsbAndFileLogs();
    } catch (err: any) {
      setEmailFeedback('Simulation error: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async (queryText: string) => {
    setLoading(true);
    try {
      const res = await executeInvestigation(queryText, currentUser || undefined);
      setInvestigationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Windows Endpoint Host Telemetry & Exfiltration Center</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
          Endpoint Telemetry & Exfiltration Forensics
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Monitor live Windows physical removable hardware events, correlate volume file creations with source read activity, and simulate multi-stage email data exfiltration for NLP temporal inquiry.
        </p>
      </div>

      {/* Top Banner: Real-Time Host Monitoring Agent Status */}
      <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1a2334] pb-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Windows Host Monitoring Agent</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  agentStatus?.is_running ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border border-slate-700 text-slate-400'
                }`}>
                  {agentStatus?.is_running ? 'ACTIVE' : 'STOPPED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Native Win32 kernel32 drive detection + Windows Security Event Log login telemetry monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerTestTelemetry}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#141d30] hover:bg-[#1b2742] border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition"
              title="Generates a live WINDOWS_HOST_TELEMETRY event in SQLite"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trigger Test Telemetry</span>
            </button>

            <button
              onClick={handleToggleAgent}
              disabled={loading}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-2 transition ${
                agentStatus?.is_running
                  ? 'bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300'
                  : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300'
              }`}
            >
              <span>{agentStatus?.is_running ? 'Stop Agent' : 'Start Agent'}</span>
            </button>
          </div>
        </div>

        {/* Three Active Host Monitoring Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#080c14] border border-[#1e2a40] flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>HOST MONITORING</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              agentStatus?.is_running ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border border-slate-700 text-slate-400'
            }`}>
              ● {agentStatus?.is_running ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#080c14] border border-[#1e2a40] flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>LOGIN TELEMETRY</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              ● {agentStatus?.login_telemetry_active !== false ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#080c14] border border-[#1e2a40] flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>USB TELEMETRY</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              ● {agentStatus?.usb_telemetry_active !== false ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Windows Security Event Log Permission Callout */}
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-3 ${
          agentStatus?.security_log_accessible 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}>
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <strong className="text-white">Windows Security Event Log Permission:</strong>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                agentStatus?.security_log_accessible 
                  ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/30' 
                  : 'bg-amber-900/80 text-amber-200 border border-amber-400/30'
              }`}>
                {agentStatus?.security_log_permission_status || 'ELEVATION_REQUIRED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {agentStatus?.security_log_accessible 
                ? 'Direct kernel access to Windows Security Event Log (Event IDs 4624 & 4625) is GRANTED. Live host logons stream directly into WINDOWS_HOST_TELEMETRY.'
                : 'Direct kernel access to Security Log requires Administrator elevation or Event Log Readers group membership. Forensic normalization and authorized test telemetry are active.'
              }
            </p>
          </div>
        </div>


        {/* Connected Hardware Devices Widget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Detected Physical Removable Media ({connectedDevices.length}):</span>
            <span className="text-[11px] text-slate-500">Auto-refreshed via WMI & kernel32 API</span>
          </div>

          {connectedDevices.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#080c14] border border-[#182338] text-xs font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-500" />
                No physical removable drives currently inserted. The host agent will automatically hook drives when connected.
              </span>
              <span className="text-[11px] text-cyan-400">Ready & Polling</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectedDevices.map((dev) => (
                <div key={dev.drive_letter} className="p-3.5 rounded-lg bg-[#0e1628] border border-cyan-500/30 flex items-center justify-between font-mono text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">{dev.drive_letter}</span>
                      <span className="text-white font-bold">{dev.manufacturer} {dev.model}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 space-x-3">
                      <span>Type: <strong className="text-amber-300">{dev.device_type}</strong></span>
                      <span>S/N: {dev.serial_number || 'N/A'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/30">
                    Live Monitored
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Simulators (Login + USB + Email) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card: Windows Security & Simulated Login Forensics */}
          <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Windows & Simulated Login Forensics
                </h3>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                Security 4624 / 4625
              </span>
            </div>

            <div className="font-mono text-xs space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Account / Subject User:</label>
                <input
                  type="text"
                  value={loginTargetUser}
                  onChange={(e) => setLoginTargetUser(e.target.value)}
                  className="w-full p-2.5 bg-[#080b12] border border-[#23314d] rounded text-white"
                  placeholder="e.g. Gopal, Victim_User, Admin"
                />
              </div>

              {loginFeedback && (
                <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  {loginFeedback}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={loading}
                    onClick={() => handleTriggerWinLogin(4625)}
                    className="p-3 bg-[#18111e] hover:bg-[#22162b] border border-rose-500/40 rounded-lg text-rose-300 font-semibold flex items-center justify-center gap-2 transition"
                    title="Simulates/triggers Windows Security Event 4625 (Logon Failure) [WINDOWS_HOST_TELEMETRY]"
                  >
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Trigger Event 4625 (Failed)</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleTriggerWinLogin(4624)}
                    className="p-3 bg-[#0d1c24] hover:bg-[#132834] border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold flex items-center justify-center gap-2 transition"
                    title="Simulates/triggers Windows Security Event 4624 (Logon Success) [WINDOWS_HOST_TELEMETRY]"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Trigger Event 4624 (Success)</span>
                  </button>
                </div>

                <button
                  disabled={loading}
                  onClick={handleSimulateLoginSequence}
                  className="w-full p-3 bg-gradient-to-r from-purple-950/60 to-cyan-950/60 hover:from-purple-900/60 hover:to-cyan-900/60 border border-purple-500/50 rounded-lg text-purple-200 font-bold flex items-center justify-center gap-2 transition shadow-md"
                  title="Simulates 3 rapid failed login attempts followed by 1 successful login [SIMULATED_FORENSIC_EVENT]"
                >
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Simulate Attack Sequence (3 Failed + 1 Success)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 1: USB Media Simulation */}
          <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Removable Media Exfiltration Simulator
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={`w-2.5 h-2.5 rounded-full ${deviceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className={deviceConnected ? 'text-emerald-400' : 'text-slate-500'}>
                  {deviceConnected ? 'USB-001 Connected' : 'No Device Mounted'}
                </span>
              </div>
            </div>

            {/* Config inputs */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Peripheral ID:</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full p-2.5 bg-[#080b12] border border-[#23314d] rounded text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Suspect File Target:</label>
                <input
                  type="text"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full p-2.5 bg-[#080b12] border border-[#23314d] rounded text-white"
                />
              </div>
            </div>

            {/* Individual Action Buttons */}
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  disabled={loading}
                  onClick={() => handleSimulate('connect')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-cyan-500/40 rounded-lg text-cyan-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>1. USB Connect</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleSimulate('access')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-blue-500/40 rounded-lg text-blue-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>2. File Access</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleSimulate('copy')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>3. File Copy</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleSimulate('modify')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-sky-500/40 rounded-lg text-sky-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>4. File Edit</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleSimulate('delete')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-rose-500/40 rounded-lg text-rose-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>5. File Delete</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleSimulate('remove')}
                  className="p-2.5 bg-[#111728] hover:bg-[#182238] border border-slate-500/40 rounded-lg text-slate-300 font-semibold flex items-center gap-1.5 transition text-[11px]"
                >
                  <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>6. USB Remove</span>
                </button>
              </div>

              {/* 1-Click Complete Sequence */}
              <div className="pt-1">
                <button
                  disabled={loading}
                  onClick={() => handleSimulate('sequence')}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Full 4-Step Incident Sequence (1-Click)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Email Data Exfiltration Simulator (New) */}
          <div className="bg-[#0c111e] p-6 rounded-xl border border-indigo-500/30 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Simulated Email Exfiltration Deck
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                Safe Audit Emulation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Exfiltration Scenario:</label>
                <select
                  value={emailScenario}
                  onChange={(e: any) => setEmailScenario(e.target.value)}
                  className="w-full p-2 bg-[#080b12] border border-[#23314d] rounded text-white"
                >
                  <option value="confidential_leak">Confidential M&A Strategy Leak (RESTRICTED)</option>
                  <option value="customer_pii_exfil">Customer PII / SSN Exfiltration (RESTRICTED)</option>
                  <option value="code_repo_leak">Proprietary Core Algorithm Zip (CONFIDENTIAL)</option>
                  <option value="routine_report">Internal Financial Summary (BENIGN)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Service:</label>
                <select
                  value={emailService}
                  onChange={(e: any) => setEmailService(e.target.value)}
                  className="w-full p-2 bg-[#080b12] border border-[#23314d] rounded text-white"
                >
                  <option value="OUTLOOK">OUTLOOK (Client Hook)</option>
                  <option value="GMAIL">GMAIL (Web Session)</option>
                  <option value="CORPORATE_MAIL">CORPORATE EXCHANGE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">External Recipient Drop:</label>
              <input
                type="text"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="w-full p-2 bg-[#080b12] border border-[#23314d] rounded text-white"
              />
            </div>

            <button
              disabled={loading}
              onClick={handleSimulateEmail}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600/80 to-indigo-700/80 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate 3-Stage Email Exfiltration (Access → Attach → Dispatch)</span>
            </button>

            {emailFeedback && (
              <div className="p-2.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-[11px]">
                {emailFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick NLP Queries & Live Telemetry Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Quick NLP Execution Cards */}
          <div className="bg-[#0c111e] p-6 rounded-xl border border-cyan-500/30 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-[#1a2334] pb-2 text-cyan-300 font-bold">
              <Search className="w-4 h-4" />
              <span>1-Click Forensic NLP Inquiries</span>
            </div>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show failed login attempts within 5 minutes before the successful login.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show failed login attempts within 5 minutes before the successful login."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show failed login attempts before the successful login.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show failed login attempts before the successful login."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show failed logins within 10 minutes before successful login.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show failed logins within 10 minutes before successful login."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show repeated failed login attempts.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-rose-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show repeated failed login attempts."</span>
                <ArrowRight className="w-3 h-3 text-rose-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show failed Windows logins.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show failed Windows logins."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show successful Windows logins.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-emerald-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show successful Windows logins."</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery(`Show failed logins for user ${loginTargetUser}.`)}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show failed logins for user {loginTargetUser}."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery(`Show login activity for user ${loginTargetUser}.`)}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show login activity for user {loginTargetUser}."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show authentication events from Windows.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show authentication events from Windows."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show files copied to USB after pendrive was connected.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show files copied to USB after pendrive was connected."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show files edited on USB.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-sky-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show files edited on USB."</span>
                <ArrowRight className="w-3 h-3 text-sky-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show files deleted from USB.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-rose-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show files deleted from USB."</span>
                <ArrowRight className="w-3 h-3 text-rose-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show all file activity on removable drive.')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-amber-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show all file activity on removable drive."</span>
                <ArrowRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show files copied to external hard drive after it was connected')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-cyan-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show files copied to external hard drive after it was connected"</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleRunQuery('Show sensitive files emailed to external recipients within 10 minutes after access')}
                className="w-full p-2 bg-[#101726] hover:bg-[#182338] border border-indigo-500/30 rounded text-left flex items-center justify-between text-slate-200 transition text-[11px]"
              >
                <span>"Show sensitive files emailed to external recipients within 10 minutes after access"</span>
                <ArrowRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Investigation Result (if inquiry run) */}
          {investigationResult && (
            <div className="bg-[#0c111e] p-6 rounded-xl border border-cyan-500/40 shadow-xl space-y-4 animate-in fade-in duration-200 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
                <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Query Findings ({investigationResult.evidence_count} Artifacts)
                </span>
                <button
                  onClick={onNavigateToInvestigate}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Open in Full Workbench</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {investigationResult.evidence.map((evt) => (
                  <div key={evt.event_id} className="p-2.5 rounded bg-[#111728] border border-[#1f2a40] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{evt.file || evt.action}</span>
                      <span className="text-emerald-400 font-semibold">{evt.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>User: <strong className="text-cyan-300">{evt.user}</strong></span>
                      {evt.recipient && <span>Recipient: <strong className="text-rose-300">{evt.recipient}</strong></span>}
                      {evt.device && <span>Device: <strong className="text-amber-300">{evt.device}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded bg-[#090d16] border border-[#1a2334] text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold block mb-1">Explainability Summary:</span>
                <p>{investigationResult.explainability.summary_verdict}</p>
              </div>
            </div>
          )}

          {/* Real-time Telemetry Stream */}
          <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Live Endpoint Event Stream
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{logs.length} Recent Artifacts</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#090d16] text-slate-500 text-center">
                  No telemetry recorded yet. Click simulation or start the host agent above.
                </div>
              ) : (
                logs.map((evt) => {
                  const isFileCopy = evt.action === 'FILE_COPIED_TO_REMOVABLE_DEVICE' || evt.action === 'FILE_COPY';
                  const isFileMod = evt.action === 'FILE_MODIFIED' || evt.action === 'FILE_MOVED';
                  const isFileDel = evt.action === 'FILE_DELETED';

                  return (
                    <div
                      key={evt.event_id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-lg bg-[#0e1424] border hover:border-cyan-500/50 cursor-pointer transition space-y-2 ${
                        isFileDel ? 'border-rose-900/60 hover:bg-rose-950/10' :
                        isFileCopy ? 'border-emerald-900/60 hover:bg-emerald-950/10' :
                        isFileMod ? 'border-sky-900/60 hover:bg-sky-950/10' :
                        'border-[#1e2a40]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-cyan-300 font-bold">{evt.event_id}</span>
                          
                          {/* Distinct Action Badges */}
                          {isFileCopy ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Copy className="w-3 h-3" /> FILE COPIED
                            </span>
                          ) : isFileMod ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                              <Edit3 className="w-3 h-3" /> FILE EDITED / MODIFIED
                            </span>
                          ) : isFileDel ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> FILE DELETED
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              evt.event_type === 'usb' 
                                ? 'bg-amber-950/70 text-amber-300' 
                                : evt.event_type === 'email' 
                                ? 'bg-indigo-950/70 text-indigo-300' 
                                : evt.event_type === 'authentication'
                                ? (evt.action === 'FAILED_LOGIN' ? 'bg-rose-950/70 text-rose-300' : 'bg-emerald-950/70 text-emerald-300')
                                : 'bg-cyan-950/70 text-cyan-300'
                            }`}>
                              {evt.action}
                            </span>
                          )}

                          {evt.is_suspicious === 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                              SUSPICIOUS
                            </span>
                          )}
                          {evt.metadata?.windows_event_id && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 font-semibold">
                              Win 462{evt.metadata.windows_event_id === 4625 ? '5' : '4'}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">
                            {evt.timestamp?.split('T')[1]?.substring(0, 8)} UTC
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${
                            evt.dataset_label === 'WINDOWS_HOST_TELEMETRY' ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30' :
                            evt.dataset_label === 'SIMULATED_FORENSIC_EVENT' ? 'text-purple-300 bg-purple-950/60 border border-purple-500/30' :
                            'text-slate-400'
                          }`}>
                            {evt.dataset_label}
                          </span>
                        </div>
                      </div>

                      {/* Prominent File Artifact Banner */}
                      {(evt.file || evt.file_path) && (
                        <div className="p-2.5 rounded bg-[#090d18] border border-[#23314d] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className={`w-4 h-4 shrink-0 ${isFileDel ? 'text-rose-400' : isFileMod ? 'text-sky-400' : 'text-emerald-400'}`} />
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">Target File:</span>
                                <strong className="text-white font-mono text-xs">{evt.file}</strong>
                              </div>
                              {evt.file_path && (
                                <span className="text-slate-500 text-[10px] block truncate font-mono mt-0.5">
                                  Path: {evt.file_path}
                                </span>
                              )}
                            </div>
                          </div>
                          {evt.file_size ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 ml-2 font-mono">
                              {evt.file_size > 1048576 
                                ? `${(evt.file_size / 1048576).toFixed(1)} MB` 
                                : `${(evt.file_size / 1024).toFixed(1)} KB`}
                            </span>
                          ) : evt.drive_letter ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0 ml-2 font-mono">
                              Drive {evt.drive_letter}
                            </span>
                          ) : null}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                        {evt.event_type === 'authentication' && (
                          <span className="text-cyan-300">👤 User: <strong>{evt.user}</strong></span>
                        )}
                        {evt.device && <span className="text-amber-300">💾 {evt.device}</span>}
                        {evt.recipient && <span className="text-indigo-300">✉️ {evt.recipient}</span>}
                        {evt.description && !evt.file && <span className="text-slate-300 italic">{evt.description}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
