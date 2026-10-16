import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Clock, User, LogOut, Radio, Play, Square, Activity } from 'lucide-react';
import { getAgentStatus, startAgent, stopAgent } from '../api/client';

interface NavbarProps {
  activeTab: string;
  currentUser: string | null;
  onLogout: () => void;
  onSwitchToAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  currentUser, 
  onLogout,
  onSwitchToAuth 
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [agentActive, setAgentActive] = useState<boolean>(false);
  const [agentDrives, setAgentDrives] = useState<string[]>([]);
  const [agentLoading, setAgentLoading] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll Host Monitoring Agent status every 3 seconds
  const [loginActive, setLoginActive] = useState<boolean>(true);
  const [usbActive, setUsbActive] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const status = await getAgentStatus();
        if (isMounted) {
          setAgentActive(Boolean(status.is_running));
          setAgentDrives(status.monitored_drives || []);
          setLoginActive(Boolean(status.login_telemetry_active ?? status.is_running));
          setUsbActive(Boolean(status.usb_telemetry_active ?? status.is_running));
        }
      } catch (err) {
        // backend might be rebooting
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleAgent = async () => {
    setAgentLoading(true);
    try {
      if (agentActive) {
        await stopAgent();
        setAgentActive(false);
      } else {
        await startAgent();
        setAgentActive(true);
      }
    } catch (err) {
      console.error('Agent toggle error:', err);
    } finally {
      setAgentLoading(false);
    }
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Operational Dashboard & Telemetry Overview';
      case 'investigate': return 'Natural Language Forensic Query Engine';
      case 'timeline': return 'Forensic Chronology & Event Ordering';
      case 'evidence': return 'Unified Evidence Explorer';
      case 'usb': return 'Endpoint Host Agent, Removable Media & Exfiltration Telemetry';
      case 'cases': return 'Forensic Case Management';
      case 'explainability': return 'Explainable AI & Reasoning Verification';
      case 'login': return 'Live Authentication & Suspect Credential Simulator';
      default: return 'Forensic Workspace';
    }
  };

  return (
    <header className="h-16 bg-[#0a0e17]/90 backdrop-blur border-b border-[#1a2333] px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <div>
          <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>FORENSIQ</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 capitalize">{activeTab}</span>
          </h1>
          <p className="text-[11px] text-slate-400">{getPageTitle(activeTab)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Host Agent Real-Time Status Pill Group */}
        <div className="flex items-center gap-2">
          {/* Main Host Monitoring Pill */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition shadow-sm ${
              agentActive 
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {agentActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${agentActive ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            </span>
            <span className="font-semibold tracking-wide">
              HOST MONITORING ● {agentActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
            {agentDrives.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-[10px] text-emerald-200">
                {agentDrives.join(', ')}
              </span>
            )}
          </div>

          {/* Sub-indicator: Login Telemetry */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0e1628] border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
            <span className={`w-1.5 h-1.5 rounded-full ${agentActive && loginActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span>LOGIN TELEMETRY ● {agentActive && loginActive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>

          {/* Sub-indicator: USB Telemetry */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0e1628] border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            <span className={`w-1.5 h-1.5 rounded-full ${agentActive && usbActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span>USB TELEMETRY ● {agentActive && usbActive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>

          <button
            onClick={handleToggleAgent}
            disabled={agentLoading}
            title={agentActive ? 'Stop Windows Host Monitoring Agent' : 'Start Windows Host Monitoring Agent'}
            className={`p-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1 ${
              agentActive
                ? 'bg-rose-950/50 hover:bg-rose-900/50 border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/50 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {agentActive ? <Square className="w-3 h-3 fill-rose-400 text-rose-400" /> : <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />}
            <span className="text-[11px] hidden sm:inline">{agentActive ? 'Stop' : 'Start'}</span>
          </button>
        </div>


        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-[#1e2a40] text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || 'Loading UTC...'}</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#0e1422] border border-[#1e2a40] px-3 py-1.5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-semibold">
                {currentUser[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-slate-200 font-medium font-mono">{currentUser}</span>
              <button
                onClick={onLogout}
                title="Log out"
                className="ml-1 text-slate-500 hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSwitchToAuth}
              className="flex items-center gap-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 text-xs px-3 py-1.5 rounded-lg transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Demo Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
