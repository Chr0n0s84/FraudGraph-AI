import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Network,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import type { AccountDetail, Transaction, NetworkGraphData } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { api } from '../../services/api';

interface InvestigatorWorkspaceProps {
  initialAccountId?: number;
  onNavigateToCase: (caseId: number) => void;
  onCreateCaseForAccount: (account: AccountDetail) => void;
}

export const InvestigatorWorkspace: React.FC<InvestigatorWorkspaceProps> = ({
  initialAccountId,
  onCreateCaseForAccount,
}) => {
  const [searchIdOrNum, setSearchIdOrNum] = useState<string>(
    initialAccountId ? String(initialAccountId) : '51'
  );
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [egoGraph, setEgoGraph] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingFlag, setTogglingFlag] = useState(false);

  const fetchDossier = async (accId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [accData, txsData, egoData] = await Promise.all([
        api.getAccountDetail(accId),
        api.getTransactions({ account_id: accId, limit: 30 }),
        api.getEgoGraph(accId, 2),
      ]);
      setAccount(accData);
      setTransactions(txsData);
      setEgoGraph(egoData);
    } catch (err: any) {
      setError(err.message || 'Account not found');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAccountId) {
      setSearchIdOrNum(String(initialAccountId));
      fetchDossier(initialAccountId);
    } else {
      fetchDossier(51);
    }
  }, [initialAccountId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(searchIdOrNum.trim());
    if (!isNaN(id)) {
      fetchDossier(id);
    } else {
      setError('Please enter a valid numeric Account ID (e.g. 51, 64, 65, 74)');
    }
  };

  const handleToggleFlag = async () => {
    if (!account) return;
    try {
      setTogglingFlag(true);
      const res = await api.toggleAccountFlag(account.id);
      setAccount({ ...account, is_flagged: res.is_flagged, risk_level: res.risk_level as any });
    } catch (e) {
      console.error('Failed to toggle flag', e);
    } finally {
      setTogglingFlag(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Search Bar & Preset Quick Jump */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-4 shadow-glass flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Account ID (e.g. 51, 64, 65, 74)..."
              value={searchIdOrNum}
              onChange={(e) => setSearchIdOrNum(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] backdrop-blur-md"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)]"
          >
            Investigate
          </button>
        </form>

        {/* Preset quick jump */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Quick Select:</span>
          {[
            { id: 51, label: 'Mule #51 (Circular)' },
            { id: 64, label: 'Mule #64 (Fan-In Collector)' },
            { id: 65, label: 'Corp #65 (Smurf Dispersal)' },
            { id: 74, label: 'Mule #74 (Rapid Drain)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSearchIdOrNum(String(item.id));
                fetchDossier(item.id);
              }}
              className="px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-xs shadow-glass">
          {error}
        </div>
      )}

      {account && (
        <div className="space-y-6">
          {/* Dossier Header Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl border text-xl font-mono font-extrabold flex items-center justify-center w-16 h-16 ${
                  account.is_flagged
                    ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-950/80 border-white/10 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                }`}>
                  {account.id}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono text-white">{account.holder_name}</h2>
                    <RiskBadge level={account.risk_level} score={account.risk_score} />
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    {account.account_number} • {account.bank_name} • {account.account_type}
                  </p>
                  {account.flagged_reason && (
                    <p className="text-xs font-mono text-rose-400 font-medium mt-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {account.flagged_reason}
                    </p>
                  )}
                  {account.mule_ring_id && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300">
                      SYNDICATE: {account.mule_ring_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 font-mono text-xs">
                <button
                  disabled={togglingFlag}
                  onClick={handleToggleFlag}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                    account.is_flagged
                      ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                      : 'bg-rose-950/70 text-rose-300 border-rose-500/50 hover:bg-rose-900 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  {account.is_flagged ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {account.is_flagged ? 'Clear Account Restriction' : 'Freeze & Flag Confirmed Mule'}
                </button>

                <button
                  onClick={() => onCreateCaseForAccount(account)}
                  className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Open Case
                </button>
              </div>
            </div>

            {/* Financial & Centrality Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 text-xs font-mono">
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Current Balance</span>
                <span className="text-white font-bold text-base">
                  ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Total Inflow</span>
                <span className="text-emerald-400 font-bold text-base flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  ${account.total_inflow.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Total Outflow</span>
                <span className="text-rose-400 font-bold text-base flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  ${account.total_outflow.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Counterparties</span>
                <span className="text-slate-200 font-bold text-base">{account.connected_counterparties} peers</span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">PageRank Centrality</span>
                <span className="text-cyan-400 font-bold text-base">{account.pagerank.toFixed(2)}%</span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Betweenness Bridge</span>
                <span className="text-amber-400 font-bold text-base">{account.betweenness.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Ego-Network Subgraph View (2-Hop) */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Ego-Network Topology (2-Hop Neighborhood)
                </h3>
                <p className="text-xs text-slate-400">
                  Sub-network containing direct counterparties and intermediary money movement paths
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Connected Nodes: {egoGraph?.nodes.length || 0} | Edges: {egoGraph?.edges.length || 0}
              </span>
            </div>

            <div className="h-64 bg-slate-950/70 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden relative radar-grid shadow-inner">
              {egoGraph && (
                <svg className="w-full h-full">
                  <g transform="translate(350, 128)">
                    <circle r="22" fill="rgba(0, 242, 254, 0.2)" stroke="#00f2fe" strokeWidth="2.5" />
                    <circle r="8" fill="#00f2fe" />
                    <text y="32" textAnchor="middle" fill="#00f2fe" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {account.account_number} (FOCUS)
                    </text>
                  </g>

                  {egoGraph.nodes
                    .filter((n) => n.account_id !== account.id)
                    .slice(0, 10)
                    .map((n, i, arr) => {
                      const angle = (i / arr.length) * 2 * Math.PI;
                      const x = 350 + Math.cos(angle) * 160;
                      const y = 128 + Math.sin(angle) * 85;
                      const isDanger = n.risk_level === 'CRITICAL' || n.is_mule;

                      return (
                        <g key={n.id}>
                          <line
                            x1={350}
                            y1={128}
                            x2={x}
                            y2={y}
                            stroke={isDanger ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)'}
                            strokeWidth={isDanger ? 1.5 : 1}
                            strokeDasharray={isDanger ? '3 3' : undefined}
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={isDanger ? 12 : 9}
                            fill={isDanger ? '#f43f5e' : '#38bdf8'}
                            opacity={0.8}
                          />
                          <text
                            x={x}
                            y={y + 18}
                            textAnchor="middle"
                            fill={isDanger ? '#f43f5e' : '#94a3b8'}
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {n.account_number}
                          </text>
                        </g>
                      );
                    })}
                </svg>
              )}
            </div>
          </div>

          {/* Chronological Transaction History Table */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
            <h3 className="text-sm font-bold font-mono text-slate-100 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Chronological Transaction Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Counterparty</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Risk Assessment</th>
                    <th className="py-2.5 px-3">Pattern</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {transactions.map((tx) => {
                    const isOutgoing = tx.source_account_id === account.id;

                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.05]">
                        <td className="py-3 px-3">
                          {isOutgoing ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Outflow
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Inflow
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-100">
                            {isOutgoing ? tx.target_holder_name || `Acc #${tx.target_account_id}` : tx.source_holder_name || `Acc #${tx.source_account_id}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{tx.channel}</td>
                        <td className="py-3 px-3">
                          <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                        </td>
                        <td className="py-3 px-3 text-amber-300 font-bold">
                          {tx.pattern_type || 'NORMAL'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
