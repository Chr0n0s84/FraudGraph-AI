import React from 'react';
import { X, ShieldAlert, Cpu, Network, Zap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { TransactionDetail } from '../../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';

interface ExplainabilityModalProps {
  transaction: TransactionDetail | null;
  onClose: () => void;
  onEscalate?: (tx: TransactionDetail) => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  transaction,
  onClose,
  onEscalate,
}) => {
  if (!transaction) return null;

  const breakdown = transaction.risk_breakdown || {
    final_score: transaction.risk_score,
    risk_level: transaction.risk_level,
    is_flagged: transaction.is_flagged,
    factors: [],
    explanation_summary: transaction.detection_reasons || 'Standard transaction evaluation',
  };

  const getFactorIcon = (name: string) => {
    if (name.includes('Rules') || name.includes('AML')) return ShieldAlert;
    if (name.includes('Graph') || name.includes('Network')) return Network;
    if (name.includes('ML') || name.includes('Isolation')) return Cpu;
    return Zap;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900/90 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                Explainable Risk Assessment
                <RiskBadge level={transaction.risk_level} score={transaction.risk_score} />
              </h2>
              <p className="text-xs font-mono text-slate-400">
                TX: {transaction.tx_hash}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Box */}
          <div className={`p-4 rounded-2xl border backdrop-blur-md ${
            transaction.is_flagged
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
          }`}>
            <div className="flex items-start gap-3">
              {transaction.is_flagged ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold font-mono uppercase tracking-wide">
                  {transaction.is_flagged ? 'Suspicious AML Typologies Detected' : 'Transaction Cleared'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed text-slate-300">
                  {breakdown.explanation_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Amount</span>
              <span className="text-cyan-300 font-bold text-base">
                ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Channel</span>
              <span className="text-slate-200 font-semibold">{transaction.channel}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Status</span>
              <StatusBadge status={transaction.status} />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Pattern</span>
              <span className="text-amber-300 font-bold">{transaction.pattern_type || 'NORMAL'}</span>
            </div>
          </div>

          {/* Account Route Flow */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex-1">
              <span className="text-slate-400 text-[10px] uppercase block">Originator Account</span>
              <p className="font-semibold text-slate-100">{transaction.source_holder_name || 'Account'}</p>
              <p className="text-slate-400 text-[11px]">{transaction.source_account_number || `ACC-${transaction.source_account_id}`}</p>
            </div>
            <div className="px-4 text-cyan-400 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase">Transfer</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Beneficiary Account</span>
              <p className="font-semibold text-slate-100">{transaction.target_holder_name || 'Account'}</p>
              <p className="text-slate-400 text-[11px]">{transaction.target_account_number || `ACC-${transaction.target_account_id}`}</p>
            </div>
          </div>

          {/* Factor Breakdown Weights */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 mb-3 flex items-center justify-between font-bold">
              <span>Risk Factor Decomposition</span>
              <span className="text-slate-400 text-[11px]">Normalized Weight Contributions</span>
            </h4>
            <div className="space-y-3">
              {breakdown.factors.map((factor, idx) => {
                const Icon = getFactorIcon(factor.name);
                const pct = Math.min(100, factor.score);
                let barColor = 'bg-cyan-400 shadow-[0_0_8px_#00f2fe]';
                if (pct >= 80) barColor = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
                else if (pct >= 60) barColor = 'bg-amber-400 shadow-[0_0_8px_#f59e0b]';
                else if (pct >= 35) barColor = 'bg-cyan-400 shadow-[0_0_8px_#00f2fe]';
                else barColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';

                return (
                  <div key={idx} className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="flex items-center gap-2 text-slate-100 font-semibold">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        {factor.name}
                        <span className="text-[10px] text-slate-400 font-normal">({factor.weight}% weight)</span>
                      </span>
                      <span className="font-bold text-white">
                        Score: {factor.score} <span className="text-cyan-300 text-[11px] font-normal">(+{factor.contribution} pts)</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{factor.details}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Model: Ensemble Isolation Forest + Graph Centrality DFS
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
            >
              Dismiss
            </button>
            {transaction.is_flagged && onEscalate && (
              <button
                onClick={() => onEscalate(transaction)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                Escalate to Case
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
