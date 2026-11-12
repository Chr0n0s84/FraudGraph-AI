import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  Download,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Transaction, TransactionDetail } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ExplainabilityModal } from '../common/ExplainabilityModal';
import { api } from '../../services/api';

interface LiveTransactionsProps {
  transactions: Transaction[];
  loading: boolean;
  onRefresh: () => void;
  onEscalateToCase: (tx: TransactionDetail) => void;
}

export const LiveTransactions: React.FC<LiveTransactionsProps> = ({
  transactions,
  loading,
  onRefresh,
  onEscalateToCase,
}) => {
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionDetail | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [showInjectModal, setShowInjectModal] = useState(false);

  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Injection Form State
  const [injectForm, setInjectForm] = useState({
    source_account_id: 51,
    target_account_id: 52,
    amount: 9850.0,
    channel: 'WIRE',
  });
  const [injectSubmitting, setInjectSubmitting] = useState(false);
  const [injectError, setInjectError] = useState<string | null>(null);

  const handleRowClick = async (tx: Transaction) => {
    try {
      setFetchingDetail(true);
      const detail = await api.getTransactionDetail(tx.id);
      setSelectedTxDetail(detail);
    } catch (e) {
      console.error('Failed to fetch transaction detail', e);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleInjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInjectSubmitting(true);
    setInjectError(null);
    try {
      await api.createTransaction(injectForm);
      setShowInjectModal(false);
      onRefresh();
    } catch (err: any) {
      setInjectError(err.message || 'Failed to inject transaction');
    } finally {
      setInjectSubmitting(false);
    }
  };

  // Filter logic
  const filtered = transactions.filter((tx) => {
    if (riskFilter !== 'ALL' && tx.risk_level !== riskFilter) return false;
    if (channelFilter !== 'ALL' && tx.channel !== channelFilter) return false;
    if (flaggedOnly && !tx.is_flagged) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHash = tx.tx_hash.toLowerCase().includes(q);
      const matchSrc = (tx.source_account_number || '').toLowerCase().includes(q);
      const matchTgt = (tx.target_account_number || '').toLowerCase().includes(q);
      const matchHolder = (tx.source_holder_name || '').toLowerCase().includes(q);
      if (!matchHash && !matchSrc && !matchTgt && !matchHolder) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Top Filter Bar */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by TX hash, account number, or holder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cyber-950 border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Channel */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Channels</option>
            <option value="WIRE">WIRE</option>
            <option value="P2P">P2P</option>
            <option value="ACH">ACH</option>
            <option value="CRYPTO_RAMP">CRYPTO RAMP</option>
          </select>

          {/* Flagged Checkbox */}
          <label className="flex items-center gap-2 bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-xs font-mono text-slate-300 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
              className="rounded bg-cyber-900 border-cyber-border text-cyan-500 focus:ring-0"
            />
            <span>Flagged Only</span>
          </label>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Inject Test TX */}
          <button
            onClick={() => setShowInjectModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Inject Test TX
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-cyber-850 border-b border-cyber-border text-slate-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">TX Hash</th>
                <th className="py-3 px-4">Originator (Source)</th>
                <th className="py-3 px-4">Beneficiary (Target)</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pattern Typology</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => handleRowClick(tx)}
                  className={`hover:bg-cyber-800/80 cursor-pointer transition-colors ${
                    tx.risk_level === 'CRITICAL' ? 'bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-cyan-300 font-bold whitespace-nowrap">
                    {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-4)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-200">{tx.source_holder_name || `Acc #${tx.source_account_id}`}</div>
                    <div className="text-[10px] text-slate-500">{tx.source_account_number || `ACC-${tx.source_account_id}`}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-200">{tx.target_holder_name || `Acc #${tx.target_account_id}`}</div>
                    <div className="text-[10px] text-slate-500">{tx.target_account_number || `ACC-${tx.target_account_id}`}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-100">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                    {tx.channel}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`text-[11px] ${tx.pattern_type && tx.pattern_type !== 'NORMAL' ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                      {tx.pattern_type || 'NORMAL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(tx);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900 transition-colors"
                    >
                      Explain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainability Drawer Modal */}
      <ExplainabilityModal
        transaction={selectedTxDetail}
        onClose={() => setSelectedTxDetail(null)}
        onEscalate={onEscalateToCase}
      />

      {/* Inject Test Transaction Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cyber-900 border border-cyber-border-bright rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold font-mono text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Inject Test Transaction
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Test real-time AML typology detection & ML scoring pipeline
            </p>

            {injectError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono">
                {injectError}
              </div>
            )}

            <form onSubmit={handleInjectSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Source Account ID</label>
                <input
                  type="number"
                  value={injectForm.source_account_id}
                  onChange={(e) => setInjectForm({ ...injectForm, source_account_id: parseInt(e.target.value) || 1 })}
                  className="w-full bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
                <span className="text-[10px] text-slate-500">Accounts 51-55: Circular Ring | 65: Smurf Source</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Account ID</label>
                <input
                  type="number"
                  value={injectForm.target_account_id}
                  onChange={(e) => setInjectForm({ ...injectForm, target_account_id: parseInt(e.target.value) || 2 })}
                  className="w-full bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
                <span className="text-[10px] text-slate-500">Account 64: Fan-In Collector Mule | 66-73: Mule Drops</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transfer Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={injectForm.amount}
                  onChange={(e) => setInjectForm({ ...injectForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
                <span className="text-[10px] text-amber-400">Try $9,500 - $9,950 to trigger Structuring detection</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Channel</label>
                <select
                  value={injectForm.channel}
                  onChange={(e) => setInjectForm({ ...injectForm, channel: e.target.value })}
                  className="w-full bg-cyber-950 border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="WIRE">WIRE</option>
                  <option value="P2P">P2P</option>
                  <option value="ACH">ACH</option>
                  <option value="CRYPTO_RAMP">CRYPTO RAMP</option>
                  <option value="SWIFT">SWIFT</option>
                </select>
              </div>

              <div className="pt-3 border-t border-cyber-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:bg-cyber-800 border border-cyber-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={injectSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center gap-1.5"
                >
                  {injectSubmitting ? 'Evaluating...' : 'Simulate & Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
