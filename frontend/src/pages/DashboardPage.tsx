import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  HardDrive, 
  FileText, 
  Briefcase, 
  Search, 
  Clock, 
  Activity,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { getDashboardStats } from '../api/client';
import { DashboardStats, ForensicEvent } from '../types';
import { EventDetailModal } from '../components/EventDetailModal';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    { label: 'TOTAL FORENSIC EVENTS', value: stats?.total_events ?? 0, icon: Layers, color: 'cyan' },
    { label: 'SUSPICIOUS SEQUENCES', value: stats?.suspicious_events ?? 0, icon: ShieldAlert, color: 'rose' },
    { label: 'WINDOWS HOST TELEMETRY', value: stats?.host_telemetry_events ?? 0, icon: Cpu, color: 'emerald' },
    { label: 'AUTHENTICATION EVENTS', value: stats?.authentication_events ?? 0, icon: KeyRound, color: 'blue' },
    { label: 'USB / REMOVABLE MEDIA', value: stats?.usb_events ?? 0, icon: HardDrive, color: 'amber' },
    { label: 'EMAIL EXFILTRATION AUDIT', value: stats?.email_events ?? 0, icon: Search, color: 'indigo' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2334] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forensic Operations Telemetry Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
            Operational Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time digital evidence metrics, telemetry ingestion, and temporal query correlation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0e1424] hover:bg-[#162035] border border-[#1e2a40] text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigate('investigate')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold font-mono rounded-lg transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Primary Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div 
              key={idx}
              className="bg-[#0c111e] p-4 rounded-xl border border-[#1e2a40] hover:border-cyan-500/40 transition shadow-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {c.label}
                </span>
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">
                {loading ? '...' : c.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Heterogeneous Sources Distribution & Quick Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Telemetry Distribution */}
        <div className="lg:col-span-8 bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Heterogeneous Forensic Event Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Normalized Unified Schema</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            FORENSIQ correlates events across multiple heterogeneous log sources without requiring SQL or manual cross-table joins.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#111728] border border-[#1e2a40] space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Authentication</span>
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-lg font-bold text-blue-400">{stats?.authentication_events ?? 0}</p>
              <div className="text-[10px] text-slate-500">Live Auth + LANL Sample</div>
            </div>

            <div className="p-3 rounded-lg bg-[#111728] border border-[#1e2a40] space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>File System</span>
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400">{stats?.file_events ?? 0}</p>
              <div className="text-[10px] text-slate-500">Access, Copy, Writes</div>
            </div>

            <div className="p-3 rounded-lg bg-[#111728] border border-[#1e2a40] space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>USB Peripherals</span>
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-bold text-amber-400">{stats?.usb_events ?? 0}</p>
              <div className="text-[10px] text-slate-500">Hardware Hub & Mounts</div>
            </div>

            <div className="p-3 rounded-lg bg-[#111728] border border-[#1e2a40] space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>System & Network</span>
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-lg font-bold text-cyan-400">{stats?.system_events ?? 0}</p>
              <div className="text-[10px] text-slate-500">Process & Daemon Logs</div>
            </div>
          </div>
        </div>

        {/* Quick Demo Launch Deck */}
        <div className="lg:col-span-4 bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1a2334] pb-3">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Demonstration Shortcuts
            </h3>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <button
              onClick={() => onNavigate('login')}
              className="w-full p-3 rounded-lg bg-[#111728] hover:bg-[#182238] border border-[#1e2a40] hover:border-cyan-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-cyan-300 font-bold block">1. Live Login Demo</span>
                <span className="text-slate-400 text-[11px]">Generate wrong & correct login events</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onNavigate('usb')}
              className="w-full p-3 rounded-lg bg-[#111728] hover:bg-[#182238] border border-[#1e2a40] hover:border-amber-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-amber-300 font-bold block">2. USB Exfiltration Sandbox</span>
                <span className="text-slate-400 text-[11px]">Simulate device insertion and file copy</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onNavigate('investigate')}
              className="w-full p-3 rounded-lg bg-[#111728] hover:bg-[#182238] border border-[#1e2a40] hover:border-blue-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-blue-300 font-bold block">3. NLP Forensic Inquiry</span>
                <span className="text-slate-400 text-[11px]">Ask plain English questions & inspect query</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Investigations & Recent Forensic Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Investigations */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Recent Natural Language Investigations
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">SQLite Audit Log</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs">
            {(!stats?.recent_investigations || stats.recent_investigations.length === 0) ? (
              <div className="p-6 text-center text-slate-500">
                No queries executed yet. Run a query in the Investigate tab!
              </div>
            ) : (
              stats.recent_investigations.map((inv) => (
                <div 
                  key={inv.id}
                  onClick={() => onNavigate('investigate')}
                  className="p-3 rounded-lg bg-[#101626] border border-[#1e2a40] hover:border-cyan-500/40 cursor-pointer transition space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold truncate max-w-sm">"{inv.query_text}"</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {inv.results_count} Results
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Target Intent: {inv.structured_query?.intent || 'General'}</span>
                    <span>{inv.timestamp?.split('T')[1]?.substring(0, 8)} UTC</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Forensic Events */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Recent Forensic Telemetry Stream
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Latest Ingested</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs">
            {(!stats?.recent_events || stats.recent_events.length === 0) ? (
              <div className="p-6 text-center text-slate-500">
                No events recorded yet.
              </div>
            ) : (
              stats.recent_events.map((evt) => (
                <div 
                  key={evt.event_id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-3 rounded-lg bg-[#101626] border border-[#1e2a40] hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cyan-300 font-bold">{evt.event_id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        evt.action?.includes('DELETE') ? 'text-rose-400 bg-rose-950 border border-rose-500/30' :
                        evt.action?.includes('MODIF') ? 'text-amber-400 bg-amber-950 border border-amber-500/30' :
                        evt.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                      }`}>
                        {evt.action}
                      </span>
                      {evt.file && (
                        <span className="text-[11px] text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 flex items-center gap-1">
                          📄 {evt.file}
                          {evt.file_size ? ` (${evt.file_size > 1048576 ? `${(evt.file_size/1048576).toFixed(1)}MB` : evt.file_size > 1024 ? `${Math.round(evt.file_size/1024)}KB` : `${evt.file_size}B`})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{evt.user} @ {evt.machine} ({evt.source})</span>
                      {evt.drive_letter && <span className="text-amber-400 font-mono">[{evt.drive_letter}]</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {evt.timestamp?.split('T')[1]?.substring(0, 8)} UTC
                  </span>
                </div>
              ))
            )}
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
