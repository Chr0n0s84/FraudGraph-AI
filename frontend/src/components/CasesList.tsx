import React, { useMemo } from 'react';
import { Alert, CaseStatus, GraphNode, RiskLevel } from '../types.ts';
import { LayersIcon, LockIcon, ArrowUpRightIcon, ShieldAlertIcon } from './Icons.tsx';

interface CasesListProps {
  alerts: Alert[];
  accountStatuses: Record<string, CaseStatus>;
  graphNodes: GraphNode[];
  onSelectAccount: (accountId: string) => void;
  onFreezeAccount: (accountId: string) => void;
  onEscalateAccount: (accountId: string) => void;
}

interface CaseEntry {
  key: string;
  alert_id?: string;
  account_id: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  time?: string;
  case_status: CaseStatus;
}

const GROUP_CONFIG: Array<{
  status: CaseStatus;
  title: string;
  subtitle: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
}> = [
  {
    status: 'open',
    title: 'Open Cases',
    subtitle: 'Active alerts awaiting analyst enforcement',
    badgeClass: 'bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border-[rgba(244,63,94,0.35)]',
    dotClass: 'bg-[#f43f5e]',
    borderClass: 'border-[rgba(244,63,94,0.3)]',
  },
  {
    status: 'frozen',
    title: 'Frozen Cases',
    subtitle: 'Accounts locked across clearing channels',
    badgeClass: 'bg-[rgba(148,163,184,0.18)] text-[#cbd5e1] border-[rgba(148,163,184,0.45)]',
    dotClass: 'bg-[#64748b]',
    borderClass: 'border-[rgba(148,163,184,0.35)]',
  },
  {
    status: 'escalated',
    title: 'Escalated Cases',
    subtitle: 'Assigned to Tier-2 forensic investigation',
    badgeClass: 'bg-[rgba(168,85,247,0.18)] text-[#c084fc] border-[rgba(168,85,247,0.45)]',
    dotClass: 'bg-[#a855f7]',
    borderClass: 'border-[rgba(168,85,247,0.35)]',
  },
];

export function CasesList({
  alerts,
  accountStatuses,
  graphNodes,
  onSelectAccount,
  onFreezeAccount,
  onEscalateAccount,
}: CasesListProps) {
  const grouped = useMemo(() => {
    const groups: Record<CaseStatus, CaseEntry[]> = {
      open: [],
      frozen: [],
      escalated: [],
    };
    const seenAccounts = new Set<string>();

    for (const alert of alerts) {
      const effectiveStatus: CaseStatus =
        accountStatuses[alert.account_id] ?? alert.case_status ?? 'open';
      seenAccounts.add(alert.account_id);
      groups[effectiveStatus].push({
        key: alert.alert_id,
        alert_id: alert.alert_id,
        account_id: alert.account_id,
        score: alert.score,
        level: alert.level,
        reasons: alert.reasons,
        time: alert.time,
        case_status: effectiveStatus,
      });
    }

    // Include accounts frozen/escalated directly from graph or dossier that have no alert row
    for (const [accountId, status] of Object.entries(accountStatuses)) {
      if (seenAccounts.has(accountId) || status === 'open') continue;
      const node = graphNodes.find((n) => n.id === accountId);
      const score = node?.score ?? 0;
      const level: RiskLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
      groups[status].push({
        key: `ACC-${accountId}`,
        account_id: accountId,
        score,
        level,
        reasons: ['Direct account enforcement action'],
        case_status: status,
      });
    }

    return groups;
  }, [alerts, accountStatuses, graphNodes]);

  const totalCount =
    grouped.open.length + grouped.frozen.length + grouped.escalated.length;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-[#f8fafc] flex items-center gap-2">
            <LayersIcon size={18} className="text-[#00f2fe]" />
            Forensic Cases
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono-data">
            Grouped by case_status &bull; {totalCount} total tracked cases
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono-data text-xs">
          <span className="px-2.5 py-1 rounded border bg-[rgba(244,63,94,0.12)] text-[#f43f5e] border-[rgba(244,63,94,0.3)]">
            OPEN: {grouped.open.length}
          </span>
          <span className="px-2.5 py-1 rounded border bg-[rgba(148,163,184,0.15)] text-[#cbd5e1] border-[rgba(148,163,184,0.4)]">
            FROZEN: {grouped.frozen.length}
          </span>
          <span className="px-2.5 py-1 rounded border bg-[rgba(168,85,247,0.15)] text-[#c084fc] border-[rgba(168,85,247,0.4)]">
            ESCALATED: {grouped.escalated.length}
          </span>
        </div>
      </div>

      {/* Grouped Sections: open / frozen / escalated */}
      <div className="space-y-5">
        {GROUP_CONFIG.map((group) => {
          const items = grouped[group.status];
          return (
            <section
              key={group.status}
              data-case-group={group.status}
              className={`glass-panel rounded-lg border ${group.borderClass} overflow-hidden`}
            >
              <div className="px-4 py-3 bg-[#0b1329]/90 border-b border-[rgba(56,189,248,0.12)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${group.dotClass}`} />
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#f8fafc]">
                      {group.title}
                    </h3>
                    <p className="text-[11px] font-mono-data text-[#94a3b8]">
                      {group.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono-data text-xs px-2 py-0.5 rounded border font-bold ${group.badgeClass}`}
                >
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="px-4 py-5 text-xs font-mono-data text-[#64748b] text-center">
                  No {group.status} cases
                </div>
              ) : (
                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {items.map((item) => {
                    const isFrozen = item.case_status === 'frozen';
                    const isEscalated = item.case_status === 'escalated';
                    const isHigh = item.level === 'HIGH';

                    return (
                      <div
                        key={item.key}
                        className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[#0f1c3f]/50 transition-colors"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 font-mono-data">
                            {item.alert_id && (
                              <span className="text-xs font-bold text-[#38bdf8]">
                                {item.alert_id}
                              </span>
                            )}
                            <button
                              onClick={() => onSelectAccount(item.account_id)}
                              className="text-sm font-bold text-[#f8fafc] hover:text-[#00f2fe] hover:underline"
                              title={`Inspect ${item.account_id}`}
                            >
                              {item.account_id}
                            </button>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                isHigh
                                  ? 'bg-[#ef4444] text-[#080d1a]'
                                  : item.level === 'MEDIUM'
                                  ? 'bg-[#f97316] text-[#080d1a]'
                                  : 'bg-[#3b82f6] text-[#080d1a]'
                              }`}
                            >
                              {item.level} &bull; {item.score}
                            </span>

                            {isFrozen ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(148,163,184,0.18)] text-[#cbd5e1] border border-[rgba(148,163,184,0.45)] text-[10px] font-bold uppercase">
                                <LockIcon size={10} /> FROZEN
                              </span>
                            ) : isEscalated ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(168,85,247,0.18)] text-[#c084fc] border border-[rgba(168,85,247,0.45)] text-[10px] font-bold uppercase">
                                <ArrowUpRightIcon size={10} /> ESCALATED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border border-[rgba(244,63,94,0.35)] text-[10px] font-bold uppercase">
                                <ShieldAlertIcon size={10} /> OPEN
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.reasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-[#070b16] border border-[rgba(56,189,248,0.18)] text-[#cbd5e1]"
                              >
                                {reason}
                              </span>
                            ))}
                            {item.time && (
                              <span className="text-[11px] font-mono-data text-[#64748b] ml-1">
                                {item.time.replace('T', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono-data text-xs">
                          <button
                            onClick={() => onSelectAccount(item.account_id)}
                            className="py-1.5 px-3 rounded bg-[#0f1c3f] hover:bg-[#1a2744] border border-[rgba(56,189,248,0.3)] text-[#00f2fe] font-semibold transition-colors"
                          >
                            Dossier
                          </button>

                          {!isFrozen && (
                            <button
                              onClick={() => onFreezeAccount(item.account_id)}
                              className="py-1.5 px-3 rounded bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.3)] border border-[#ef4444] text-[#f43f5e] font-semibold transition-colors flex items-center gap-1"
                            >
                              <LockIcon size={12} />
                              Freeze
                            </button>
                          )}

                          {!isEscalated && (
                            <button
                              onClick={() => onEscalateAccount(item.account_id)}
                              className="py-1.5 px-3 rounded bg-[rgba(168,85,247,0.15)] hover:bg-[rgba(168,85,247,0.3)] border border-[#a855f7] text-[#c084fc] font-semibold transition-colors flex items-center gap-1"
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
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

