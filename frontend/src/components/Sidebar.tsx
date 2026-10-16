import React from 'react';
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  Database, 
  HardDrive, 
  Briefcase, 
  Cpu, 
  KeyRound, 
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'investigate', label: 'Investigate', icon: Search, badge: 'Core' },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'evidence', label: 'Evidence Explorer', icon: Database },
    { id: 'usb', label: 'USB Investigation', icon: HardDrive },
    { id: 'cases', label: 'Cases', icon: Briefcase },
    { id: 'explainability', label: 'Explainability', icon: Cpu },
    { id: 'login', label: 'Live Auth Demo', icon: KeyRound, highlight: true },
  ];

  return (
    <aside className="w-64 bg-[#0a0e17] border-r border-[#1a2333] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1a2333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-wider text-white font-mono flex items-center gap-1.5">
                FORENSIQ
                <span className="text-[10px] uppercase tracking-normal px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-tight leading-3 mt-0.5">
                Digital Forensic & Temporal Query System
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-[#1a2333] space-y-3 bg-[#080b12]">
        <div className="bg-[#0f1524] rounded-lg p-2.5 border border-[#1e2a40] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Investigator:</span>
            <span className="text-slate-200 font-mono font-medium">{currentUser || 'Gopal'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Database:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> SQLite Active
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend:</span>
            <span className="text-cyan-400 font-mono text-[11px]">FastAPI :8000</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
