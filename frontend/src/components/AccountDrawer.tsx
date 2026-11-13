import React, { useState } from 'react';
import { AccountDossier, Transaction } from '../types.ts';
import {
  XIcon,
  CopyIcon,
  LockIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  ActivityIcon,
} from './Icons.tsx';

interface AccountDrawerProps {
  account: AccountDossier | null;
  isLoading: boolean;
  onClose: () => void;
  onFreeze: (accountId: string) => void;
  onEscalate: (accountId: string) => void;
  transactions: Transaction[];
  onSelectCounterparty: (accountId: string) => void;
}

export function AccountDrawer({
  account,
  isLoading,
  onClose,
  onFreeze,
  onEscalate,
  transactions,
  onSelectCounterparty,
}: AccountDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!account && !isLoading) {
    return null;
  }

  const handleCopy = () => {
    if (account?.account_id) {
      navigator.clipboard?.writeText(account.account_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFreeze = async () => {
    if (!account) return;
    await onFreeze(account.account_id);
    setActionSuccess('Account assets successfully frozen across all clearing channels.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleEscalate = async () => {
    if (!account) return;
    await onEscalate(account.account_id);
    setActionSuccess('Account flagged and escalated to Tier-2 Special Investigations Squad.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Associated transactions for this account
  const accountTransactions = transactions.filter(
    (tx) => tx.from === account?.account_id || tx.to === account?.account_id
  );

  const isHigh = account?.level === 'HIGH';
  const isSuspicious = account?.level === 'MEDIUM';
  const isFrozen = account?.case_status === 'frozen';
  const isEscalated = account?.case_status === 'escalated';

  return (
    <aside className="fixed lg:relative inset-y-0 right-0 w-full sm:w-[380px] lg:w-[380px] shrink-0 bg-[#0b1329]/95 backdrop-blur-2xl border-l border-[rgba(56,189,248,0.2)] shadow-2xl z-40 flex flex-col justify-between overflow-y-auto h-full">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-[rgba(56,189,248,0.14)] flex items-center justify-between bg-[#080d1a]/80">
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-[10px] uppercase text-[#00f2fe] font-bold tracking-wider px-2 py-0.5 rounded bg-[#0f1c3f] border border-[rgba(0,242,254,0.3)]">
              DOSSIER DRILL-DOWN
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close account dossier drawer"
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f] transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {isLoading || !account ? (
          <div className="p-8 text-center text-xs font-mono-data text-[#94a3b8]">
            <div className="w-8 h-8 rounded-full border-2 border-[#00f2fe] border-t-transparent animate-spin mx-auto mb-3" />
            Querying node entity telemetry from api.js...
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Account ID Hero */}
            <div className="glass-panel p-3.5 rounded-lg border border-[rgba(56,189,248,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono-data text-[#94a3b8] uppercase tracking-wider">
                  Target Entity ID
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-mono-data text-[#38bdf8] hover:text-[#00f2fe]"
                  title="Copy ID to clipboard"
                >
                  <CopyIcon size={12} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-mono-data font-bold text-2xl text-[#f8fafc] tracking-tight">
                  {account.account_id}
                </h3>
                <div>
                  {isFrozen ? (
                    <span className="px-2 py-0.5 rounded bg-[rgba(148,163,184,0.2)] text-[#cbd5e1] border border-[rgba(148,163,184,0.45)] text-xs font-mono-data font-bold flex items-center gap-1">
                      <LockIcon size={12} /> FROZEN
                    </span>
                  ) : isEscalated ? (
                    <span className="px-2 py-0.5 rounded bg-[rgba(168,85,247,0.2)] text-[#c084fc] border border-[rgba(168,85,247,0.45)] text-xs font-mono-data font-bold flex items-center gap-1">
                      <ArrowUpRightIcon size={12} /> ESCALATED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border border-[rgba(244,63,94,0.3)] text-xs font-mono-data font-bold">
                      CASE: OPEN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {actionSuccess && (
              <div className="p-2.5 rounded bg-[#0f1c3f] border border-[#00f2fe] text-xs font-mono-data text-[#00f2fe] flex items-center gap-2 glow-cyan">
                <CheckCircleIcon size={14} className="shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Score & Risk Gauge Card */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                isHigh
                  ? 'bg-[rgba(244,63,94,0.08)] border-[rgba(244,63,94,0.35)] glow-red'
                  : isSuspicious
                  ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.35)]'
                  : 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.35)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#94a3b8]">
                  Threat Confidence Score
                </span>
                <span
                  className={`font-mono-data text-xs font-bold px-2 py-0.5 rounded ${
                    isHigh
                      ? 'bg-[#f43f5e] text-[#080d1a]'
                      : isSuspicious
                      ? 'bg-[#f59e0b] text-[#080d1a]'
                      : 'bg-[#10b981] text-[#080d1a]'
                  }`}
                >
                  {account.level} RISK
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono-data font-extrabold text-3xl text-[#f8fafc]">
                  {account.score}
                </span>
                <span className="font-mono-data text-xs text-[#94a3b8]">/ 100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#080d1a] h-2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.08)]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isHigh ? 'bg-[#f43f5e]' : isSuspicious ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                  }`}
                  style={{ width: `${account.score}%` }}
                />
              </div>
            </div>

            {/* Entity Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
              <div className="glass-panel p-2.5 rounded">
                <div className="text-[10px] text-[#94a3b8] uppercase">Account Age</div>
                <div className="text-sm font-bold text-[#f8fafc] mt-0.5">
                  {account.age_days} <span className="text-xs font-normal text-[#94a3b8]">days</span>
                </div>
              </div>

              <div className="glass-panel p-2.5 rounded">
                <div className="text-[10px] text-[#94a3b8] uppercase">Counterparties</div>
                <div className="text-sm font-bold text-[#38bdf8] mt-0.5">
                  {account.counterparties} <span className="text-xs font-normal text-[#94a3b8]">entities</span>
                </div>
              </div>
            </div>

            {/* Forensic Reasons */}
            <div className="glass-panel p-3.5 rounded-lg">
              <div className="text-[10px] font-mono-data text-[#94a3b8] uppercase tracking-wider mb-2 font-semibold">
                Forensic Indicators (Detection Reasons)
              </div>
              <ul className="space-y-1.5 text-xs font-mono-data">
                {account.reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 p-1.5 rounded bg-[#070b16] border border-[rgba(56,189,248,0.15)] text-[#dee2f5]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] mt-1 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Enforcement Actions */}
            <div className="space-y-2 pt-2 border-t border-[rgba(56,189,248,0.14)]">
              <div className="text-[10px] font-mono-data text-[#94a3b8] uppercase tracking-wider font-semibold">
                Enforcement Protocol
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleFreeze}
                  disabled={isFrozen}
                  className={`py-2 px-3 rounded text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isFrozen
                      ? 'bg-[#1e293b] text-[#cbd5e1] border border-[#94a3b8]/50 cursor-not-allowed opacity-85'
                      : 'bg-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.35)] text-[#f43f5e] border border-[#ef4444] glow-red shadow-lg'
                  }`}
                >
                  <LockIcon size={14} />
                  <span>{isFrozen ? 'FROZEN' : 'FREEZE'}</span>
                </button>

                <button
                  onClick={handleEscalate}
                  disabled={isEscalated}
                  className={`py-2 px-3 rounded text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isEscalated
                      ? 'bg-[#0f1c3f] text-[#c084fc] border border-[#a855f7]/50 cursor-not-allowed opacity-85'
                      : 'bg-[rgba(168,85,247,0.18)] hover:bg-[rgba(168,85,247,0.32)] text-[#c084fc] border border-[#a855f7]'
                  }`}
                >
                  <ArrowUpRightIcon size={14} />
                  <span>{isEscalated ? 'ESCALATED' : 'ESCALATE'}</span>
                </button>
              </div>
            </div>

            {/* Associated Transaction Flow */}
            <div className="space-y-2 pt-2 border-t border-[rgba(56,189,248,0.14)]">
              <div className="flex items-center justify-between text-[10px] font-mono-data text-[#94a3b8] uppercase tracking-wider">
                <span>Associated Transactions</span>
                <span className="text-[#00f2fe]">{accountTransactions.length} Flows</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {accountTransactions.length === 0 ? (
                  <div className="text-center py-3 text-xs font-mono-data text-[#94a3b8]">
                    No immediate transaction records in 50-item sample
                  </div>
                ) : (
                  accountTransactions.map((tx) => {
                    const isInbound = tx.to === account.account_id;
                    const counterparty = isInbound ? tx.from : tx.to;
                    return (
                      <div
                        key={tx.id}
                        className="p-2 rounded bg-[#070b16] border border-[rgba(56,189,248,0.12)] text-[11px] font-mono-data flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                isInbound
                                  ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981]'
                                  : 'bg-[rgba(244,63,94,0.2)] text-[#f43f5e]'
                              }`}
                            >
                              {isInbound ? 'INBOUND' : 'OUTBOUND'}
                            </span>
                            <button
                              onClick={() => onSelectCounterparty(counterparty)}
                              className="text-[#f8fafc] hover:text-[#00f2fe] underline font-semibold"
                              title={`Drill down to ${counterparty}`}
                            >
                              {counterparty}
                            </button>
                          </div>
                          <div className="text-[10px] text-[#94a3b8] mt-0.5">
                            {tx.channel} &bull; {tx.time.slice(11, 19)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-[#f8fafc]">
                            ₹{tx.amount.toLocaleString()}
                          </div>
                          <div
                            className={`text-[10px] uppercase ${
                              tx.status === 'high' ? 'text-[#f43f5e]' : 'text-[#94a3b8]'
                            }`}
                          >
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-[rgba(56,189,248,0.14)] bg-[#080d1a] text-[10px] font-mono-data text-[#94a3b8] text-center">
        FRAUDGRAPH FORENSIC INTELLIGENCE ENGINE &bull; CONFIDENTIAL
      </div>
    </aside>
  );
}
