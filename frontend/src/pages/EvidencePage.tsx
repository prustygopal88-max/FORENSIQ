import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ChevronRight,
  Shield,
  FileText,
  HardDrive,
  Mail,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import { getEvidenceEvents } from '../api/client';
import { ForensicEvent } from '../types';
import { EventDetailModal } from '../components/EventDetailModal';

export const EvidencePage: React.FC = () => {
  const [events, setEvents] = useState<ForensicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [datasetLabel, setDatasetLabel] = useState('ALL');
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvidenceEvents({
        search: search || undefined,
        event_type: eventType,
        source: source,
        status: status,
        dataset_label: datasetLabel,
        is_suspicious: onlySuspicious ? 1 : undefined,
        limit: 150
      });
      setEvents(res.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType, source, status, datasetLabel, onlySuspicious]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const exportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Event ID', 'Timestamp', 'Event Type', 'Action', 'Status', 'User', 'Machine', 'Source', 'Artifact', 'Dataset Label', 'Suspicious', 'Device Type', 'Recipient'];
    const rows = events.map(e => [
      e.event_id,
      e.timestamp,
      e.event_type,
      e.action,
      e.status,
      e.user,
      e.machine,
      `"${e.source}"`,
      `"${e.file || e.device || ''}"`,
      `"${e.dataset_label}"`,
      e.is_suspicious ? 'YES' : 'NO',
      `"${e.device_type || ''}"`,
      `"${e.recipient || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `forensiq_evidence_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2334] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forensic Evidence Explorer</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
            Unified Evidence Store
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Query across live Windows host agent telemetry, synthetic multi-stage attack scenarios, and simulated logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0e1424] hover:bg-[#162035] border border-[#1e2a40] text-slate-300 text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg bg-[#0c111e] border border-[#1e2a40] text-slate-400 hover:text-cyan-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Deck */}
      <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Event ID, user, action, file, removable device, email recipient..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#070a12] border border-[#23314d] rounded-lg text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div>
            <label className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Event Type:</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2 bg-[#090d16] border border-[#1e2a40] rounded text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="authentication">Authentication</option>
              <option value="file">File System</option>
              <option value="usb">USB Removable</option>
              <option value="email">Email Audit</option>
              <option value="system">System & OS</option>
              <option value="network">Network</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Dataset Provenance:</label>
            <select
              value={datasetLabel}
              onChange={(e) => setDatasetLabel(e.target.value)}
              className="w-full p-2 bg-[#090d16] border border-[#1e2a40] rounded text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Provenances</option>
              <option value="WINDOWS_HOST_TELEMETRY">Windows Host Telemetry (Real Windows 4624/4625 & USB)</option>
              <option value="SIMULATED_FORENSIC_EVENT">Simulated Forensic Event (Login Attacks & USB Exfiltration)</option>
              <option value="SYNTHETIC_DATASET">Synthetic Dataset (15,000+ Enterprise Events)</option>
              <option value="Live Authentication">Live Demo Authentication</option>
              <option value="Public Dataset">LANL Public Dataset</option>

            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 bg-[#090d16] border border-[#1e2a40] rounded text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="suspiciousOnly"
              checked={onlySuspicious}
              onChange={(e) => setOnlySuspicious(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
            />
            <label htmlFor="suspiciousOnly" className="text-rose-400 font-bold text-xs cursor-pointer select-none">
              Suspicious Sequences Only
            </label>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1a2334] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Total Matching Records: <strong className="text-cyan-300">{events.length}</strong>
          </span>
          <span className="text-slate-500 text-[11px]">
            Sorted by timestamp (Descending)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            Querying SQLite database...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            No matching forensic events found for current search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#090d16] text-slate-400 border-b border-[#1a2334]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Target / Peripheral</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131b2c] text-slate-300">
                {events.map((evt) => (
                  <tr 
                    key={evt.event_id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-[#101726] transition cursor-pointer"
                  >
                    <td className="py-3 px-4 text-cyan-400 font-bold">{evt.event_id}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {evt.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.event_type === 'authentication' ? 'bg-blue-950 text-blue-300' :
                        evt.event_type === 'file' ? 'bg-emerald-950 text-emerald-300' :
                        evt.event_type === 'usb' ? 'bg-amber-950 text-amber-300' :
                        evt.event_type === 'email' ? 'bg-indigo-950 text-indigo-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold flex items-center gap-1.5">
                      <span>{evt.action}</span>
                      {evt.is_suspicious === 1 && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-bold border border-rose-500/40">
                          ALERT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[260px] truncate">
                      {evt.file ? (
                        <span className="text-cyan-300 font-medium">📄 {evt.file}</span>
                      ) : evt.device ? (
                        <span className="text-amber-300 font-medium">💾 {evt.device}</span>
                      ) : evt.recipient ? (
                        <span className="text-indigo-300 font-medium">✉️ {evt.recipient}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        evt.dataset_label === 'WINDOWS_HOST_TELEMETRY' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
                        evt.dataset_label === 'SYNTHETIC_DATASET' ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30' :
                        evt.dataset_label === 'SIMULATED_FORENSIC_EVENT' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                        'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {evt.dataset_label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500 inline hover:text-cyan-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
