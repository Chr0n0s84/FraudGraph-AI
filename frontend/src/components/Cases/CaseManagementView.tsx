import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  User,
  MessageSquare,
  History,
  Send,
  X
} from 'lucide-react';
import type { CaseItem } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';

interface CaseManagementViewProps {
  initialCaseId?: number;
  onNavigateToInvestigator: (accountId: number) => void;
}

export const CaseManagementView: React.FC<CaseManagementViewProps> = ({
  initialCaseId,
  onNavigateToInvestigator,
}) => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newNote, setNewNote] = useState('');
  const [noteAuthor] = useState('Analyst Sarah Jenkins');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    assigned_to: 'Lead Analyst Sarah Jenkins',
    risk_score: 85.0,
    target_account_id: 51,
    evidence_summary: '',
  });

  const fetchCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
      if (initialCaseId) {
        const found = data.find((c) => c.id === initialCaseId);
        if (found) setSelectedCase(found);
      }
    } catch (e) {
      console.error('Failed to load cases', e);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [initialCaseId]);

  const handleSelectCase = async (caseId: number) => {
    try {
      const detail = await api.getCaseDetail(caseId);
      setSelectedCase(detail);
    } catch (e) {
      console.error('Failed to load case detail', e);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCase) return;
    try {
      const updated = await api.updateCaseStatus(
        selectedCase.id,
        newStatus,
        noteAuthor,
        `Status updated to ${newStatus}`
      );
      setSelectedCase(updated);
      fetchCases();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNote.trim()) return;
    try {
      setSubmittingNote(true);
      await api.addCaseNote(selectedCase.id, newNote.trim(), noteAuthor);
      setNewNote('');
      handleSelectCase(selectedCase.id);
    } catch (e) {
      console.error('Failed to add note', e);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCase(createForm);
      setShowCreateModal(false);
      fetchCases();
      setSelectedCase(created);
    } catch (e) {
      console.error('Failed to create case', e);
    }
  };

  const statusColumns = [
    { key: 'OPEN', label: 'Open Queue' },
    { key: 'INVESTIGATING', label: 'In Active Investigation' },
    { key: 'ESCALATED', label: 'Escalated / FIU' },
    { key: 'CLOSED_CONFIRMED_FRAUD', label: 'Confirmed Fraud' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-5 shadow-glass flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Financial Crime Investigation Cases
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Track, escalate, and document money mule rings and syndicate operations
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Investigation Case
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const colCases = cases.filter(
            (c) => c.status === col.key || (col.key === 'CLOSED_CONFIRMED_FRAUD' && c.status.startsWith('CLOSED'))
          );

          return (
            <div key={col.key} className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-4 shadow-glass flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono flex items-center justify-center font-bold">
                  {colCases.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className={`bg-white/[0.03] hover:bg-white/[0.07] border rounded-2xl p-4 transition-all duration-300 cursor-pointer space-y-2.5 shadow-sm ${
                      selectedCase?.id === c.id
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                        : 'border-white/10 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-cyan-400">{c.case_number}</span>
                      <RiskBadge level={c.priority} score={c.risk_score} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">
                      {c.title}
                    </h4>

                    {c.target_account_number && (
                      <p className="text-[11px] font-mono text-slate-400">
                        Target: <span className="text-slate-200">{c.target_account_number}</span>
                      </p>
                    )}

                    <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-cyan-400" /> {c.assigned_to.split(' ')[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-amber-400" /> {c.notes?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Detail Frosted Modal / Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="bg-slate-900/90 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono text-white">{selectedCase.case_number}</h3>
                    <RiskBadge level={selectedCase.priority} score={selectedCase.risk_score} />
                    <StatusBadge status={selectedCase.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-300 mt-0.5">{selectedCase.title}</h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Assigned Investigator</span>
                  <span className="text-white font-bold">{selectedCase.assigned_to}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Target Entity</span>
                  {selectedCase.target_account_id ? (
                    <button
                      onClick={() => onNavigateToInvestigator(selectedCase.target_account_id!)}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      {selectedCase.target_account_number || `ACC-${selectedCase.target_account_id}`}
                    </button>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Update Status</span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="CLOSED_CONFIRMED_FRAUD">CLOSED: CONFIRMED FRAUD</option>
                    <option value="CLOSED_FALSE_POSITIVE">CLOSED: FALSE POSITIVE</option>
                  </select>
                </div>
              </div>

              {selectedCase.evidence_summary && (
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 text-xs font-mono">
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">
                    Forensic Evidence Summary
                  </span>
                  <p className="text-slate-200 leading-relaxed">{selectedCase.evidence_summary}</p>
                </div>
              )}

              {/* Notes & Audit Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-4 h-4 text-cyan-400" /> Investigator Notes
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCase.notes?.map((n) => (
                      <div key={n.id} className="bg-white/[0.03] p-3 rounded-xl border border-white/10 text-xs font-mono">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-cyan-300">{n.author}</span>
                          <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200">{n.note}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add investigation finding or SAR note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-bold">
                    <History className="w-4 h-4 text-amber-400" /> Immutable Audit Trail
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {selectedCase.audit_logs?.map((a) => (
                      <div key={a.id} className="bg-white/[0.03] p-2.5 rounded-xl border border-white/10 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span className="text-amber-400 font-bold">{a.action}</span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-200 mt-0.5">{a.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="bg-slate-900/90 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold font-mono text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Open New Investigation Case
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Initiate formal anti-money laundering investigation
            </p>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Case Title</label>
                <input
                  type="text"
                  placeholder="e.g. Operation Chimera: Fan-In Funnel"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Target Account ID</label>
                <input
                  type="number"
                  value={createForm.target_account_id}
                  onChange={(e) => setCreateForm({ ...createForm, target_account_id: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Evidence Summary</label>
                <textarea
                  rows={3}
                  placeholder="Forensic indicators, IP analysis, graph topology details..."
                  value={createForm.evidence_summary}
                  onChange={(e) => setCreateForm({ ...createForm, evidence_summary: e.target.value })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
