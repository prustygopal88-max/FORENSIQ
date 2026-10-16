import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Filter, 
  RefreshCw, 
  KeyRound, 
  HardDrive, 
  FileText, 
  Layers, 
  ChevronRight,
  Shield
} from 'lucide-react';
import { getTimelineEvents } from '../api/client';
import { ForensicEvent } from '../types';
import { EventDetailModal } from '../components/EventDetailModal';

export const TimelinePage: React.FC = () => {
  const [events, setEvents] = useState<ForensicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const res = await getTimelineEvents();
      setEvents(res.timeline);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.event_type.toLowerCase() === filterType.toLowerCase();
  });

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'authentication': return KeyRound;
      case 'usb': return HardDrive;
      case 'file': return FileText;
      default: return Layers;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2334] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chronological Event Reconstruction</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
            Interactive Forensic Timeline
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Reconstruct forensic event chronology across system, authentication, and peripheral telemetry.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0c111e] border border-[#1e2a40] rounded-lg p-1 text-xs font-mono">
            {['ALL', 'AUTHENTICATION', 'FILE', 'USB', 'SYSTEM'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterType === type
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            onClick={loadTimeline}
            className="p-2 rounded-lg bg-[#0c111e] border border-[#1e2a40] text-slate-400 hover:text-cyan-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="bg-[#0c111e] p-8 rounded-xl border border-[#1e2a40] shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            Loading chronological forensic timeline...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            No events found matching filter '{filterType}'.
          </div>
        ) : (
          <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#1a2438]">
            {filteredEvents.map((evt, idx) => {
              const Icon = getEventIcon(evt.event_type);
              const isFailed = evt.status === 'FAILED';
              const isSuccess = evt.status === 'SUCCESS';

              return (
                <div key={evt.event_id || idx} className="relative group">
                  {/* Timeline Node Marker */}
                  <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border flex items-center justify-center transition ${
                    isFailed
                      ? 'bg-rose-950 border-rose-500/80 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : isSuccess
                      ? 'bg-emerald-950 border-emerald-500/80 text-emerald-400'
                      : 'bg-cyan-950 border-cyan-500/80 text-cyan-400'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Card Content */}
                  <div 
                    onClick={() => setSelectedEvent(evt)}
                    className="p-4 rounded-xl bg-[#0e1424] border border-[#1e2a40] hover:border-cyan-500/40 cursor-pointer transition shadow-md hover:shadow-cyan-950/20"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2334] pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm">{evt.action}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isSuccess
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : isFailed
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {evt.status}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {evt.event_type.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">
                        {evt.timestamp}
                      </span>
                    </div>

                    <div className="pt-2 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        User: <strong className="text-slate-200">{evt.user}</strong> | Host: <span className="text-slate-300">{evt.machine}</span> | Source: <span className="text-slate-400">{evt.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {evt.file && <span className="text-cyan-300">📄 {evt.file}</span>}
                        {evt.device && <span className="text-amber-300">💾 {evt.device}</span>}
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
