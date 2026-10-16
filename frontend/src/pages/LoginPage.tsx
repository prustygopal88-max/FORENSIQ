import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  UserPlus, 
  RefreshCw, 
  Database,
  Lock,
  User,
  Laptop
} from 'lucide-react';
import { loginUser, registerDemoUser, getEvidenceEvents } from '../api/client';
import { ForensicEvent } from '../types';

interface LoginPageProps {
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
  onNavigateToInvestigate: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  currentUser, 
  setCurrentUser,
  onNavigateToInvestigate 
}) => {
  const [username, setUsername] = useState('Gopal');
  const [password, setPassword] = useState('password123');
  const [machine, setMachine] = useState('FORENSIQ-PC');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [authEvents, setAuthEvents] = useState<ForensicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Fetch recent auth events
  const loadRecentAuthEvents = async () => {
    try {
      const res = await getEvidenceEvents({ event_type: 'authentication', limit: 8 });
      setAuthEvents(res.events);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecentAuthEvents();
  }, []);

  const handleLoginAttempt = async (useWrongPassword = false) => {
    setLoading(true);
    setStatusMessage(null);
    const pwdToTry = useWrongPassword ? `wrong_pwd_${Date.now()}` : password;

    try {
      const res = await loginUser(username, pwdToTry, machine);
      setCurrentUser(res.user);
      setStatusMessage({
        text: `AUTHENTICATION SUCCESSFUL: Forensic event ${res.forensic_event?.event_id} logged to SQLite.`,
        type: 'success'
      });
      await loadRecentAuthEvents();
    } catch (err: any) {
      const evtId = err?.detail?.forensic_event?.event_id || 'EVT-AUTH-LOG';
      setStatusMessage({
        text: `AUTHENTICATION FAILED: ${err?.detail?.message || 'Invalid credentials'}. Forensic event ${evtId} logged to database!`,
        type: 'error'
      });
      await loadRecentAuthEvents();
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    try {
      await registerDemoUser(newUsername.trim(), newPassword.trim(), 'investigator');
      setUsername(newUsername.trim());
      setPassword(newPassword.trim());
      setShowConfig(false);
      setStatusMessage({
        text: `Demo account '${newUsername}' registered and active for evaluation!`,
        type: 'info'
      });
    } catch (err) {
      setStatusMessage({ text: 'Failed to configure account', type: 'error' });
    }
  };

  const failedCount = authEvents.filter(e => e.status === 'FAILED').length;
  const successCount = authEvents.filter(e => e.status === 'SUCCESS').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Live Authentication & Suspect Credential Simulator</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
          Live Forensic Authentication Demo
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          The authentication system verifies passwords against SQLite. Every attempt automatically logs a real forensic audit event with true timestamp, status, machine, and source telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Login Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Authentication Console
                </h3>
              </div>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showConfig ? 'Close Setup' : 'Configure Account'}</span>
              </button>
            </div>

            {/* Account Setup Drawer if toggled */}
            {showConfig && (
              <form onSubmit={handleConfigureAccount} className="p-4 rounded-lg bg-[#111728] border border-[#23314d] space-y-3 font-mono text-xs">
                <span className="text-cyan-300 font-semibold block">Create Custom Demo Account</span>
                <div>
                  <label className="text-slate-400 block mb-1">Username:</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. Gopal or Suspect_X"
                    className="w-full p-2 bg-[#090d16] border border-[#1e2a40] rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Password:</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. Secret2026!"
                    className="w-full p-2 bg-[#090d16] border border-[#1e2a40] rounded text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition"
                >
                  Save Demo Credentials
                </button>
              </form>
            )}

            {/* Main Login Form */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Target Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-[#080b12] border border-[#23314d] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> Registered Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-[#080b12] border border-[#23314d] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-cyan-400" /> Machine Hostname
                </label>
                <input
                  type="text"
                  value={machine}
                  onChange={(e) => setMachine(e.target.value)}
                  className="w-full p-3 bg-[#080b12] border border-[#23314d] rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoginAttempt(false)}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enter Correct Password (Authenticate)</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoginAttempt(true)}
                  className="w-full py-3 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-semibold rounded-lg transition shadow-md flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Simulate Wrong Password (Record FAILED)</span>
                </button>
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                }`}>
                  {statusMessage.text}
                </div>
              )}
            </div>

            {/* Direct Link to Investigation */}
            <div className="pt-4 border-t border-[#1a2334]">
              <button
                onClick={onNavigateToInvestigate}
                className="w-full py-2.5 px-4 rounded-lg bg-[#12192a] hover:bg-[#1a243a] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center justify-between transition group"
              >
                <span>Investigate this Auth Sequence in FORENSIQ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry Event Stream */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Live Forensic Database Event Stream
                </h3>
              </div>
              <button
                onClick={loadRecentAuthEvents}
                className="p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                title="Refresh events"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
                <span className="text-slate-400 text-xs">Failed Logins Recorded</span>
                <p className="text-xl font-bold text-rose-400 mt-1">{failedCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-slate-400 text-xs">Successful Logins</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{successCount}</p>
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-2.5 font-mono text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                Recent Audit Trail (Stored in SQLite):
              </span>

              {authEvents.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#090d16] text-slate-500 text-center">
                  No authentication events logged yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {authEvents.map((evt) => (
                    <div 
                      key={evt.event_id}
                      className="p-3 rounded-lg bg-[#0e1424] border border-[#1e2a40] flex items-center justify-between hover:border-cyan-500/40 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-300 font-bold">{evt.event_id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            evt.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                          }`}>
                            {evt.action}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          User: <strong className="text-white">{evt.user}</strong> | Host: {evt.machine} | Source: {evt.source}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        {evt.timestamp.split('T')[1]?.substring(0, 8)} UTC
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
