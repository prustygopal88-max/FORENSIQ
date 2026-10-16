import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  FolderOpen, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { getCases, createCase } from '../api/client';
import { CaseItem } from '../types';

interface CasesPageProps {
  currentUser: string | null;
  onOpenCase: (caseId: string) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ currentUser, onOpenCase }) => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await getCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createCase(title.trim(), description.trim(), currentUser || 'Gopal');
      setTitle('');
      setDescription('');
      setShowCreateModal(false);
      await fetchCases();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2334] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forensic Incident Dossier Management</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
            Digital Forensic Cases
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Organize investigations, evidence correlation scopes, and investigator findings.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-semibold rounded-lg transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Forensic Case</span>
        </button>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-mono text-sm">
          Loading forensic dossiers...
        </div>
      ) : cases.length === 0 ? (
        <div className="p-8 text-center bg-[#0c111e] rounded-xl border border-[#1e2a40] text-slate-500 font-mono text-sm">
          No cases created yet. Click "New Forensic Case" above to start an investigation file.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div 
              key={c.case_id}
              className="bg-[#0c111e] p-6 rounded-xl border border-[#1e2a40] hover:border-cyan-500/40 transition shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {c.case_id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'INVESTIGATING'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : c.status === 'OPEN'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <h3 className="font-mono text-base font-semibold text-white leading-snug">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                  {c.description || 'No detailed briefing provided for this investigation.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1a2334] space-y-3 font-mono text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c.assigned_investigator}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c.created_date.split('T')[0]}</span>
                  </span>
                </div>

                <button
                  onClick={() => onOpenCase(c.case_id)}
                  className="w-full py-2 rounded-lg bg-[#111728] hover:bg-[#182238] border border-[#1e2a40] text-cyan-300 hover:text-white transition font-mono text-xs flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Dossier in Investigate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Case */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0d121f] border border-[#1f2a40] rounded-xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1a2334] pb-3">
              <h3 className="text-base font-semibold text-white font-mono">Create New Forensic Case</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Case Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unauthorized Credential Replay Analysis"
                  required
                  className="w-full p-2.5 bg-[#080b12] border border-[#1e2a40] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Investigation Scope & Description:</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe initial telemetry triggers, target host, and investigative hypothesis..."
                  className="w-full p-2.5 bg-[#080b12] border border-[#1e2a40] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {creating ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
