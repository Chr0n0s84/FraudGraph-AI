import React from 'react';
import { Alert } from '../types.ts';
import { ShieldAlertIcon, LockIcon, ArrowUpRightIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons.tsx';

interface AlertsPanelProps {
  alerts: Alert[];
  onSelectAccount: (accountId: string) => void;
  onFreezeAccount: (accountId: string) => void;
  onEscalateAccount: (accountId: string) => void;
}

export function AlertsPanel({
  alerts,
  onSelectAccount,
  onFreezeAccount,
  onEscalateAccount,
}: AlertsPanelProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-display font-bold text-lg text-[#f8fafc] flex items-center gap-2">
            <ShieldAlertIcon size={18} className="text-[#f43f5e]" />
            Active Forensic Alerts Feed
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono-data">
            GET /alerts &bull; Monitored AML and illicit transaction triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border border-[rgba(244,63,94,0.3)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping" />
            {alerts.filter((a) => a.case_status === 'open').length} UNRESOLVED ALERTS
          </span>
        </div>
      </div>

      {/* Grid of Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {alerts.map((alert) => {
          const isHigh = alert.level === 'HIGH';
          const isFrozen = alert.case_status === 'frozen';
          const isEscalated = alert.case_status === 'escalated';

          return (
            <div
              key={alert.alert_id}
              className={`glass-panel p-4 rounded-lg border transition-all duration-200 relative overflow-hidden ${
                isFrozen
                  ? 'border-[#94a3b8]/50 bg-[#0b1329]/90'
                  : isEscalated
                  ? 'border-[#a855f7]/50 bg-[#0f1c3f]'
                  : isHigh
                  ? 'border-[rgba(244,63,94,0.4)] hover:border-[#f43f5e] bg-[#0b1329]'
                  : 'border-[rgba(245,158,11,0.3)] hover:border-[#f59e0b]'
              }`}
            >
              {/* Top Row: Alert ID, Account ID, and Level */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono-data font-bold text-xs text-[#38bdf8]">
                    {alert.alert_id}
                  </span>
                  <span className="text-[#475569] font-mono-data">&bull;</span>
                  <button
                    onClick={() => onSelectAccount(alert.account_id)}
                    className="font-mono-data font-bold text-sm text-[#f8fafc] hover:text-[#00f2fe] hover:underline"
                    title={`Inspect ${alert.account_id}`}
                  >
                    {alert.account_id}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Score badge */}
                  <span
                    className={`font-mono-data text-xs px-2 py-0.5 rounded font-bold ${
                      isHigh
                        ? 'bg-[rgba(244,63,94,0.2)] text-[#f43f5e] border border-[rgba(244,63,94,0.4)]'
                        : 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border border-[rgba(245,158,11,0.4)]'
                    }`}
                  >
                    SCORE {alert.score}
                  </span>

                  {/* Level chip */}
                  <span
                    className={`font-mono-data text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      isHigh ? 'bg-[#f43f5e] text-[#080d1a]' : 'bg-[#f59e0b] text-[#080d1a]'
                    }`}
                  >
                    {alert.level}
                  </span>
                </div>
              </div>

              {/* Reasons List Tags */}
              <div className="mb-3">
                <div className="text-[10px] font-mono-data text-[#94a3b8] uppercase mb-1">
                  Detection Vector
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {alert.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-[#070b16] border border-[rgba(56,189,248,0.2)] text-[#dee2f5]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timestamp & Case Status */}
              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs font-mono-data text-[#94a3b8] mb-3">
                <span>{alert.time.replace('T', ' ')}</span>
                <div>
                  {isFrozen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(148,163,184,0.18)] text-[#cbd5e1] border border-[rgba(148,163,184,0.45)] font-bold text-[11px]">
                      <LockIcon size={12} /> FROZEN
                    </span>
                  ) : isEscalated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(168,85,247,0.18)] text-[#c084fc] border border-[rgba(168,85,247,0.45)] font-bold text-[11px]">
                      <ArrowUpRightIcon size={12} /> ESCALATED
                    </span>
                  ) : (
                    <span className="text-[#f43f5e] text-[11px] font-semibold">
                      STATUS: OPEN
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectAccount(alert.account_id)}
                  className="flex-1 py-1.5 px-3 rounded bg-[#0f1c3f] hover:bg-[#1a2744] border border-[rgba(56,189,248,0.3)] text-[#00f2fe] text-xs font-mono-data font-semibold text-center transition-colors"
                >
                  Inspect Dossier
                </button>

                {!isFrozen && (
                  <button
                    onClick={() => onFreezeAccount(alert.account_id)}
                    className="py-1.5 px-3 rounded bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.3)] border border-[#ef4444] text-[#f43f5e] text-xs font-mono-data font-semibold transition-colors flex items-center gap-1"
                    title="Freeze account immediately"
                  >
                    <LockIcon size={12} />
                    Freeze
                  </button>
                )}

                {!isEscalated && (
                  <button
                    onClick={() => onEscalateAccount(alert.account_id)}
                    className="py-1.5 px-3 rounded bg-[rgba(168,85,247,0.15)] hover:bg-[rgba(168,85,247,0.3)] border border-[#a855f7] text-[#c084fc] text-xs font-mono-data font-semibold transition-colors flex items-center gap-1"
                    title="Escalate to Tier 2 Forensic Squad"
                  >
                    <ArrowUpRightIcon size={12} />
                    Escalate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
