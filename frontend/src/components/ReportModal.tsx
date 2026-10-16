import React, { useEffect } from 'react';
import { X, Printer, Copy, Check, ShieldAlert, FileCheck } from 'lucide-react';
import { InvestigationResult } from '../types';

interface ReportModalProps {
  isOpen?: boolean;
  result: InvestigationResult | null;
  investigator: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen = true, 
  result, 
  investigator, 
  onClose 
}) => {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen || !result) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, result, onClose]);

  if (!isOpen || !result) return null;

  const now = new Date().toUTCString();
  const summaryText = result.evidence_count === 0
    ? 'No matching forensic events were identified under the requested criteria and temporal bounds.'
    : `${result.evidence_count} relevant forensic event(s) were identified satisfying the query conditions (${result.interpretation.explanation_summary}).`;

  const handleCopyMarkdown = () => {
    const md = `
# FORENSIQ DIGITAL FORENSIC INVESTIGATION REPORT
*Generated automatically by FORENSIQ NLP & Temporal Query Engine*

- **Date of Investigation:** ${now}
- **Assigned Investigator:** ${investigator}
- **Case Reference:** CAS-2026-LIVE
- **System Target:** Unified Forensic Store (SQLite Engine)

---

### 1. Investigator Query
> "${result.query}"

### 2. Semantic Query Interpretation
- **Identified Intent:** ${result.interpretation.intent}
- **Target Event Type:** ${result.interpretation.event_type}
- **Status Filter:** ${result.interpretation.status || 'UNSPECIFIED'}
- **Temporal Constraint:** ${result.interpretation.temporal_relation || 'NONE'}
- **Reference Landmark:** ${result.interpretation.reference_event || 'NONE'}
- **Time Window:** ${result.interpretation.time_window_minutes ? result.interpretation.time_window_minutes + ' minutes' : 'UNBOUNDED'}

### 3. Structured Forensic Query
\`\`\`json
${JSON.stringify(result.structured_query, null, 2)}
\`\`\`

### 4. Forensic Evidence Summary
- **Total Correlated Events:** ${result.evidence_count}
- **Summary Finding:** ${summaryText}

| Event ID | Timestamp | Action | Status | User | Machine | Source |
|---|---|---|---|---|---|---|
${result.evidence.map(e => `| ${e.event_id} | ${e.timestamp} | ${e.action} | ${e.status} | ${e.user} | ${e.machine} | ${e.source} |`).join('\n')}

### 5. Explainable Reasoning Breakdown
${result.explainability.item_explanations.map(exp => `
#### Event: ${exp.event_id} (${exp.timestamp})
${exp.steps.map(s => `- [x] **${s.criterion}**: ${s.details}`).join('\n')}
`).join('\n')}

### 6. Investigation Conclusion & Objective Assessment
${result.explainability.summary_verdict}
*Note: All events have been cryptographically preserved and logged with provenance metadata. Findings represent correlated factual telemetry.*
`;

    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#0d121f] border border-[#1f2a40] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 bg-[#111728] border-b border-[#1f2a40] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
                FORENSIQ Forensic Incident Report
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  CONFIDENTIAL
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Case CAS-2026-LIVE | Generated {now}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied MD' : 'Copy Report'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-8 space-y-6 overflow-y-auto text-slate-200 text-sm print:text-black print:bg-white">
          {/* Header block */}
          <div className="border-b border-[#1f2a40] pb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                DIGITAL FORENSIC INVESTIGATION REPORT
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Automated NLP & Temporal Evidence Correlator
              </p>
            </div>
            <div className="text-right text-xs font-mono space-y-1 text-slate-400">
              <p>Investigator: <span className="text-white font-semibold">{investigator}</span></p>
              <p>Machine: <span className="text-white">FORENSIQ-PC</span></p>
              <p>Storage: <span className="text-cyan-400">SQLite Unified Store</span></p>
            </div>
          </div>

          {/* Section 1: Query & Intent */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              1. Investigator Inquiry & Semantic Interpretation
            </h4>
            <div className="p-3.5 rounded-lg bg-[#111728] border border-[#1f2a40] space-y-2 font-mono text-xs">
              <p><strong className="text-slate-400">Query Text:</strong> "{result.query}"</p>
              <p><strong className="text-slate-400">Interpreted Intent:</strong> {result.interpretation.intent}</p>
              <p><strong className="text-slate-400">Target Event Type:</strong> {result.interpretation.event_type} | <strong className="text-slate-400">Status:</strong> {result.interpretation.status || 'ANY'}</p>
              <p><strong className="text-slate-400">Temporal Condition:</strong> {result.interpretation.temporal_relation || 'NONE'} {result.interpretation.reference_event || ''} {result.interpretation.time_window_minutes ? `(Window: ${result.interpretation.time_window_minutes} min)` : ''}</p>
            </div>
          </div>

          {/* Section 2: Structured Query */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              2. Structured Query Translation
            </h4>
            <pre className="p-3.5 rounded-lg bg-[#0a0e17] border border-[#1a2334] text-xs font-mono text-cyan-300 overflow-x-auto">
              {JSON.stringify(result.structured_query, null, 2)}
            </pre>
          </div>

          {/* Section 3: Evidence Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                3. Retrieved Forensic Evidence ({result.evidence_count} Events)
              </h4>
            </div>

            {result.evidence_count === 0 ? (
              <div className="p-4 rounded-lg bg-[#111728] border border-[#1f2a40] text-slate-400 text-xs italic">
                No matching forensic events were found for the requested conditions.
              </div>
            ) : (
              <div className="border border-[#1f2a40] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-[#111728] text-slate-400 border-b border-[#1f2a40]">
                    <tr>
                      <th className="p-2.5">Event ID</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2a40] bg-[#0c101c]">
                    {result.evidence.map((evt) => (
                      <tr key={evt.event_id}>
                        <td className="p-2.5 text-cyan-300 font-semibold">{evt.event_id}</td>
                        <td className="p-2.5 text-slate-300">{evt.timestamp}</td>
                        <td className="p-2.5 text-white">{evt.action}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            evt.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{evt.user}</td>
                        <td className="p-2.5 text-slate-400">{evt.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Explainable Reasoning */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              4. Explainable AI Validation & Provenance
            </h4>
            <div className="space-y-2">
              {result.explainability.item_explanations.map((exp) => (
                <div key={exp.event_id} className="p-3 rounded-lg bg-[#111728] border border-[#1f2a40] text-xs">
                  <div className="font-mono text-cyan-300 font-semibold mb-2">
                    Evidence ID: {exp.event_id}
                  </div>
                  <div className="space-y-1">
                    {exp.steps.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>{st.criterion}:</strong> {st.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Conclusion */}
          <div className="p-4 rounded-lg bg-[#0e1627] border border-cyan-500/30 text-xs space-y-1">
            <h5 className="font-semibold text-cyan-300 font-mono uppercase tracking-wider">
              Objective Forensic Conclusion
            </h5>
            <p className="text-slate-300 leading-relaxed">
              {result.explainability.summary_verdict} All artifacts were validated through deterministic temporal criteria and normalized forensic logging protocols.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111728] border-t border-[#1f2a40] flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>FORENSIQ Autonomous Evidence Audit Module</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
