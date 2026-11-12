import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Check
} from 'lucide-react';
import { Alert } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';

interface AlertsViewProps {
  alerts: Alert[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToCase: (caseId: number) => void;
  onNavigateToInvestigator: (accountId: number) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  loading,
  onRefresh,
  onNavigateToCase,
  onNavigateToInvestigator,
}) => {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (alertId: number, newStatus: string) => {
    try {
      setUpdatingId(alertId);
      await api.updateAlertStatus(alertId, newStatus);
      onRefresh();
    } catch (e) {
      console.error('Failed to update alert status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEscalate = async (alertId: number) => {
    try {
      setUpdatingId(alertId);
      const res = await api.escalateAlertToCase(alertId);
      if (res.success && res.case_id) {
        onRefresh();
        onNavigateToCase(res.case_id);
      }
    } catch (e) {
      console.error('Failed to escalate alert', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchAcc = (a.account_number || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAcc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Top Filter Bar */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by title, description, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cyber-950 border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Severity & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED_TO_CASE">Escalated to Case</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Refresh Alert Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';

          return (
            <div
              key={alert.id}
              className={`bg-cyber-900 border rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCritical
                  ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-cyber-900 to-cyber-900'
                  : 'border-cyber-border hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border shrink-0 mt-1 ${
                  isCritical
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                }`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold font-mono text-slate-100">{alert.title}</h3>
                    <RiskBadge level={alert.severity} score={alert.risk_score} />
                    <StatusBadge status={alert.status} />
                  </div>

                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    {alert.account_id && (
                      <button
                        onClick={() => onNavigateToInvestigator(alert.account_id!)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        Entity: {alert.account_number || `ACC-${alert.account_id}`}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {alert.amount && (
                      <span>Amount: <strong className="text-slate-200">${alert.amount.toLocaleString()}</strong></span>
                    )}
                    <span>Logged: {new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center font-mono text-xs">
                {alert.status === 'OPEN' && (
                  <button
                    disabled={updatingId === alert.id}
                    onClick={() => handleStatusChange(alert.id, 'ACKNOWLEDGED')}
                    className="px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}

                {alert.status !== 'ESCALATED_TO_CASE' && (
                  <button
                    disabled={updatingId === alert.id}
                    onClick={() => handleEscalate(alert.id)}
                    className="px-3.5 py-1.5 rounded-lg font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Escalate to Case
                  </button>
                )}

                {alert.status !== 'RESOLVED' && alert.status !== 'ESCALATED_TO_CASE' && (
                  <button
                    disabled={updatingId === alert.id}
                    onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-cyber-900 border border-cyber-border rounded-xl p-12 text-center text-slate-500 font-mono text-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
            <p className="text-slate-300 text-sm font-semibold">No Alerts Match Criteria</p>
            <p>All suspicious activity in the selected view has been addressed or no items trigger this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
