import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Database, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  Copy, 
  Check, 
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { executeInvestigation } from '../api/client';
import { InvestigationResult, ForensicEvent } from '../types';
import { EventDetailModal } from '../components/EventDetailModal';
import { ReportModal } from '../components/ReportModal';

interface InvestigatePageProps {
  currentUser: string | null;
}

export const InvestigatePage: React.FC<InvestigatePageProps> = ({ currentUser }) => {
  const [query, setQuery] = useState('Show me failed login attempts before the successful login.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);
  const [showReport, setShowReport] = useState(false);

  const sampleQueries = [
    { label: 'Demo 1: Failed logins before success', text: 'Show me failed login attempts before the successful login.' },
    { label: 'Demo 1b: 5-minute temporal window', text: 'Show failed login attempts within 5 minutes before the successful login.' },
    { label: 'Demo 2: USB pendrive exfiltration', text: 'Show files copied to USB after pendrive was connected.' },
    { label: 'Demo 3: External hard drive bulk transfer', text: 'Show files copied to external hard drive after it was connected' },
    { label: 'Demo 4: Sensitive email exfiltration', text: 'Show sensitive files emailed to external recipients within 10 minutes after access' },
    { label: 'Demo 4b: External email dispatches', text: 'Show emails sent to external recipients' },
    { label: 'Auth audit timeline', text: 'Show me the complete authentication timeline.' },
  ];

  const handleInvestigate = async (queryText?: string) => {
    const q = queryText || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await executeInvestigation(q, currentUser || undefined);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute forensic query.');
    } finally {
      setLoading(false);
    }
  };

  const copyStructuredQuery = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.structured_query, null, 2));
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero / Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>NLP-Powered Digital Forensic & Temporal Reasoning Engine</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
          Ask a Forensic Question
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Convert plain-English investigative queries into deterministic structured searches across heterogeneous logs (Auth, USB, File, System) with explainable reasoning and temporal bounds.
        </p>
      </div>

      {/* Main Search Input Deck */}
      <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-xl space-y-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleInvestigate(); }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What happened before the suspicious login?"
              className="w-full pl-12 pr-4 py-3.5 bg-[#070a12] border border-[#23314d] rounded-lg text-slate-100 placeholder-slate-500 text-sm md:text-base font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 font-mono tracking-wider"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>INVESTIGATING...</span>
              </>
            ) : (
              <>
                <span>INVESTIGATE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Question Chips for Live Demo */}
        <div className="space-y-2 pt-2 border-t border-[#1a2334]">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-cyan-400" /> Quick Demonstration Prompts (Click to evaluate):
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(chip.text);
                  handleInvestigate(chip.text);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#111728] hover:bg-[#182238] border border-[#202b42] hover:border-cyan-500/40 text-xs text-slate-300 transition text-left font-mono flex items-center gap-1.5"
              >
                <span className="text-cyan-400 font-semibold">{chip.label}:</span>
                <span className="text-slate-400 truncate max-w-xs">{chip.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3 font-mono">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Investigation Results Presentation */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Execution Telemetry Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#0c111e] border border-[#1e2a40]">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <span className="text-sm font-mono text-slate-200">
                Evaluation Complete: <strong className="text-cyan-300">{result.evidence_count}</strong> evidence events retrieved in <strong className="text-white">{result.execution_time_ms} ms</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Official Report</span>
              </button>
            </div>
          </div>

          {/* Section 1 & Section 2 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Query Interpretation */}
            <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    1. NLP Query Interpretation
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  {result.interpretation.intent}
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded bg-[#101626] border border-[#1b253b]">
                    <span className="text-slate-500 text-[10px] uppercase">Event Type</span>
                    <p className="text-cyan-300 font-semibold mt-0.5">{result.interpretation.event_type.toUpperCase()}</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#101626] border border-[#1b253b]">
                    <span className="text-slate-500 text-[10px] uppercase">Target Action / Status</span>
                    <p className="text-white font-semibold mt-0.5">
                      {result.interpretation.action || 'ANY'} 
                      {result.interpretation.status && ` (${result.interpretation.status})`}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#101626] border border-[#1b253b]">
                    <span className="text-slate-500 text-[10px] uppercase">Temporal Relation</span>
                    <p className="text-amber-300 font-semibold mt-0.5">
                      {result.interpretation.temporal_relation || 'NONE'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#101626] border border-[#1b253b]">
                    <span className="text-slate-500 text-[10px] uppercase">Reference Landmark</span>
                    <p className="text-emerald-300 font-semibold mt-0.5">
                      {result.interpretation.reference_event || 'NONE'}
                    </p>
                  </div>
                </div>

                {result.interpretation.time_window_minutes && (
                  <div className="p-2.5 rounded bg-[#101626] border border-[#1b253b]">
                    <span className="text-slate-500 text-[10px] uppercase">Temporal Window Filter</span>
                    <p className="text-cyan-400 font-semibold mt-0.5">
                      Within {result.interpretation.time_window_minutes} minute(s)
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-[#0e1424] border border-[#1e2a40] text-slate-300 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Interpretation Narrative:</span>
                  {result.interpretation.explanation_summary}
                </div>
              </div>
            </div>

            {/* Section 2: Structured Forensic Query */}
            <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    2. Structured Forensic Query
                  </h3>
                </div>
                <button
                  onClick={copyStructuredQuery}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 font-mono transition"
                >
                  {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery ? 'Copied' : 'Copy Query'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-lg bg-[#07090e] border border-[#1b253b] text-xs font-mono text-cyan-300 overflow-x-auto max-h-[220px]">
                  {JSON.stringify(result.structured_query, null, 2)}
                </pre>
              </div>

              {/* Resolved Reference Landmark Details */}
              {result.reference_event_found && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Landmark Event Resolved in SQLite
                    </span>
                    <span className="text-emerald-300 font-bold">{result.reference_event_found.event_id}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Timestamp: {result.reference_event_found.timestamp} | {result.reference_event_found.action} by {result.reference_event_found.user}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Evidence Results */}
          <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  3. Evidence Results ({result.evidence_count} Events)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Click any row for detailed forensic artifact inspection
              </span>
            </div>

            {result.evidence_count === 0 ? (
              <div className="p-8 text-center bg-[#080b12] rounded-lg border border-[#1a2334] space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-300 text-sm font-mono font-medium">
                  No matching forensic events were found for the requested conditions.
                </p>
                <p className="text-slate-500 text-xs">
                  Try broadening the temporal window or simulating events in the Live Auth / USB tabs.
                </p>
              </div>
            ) : (
              <div className="border border-[#1e2a40] rounded-lg overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-[#101626] text-slate-400 border-b border-[#1e2a40]">
                    <tr>
                      <th className="p-3">Event ID</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Artifacts (File / Device)</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182236] bg-[#090d16]">
                    {result.evidence.map((evt) => (
                      <tr 
                        key={evt.event_id}
                        onClick={() => setSelectedEvent(evt)}
                        className="hover:bg-[#101729] cursor-pointer transition"
                      >
                        <td className="p-3 text-cyan-400 font-bold">{evt.event_id}</td>
                        <td className="p-3 text-slate-300">{evt.timestamp}</td>
                        <td className="p-3 text-white font-semibold">{evt.action}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.status === 'SUCCESS'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{evt.user}</td>
                        <td className="p-3 text-slate-400">{evt.source}</td>
                        <td className="p-3 text-slate-400">
                          {evt.file && <span className="text-cyan-300 mr-2">📄 {evt.file}</span>}
                          {evt.device && <span className="text-amber-300">💾 {evt.device}</span>}
                          {!evt.file && !evt.device && <span className="text-slate-600">—</span>}
                        </td>
                        <td className="p-3 text-right text-slate-500 hover:text-cyan-400">
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Explainable Reasoning & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Explainable Reasoning */}
            <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    4. Explainable Reasoning & Validation
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {result.explainability.total_evaluated} Evaluated
                </span>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {result.explainability.item_explanations.map((exp) => (
                  <div 
                    key={exp.event_id}
                    className="p-3.5 rounded-lg bg-[#0e1424] border border-[#1f2a40] space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between border-b border-[#1a2334] pb-1.5">
                      <span className="text-cyan-300 font-bold">Why was {exp.event_id} retrieved?</span>
                      <span className="text-[10px] text-slate-500">{exp.timestamp}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {exp.steps.map((st, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-slate-300">
                            <span className="font-semibold text-slate-200">{st.criterion}:</span>{' '}
                            <span className="text-slate-400">{st.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#090d16] border border-cyan-500/20 text-xs font-mono text-cyan-200">
                {result.explainability.summary_verdict}
              </div>
            </div>

            {/* Interactive Timeline of this Investigation */}
            <div className="bg-[#0c111e] rounded-xl border border-[#1e2a40] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    Investigation Temporal Timeline
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Chronological Ordering
                </span>
              </div>

              <div className="relative pl-6 space-y-4 max-h-[380px] overflow-y-auto pr-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#1e2a40]">
                {result.timeline.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      item.is_landmark
                        ? 'bg-cyan-500 border-white shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                        : item.status === 'FAILED'
                        ? 'bg-rose-500 border-rose-950'
                        : 'bg-emerald-500 border-emerald-950'
                    }`} />
                    
                    <div className={`p-3 rounded-lg border text-xs font-mono transition ${
                      item.is_landmark
                        ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md'
                        : 'bg-[#0e1424] border-[#1e2a40]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${item.is_landmark ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {item.action}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.delta_from_landmark}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.timestamp} | {item.user} @ {item.machine}
                      </div>
                      {item.file && <div className="text-[11px] text-cyan-400 mt-1">File: {item.file}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Official Report Modal */}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          result={result}
          investigator={currentUser || 'Gopal'}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};
