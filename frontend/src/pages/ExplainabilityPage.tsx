import React, { useState } from 'react';
import { 
  Cpu, 
  ArrowDown, 
  CheckCircle2, 
  HelpCircle, 
  Code, 
  Search, 
  Layers, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  Database,
  Terminal
} from 'lucide-react';

export const ExplainabilityPage: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState(0);

  const pipelineExamples = [
    {
      title: 'Authentication Anomaly (Demo 1)',
      query: 'Show me failed login attempts before the successful login.',
      interpretation: {
        intent: 'Authentication Investigation',
        event_type: 'Authentication',
        action: 'FAILED_LOGIN',
        status: 'FAILED',
        temporal_relation: 'BEFORE',
        reference_event: 'successful_login',
        time_window: 'Unbounded preceding reference point'
      },
      structured_query: {
        intent: 'authentication_investigation',
        event_type: 'authentication',
        action: 'FAILED_LOGIN',
        status: 'FAILED',
        temporal_relation: 'BEFORE',
        reference_event: 'successful_login'
      },
      temporal_logic: '1. Resolve landmark event WHERE action = "SUCCESSFUL_LOGIN" -> Found EVT-AUTH-0013 (T_ref = 16:33:02 UTC)\n2. Formulate filter condition: timestamp < 16:33:02 UTC\n3. Match status = "FAILED" AND action = "FAILED_LOGIN"',
      retrieved: [
        { id: 'EVT-AUTH-0010', time: '16:32:11 UTC', delta: '-51s', action: 'FAILED_LOGIN', user: 'Gopal' },
        { id: 'EVT-AUTH-0011', time: '16:32:24 UTC', delta: '-38s', action: 'FAILED_LOGIN', user: 'Gopal' },
        { id: 'EVT-AUTH-0012', time: '16:32:41 UTC', delta: '-21s', action: 'FAILED_LOGIN', user: 'Gopal' }
      ],
      reasoning: [
        '✓ Event Type Verification: event_type equals "authentication"',
        '✓ Forensic Action Matching: action equals "FAILED_LOGIN"',
        '✓ Status Verification: status equals "FAILED"',
        '✓ Landmark Temporal Precedence: Event timestamp precedes landmark EVT-AUTH-0013',
        '✓ Provenance Authenticity: Generated automatically by Application Login layer'
      ]
    },
    {
      title: 'Removable Storage Exfiltration (Demo 2)',
      query: 'What files were copied to USB after it was connected?',
      interpretation: {
        intent: 'USB Exfiltration Investigation',
        event_type: 'File',
        action: 'FILE_COPY',
        device: 'USB-001',
        temporal_relation: 'AFTER',
        reference_event: 'usb_connected',
        time_window: 'Subsequent to mounting event'
      },
      structured_query: {
        intent: 'usb_investigation',
        event_type: 'file',
        action: 'FILE_COPY',
        device_filter: 'USB',
        temporal_relation: 'AFTER',
        reference_event: 'usb_connected'
      },
      temporal_logic: '1. Resolve landmark event WHERE action = "USB_CONNECTED" -> Found EVT-USB-0014 (T_ref = 14:32:10 UTC)\n2. Formulate filter condition: timestamp > 14:32:10 UTC\n3. Match action = "FILE_COPY" AND (device LIKE "%USB%" OR metadata LIKE "%USB%")',
      retrieved: [
        { id: 'EVT-FILE-0016', time: '14:34:17 UTC', delta: '+2m 07s', action: 'FILE_COPY (Financial_Report.xlsx)', user: 'Gopal' }
      ],
      reasoning: [
        '✓ Event Type Verification: event_type equals "file"',
        '✓ Action Verification: action equals "FILE_COPY"',
        '✓ Destination Verification: destination peripheral tagged as "USB-001"',
        '✓ Temporal Sequence: File copy occurred 127 seconds AFTER USB insertion landmark',
        '✓ Objectivity Guarantee: Correlated as potentially significant evidence without speculation'
      ]
    }
  ];

  const ex = pipelineExamples[selectedExample];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transparent, Auditable, and Deterministic Explainable AI</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
          Explainable Reasoning Architecture
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          FORENSIQ does not treat AI as a "black box" or hallucinate ungrounded accusations. Every investigator query is deterministically transformed into structured parameters, temporally verified, and justified step-by-step.
        </p>
      </div>

      {/* Example Selector */}
      <div className="flex gap-3">
        {pipelineExamples.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedExample(idx)}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-semibold transition border ${
              selectedExample === idx
                ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-[#0c111e] border-[#1e2a40] text-slate-400 hover:text-white'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="space-y-6">
        {/* Step 1: Natural Language */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-lg relative">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-2">
            <Search className="w-4 h-4" />
            <span>STEP 1: ORIGINAL INVESTIGATOR NATURAL LANGUAGE QUERY</span>
          </div>
          <p className="text-lg font-mono text-white bg-[#07090e] p-4 rounded-lg border border-[#1b2438]">
            "{ex.query}"
          </p>
        </div>

        <div className="flex justify-center text-cyan-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* Step 2: NLP Semantic Interpretation */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-3">
            <Cpu className="w-4 h-4" />
            <span>STEP 2: DETERMINISTIC NLP INTERPRETATION</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            {Object.entries(ex.interpretation).map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-[#0e1424] border border-[#1f2a40]">
                <span className="text-[10px] text-slate-500 uppercase block">{k.replace('_', ' ')}</span>
                <span className="text-white font-semibold mt-1 block">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center text-cyan-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* Step 3: Structured Forensic Query */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-3">
            <Code className="w-4 h-4" />
            <span>STEP 3: STRUCTURED FORENSIC QUERY SPECIFICATION (JSON)</span>
          </div>
          <pre className="p-4 rounded-lg bg-[#07090e] border border-[#1b2438] text-xs font-mono text-cyan-300 overflow-x-auto">
            {JSON.stringify(ex.structured_query, null, 2)}
          </pre>
        </div>

        <div className="flex justify-center text-cyan-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* Step 4: Temporal Engine Resolution */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-3">
            <Clock className="w-4 h-4" />
            <span>STEP 4: TEMPORAL ENGINE RESOLUTION & INTERVAL FILTERING</span>
          </div>
          <pre className="p-4 rounded-lg bg-[#07090e] border border-[#1b2438] text-xs font-mono text-amber-300 whitespace-pre-line">
            {ex.temporal_logic}
          </pre>
        </div>

        <div className="flex justify-center text-cyan-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* Step 5: Retrieved Evidence */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-3">
            <Database className="w-4 h-4" />
            <span>STEP 5: RETRIEVED FORENSIC EVIDENCE ({ex.retrieved.length} EVENTS)</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {ex.retrieved.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0e1424] border border-[#1f2a40] flex items-center justify-between">
                <div>
                  <span className="text-cyan-300 font-bold mr-2">{r.id}</span>
                  <span className="text-white font-semibold">{r.action}</span>
                  <span className="text-slate-400 text-[11px] ml-2">by {r.user}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">{r.delta} relative to landmark</span>
                  <span>{r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center text-cyan-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* Step 6: Explainable Reasoning */}
        <div className="bg-[#0c111e] p-6 rounded-xl border border-emerald-500/40 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>STEP 6: STEP-BY-STEP AUDITABLE EXPLAINABLE REASONING</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {ex.reasoning.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0e1424] border border-[#1f2a40] flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
