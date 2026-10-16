import React, { useEffect } from 'react';
import { X, Shield, Clock, Laptop, User, FileText, HardDrive, Tag } from 'lucide-react';
import { ForensicEvent } from '../types';

interface EventDetailModalProps {
  event: ForensicEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    if (!event) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0d121f] border border-[#1f2a40] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-[#111728] border-b border-[#1f2a40] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white font-mono">{event.event_id}</h3>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                  event.status === 'SUCCESS'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : event.status === 'FAILED'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}>
                  {event.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {event.dataset_label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{event.timestamp}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#12192a] p-3 rounded-lg border border-[#1f2a40]">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" /> Action / Operation
              </span>
              <p className="text-sm font-semibold text-white mt-1 font-mono">{event.action}</p>
            </div>

            <div className="bg-[#12192a] p-3 rounded-lg border border-[#1f2a40]">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> User Entity
              </span>
              <p className="text-sm font-semibold text-white mt-1 font-mono">{event.user}</p>
            </div>

            <div className="bg-[#12192a] p-3 rounded-lg border border-[#1f2a40]">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" /> Machine Host
              </span>
              <p className="text-sm font-semibold text-white mt-1 font-mono">{event.machine}</p>
            </div>

            <div className="bg-[#12192a] p-3 rounded-lg border border-[#1f2a40]">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Telemetry Source
              </span>
              <p className="text-sm font-semibold text-white mt-1 font-mono">{event.source}</p>
            </div>
          </div>

          {/* Description banner if present */}
          {event.description && (
            <div className="bg-[#12192a] p-3.5 rounded-lg border border-[#1f2a40] text-xs font-mono">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Forensic Description</span>
              <p className="text-slate-200">{event.description}</p>
            </div>
          )}

          {/* Artifact Details if present */}
          {(event.device || event.file || event.file_path || event.drive_letter || event.recipient) && (
            <div className="bg-[#12192a] p-4 rounded-lg border border-[#1f2a40] space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>Associated Forensic Artifacts</span>
                {event.is_suspicious === 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                    SUSPICIOUS TELEMETRY
                  </span>
                )}
              </h4>

              {event.file && (
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-cyan-500/30 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Target File: <strong className="text-white text-base">{event.file}</strong></span>
                    </div>
                    {event.action && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        event.action.includes('DELETE') ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                        event.action.includes('MODIF') || event.action.includes('MOVE') ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {event.action.includes('DELETE') ? 'DELETED' :
                         event.action.includes('MODIF') ? 'MODIFIED / EDITED' :
                         event.action.includes('MOVE') ? 'RENAMED / MOVED' : 'COPIED / WRITTEN'}
                      </span>
                    )}
                  </div>

                  {(event.file_path || event.metadata?.file_path) && (
                    <div className="text-xs text-slate-400 break-all pt-1">
                      <span className="text-slate-500">Full Endpoint Path: </span>
                      <span className="text-slate-300">{event.file_path || event.metadata?.file_path}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    {event.file_size !== undefined && event.file_size !== null && (
                      <span>
                        <span className="text-slate-500">Size: </span>
                        <strong className="text-emerald-400">
                          {event.file_size > 1048576
                            ? `${(event.file_size / 1048576).toFixed(2)} MB`
                            : event.file_size > 1024
                            ? `${(event.file_size / 1024).toFixed(1)} KB`
                            : `${event.file_size} B`}
                        </strong>
                      </span>
                    )}
                    {(event.drive_letter || event.metadata?.drive_letter) && (
                      <span>
                        <span className="text-slate-500">Drive Mount: </span>
                        <strong className="text-amber-300">{event.drive_letter || event.metadata?.drive_letter}</strong>
                      </span>
                    )}
                    {event.file_sensitivity && (
                      <span>
                        <span className="text-slate-500">Classification: </span>
                        <strong className="text-rose-400">{event.file_sensitivity}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {event.device && (
                <div className="flex items-center gap-2 text-sm text-amber-300 font-mono p-2.5 rounded bg-[#0a0f1d] border border-amber-500/20">
                  <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Peripheral Device: <strong className="text-white">{event.device}</strong></span>
                  {event.drive_letter && <span className="text-xs text-amber-400/80">({event.drive_letter})</span>}
                </div>
              )}

              {event.recipient && (
                <div className="flex items-center gap-2 text-sm text-indigo-300 font-mono p-2.5 rounded bg-[#0a0f1d] border border-indigo-500/20">
                  <span>Recipient: <strong className="text-white">{event.recipient}</strong></span>
                  {event.email_service && <span className="text-xs text-indigo-400/80">via {event.email_service}</span>}
                </div>
              )}
            </div>
          )}

          {/* Metadata JSON */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
              <span>Extended Forensic Metadata</span>
              <span className="text-[10px] text-slate-500 font-normal">JSON Schema</span>
            </h4>
            <pre className="bg-[#090d16] p-4 rounded-lg border border-[#1b2438] text-xs font-mono text-emerald-400 overflow-x-auto max-h-48">
              {JSON.stringify(event.metadata || {}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111728] border-t border-[#1f2a40] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
