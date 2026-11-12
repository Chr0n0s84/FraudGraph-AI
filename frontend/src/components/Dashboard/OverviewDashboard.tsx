import React from 'react';
import {
  DollarSign,
  Activity,
  ShieldCheck,
  AlertOctagon,
  Users,
  Network,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowUpRight,
  ShieldAlert,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import type { DashboardSummary, Alert } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';

interface OverviewDashboardProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: string, meta?: any) => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onStepSimulator: () => void;
  onResetSimulator: () => void;
  latestAlerts: Alert[];
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  summary,
  loading,
  onRefresh,
  onNavigateTab,
  isSimulating,
  onToggleSimulator,
  onStepSimulator,
  onResetSimulator,
  latestAlerts,
}) => {
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 bg-slate-900/50 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-glass">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-cyan-300">Loading Forensic Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const riskBarData = [
    { name: 'Low', count: summary.risk_distribution['LOW'] || 0, color: '#10b981' },
    { name: 'Medium', count: summary.risk_distribution['MEDIUM'] || 0, color: '#00f2fe' },
    { name: 'High', count: summary.risk_distribution['HIGH'] || 0, color: '#f59e0b' },
    { name: 'Critical', count: summary.risk_distribution['CRITICAL'] || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Glassmorphic Simulation Control Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-4 shadow-glass flex flex-wrap items-center justify-between gap-4">
        {/* Ambient subtle light glow */}
        <div className="absolute top-0 left-1/3 w-96 h-full bg-cyan-500/05 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="relative">
            <span className={`w-3.5 h-3.5 rounded-full block ${isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className={`w-3.5 h-3.5 rounded-full absolute top-0 left-0 ${isSimulating ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400'}`} />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
              Streaming Pipeline: 
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isSimulating ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-amber-300 bg-amber-950/70 border border-amber-500/40'
              }`}>
                {isSimulating ? 'ACTIVE INGESTION (2000ms)' : 'PAUSED'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Simulates multi-channel digital banking transactions with live AML topology inference
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={onToggleSimulator}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all duration-300 ${
              isSimulating
                ? 'bg-amber-950/70 text-amber-200 border-amber-500/50 hover:bg-amber-900/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-950/70 text-emerald-200 border-emerald-500/50 hover:bg-emerald-900/70 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Pause Pipeline' : 'Resume Pipeline'}
          </button>

          <button
            onClick={onStepSimulator}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-cyan-200 bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/50 hover:border-cyan-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.15)] transition-all"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-300" />
            Step 1 TX
          </button>

          <button
            onClick={onResetSimulator}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-slate-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Seed Data
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Volume"
          value={`$${(summary.total_volume / 1000).toFixed(1)}k`}
          subtitle="Processed volume"
          icon={DollarSign}
          variant="cyan"
          trend={{ value: '+14.2%', isPositive: true }}
        />
        <MetricCard
          title="Transactions"
          value={summary.total_transactions.toLocaleString()}
          subtitle="Monitored in ledger"
          icon={Activity}
          variant="default"
          trend={{ value: '+8.7%', isPositive: true }}
        />
        <MetricCard
          title="Flagged Accounts"
          value={summary.flagged_accounts}
          subtitle={`of ${summary.total_accounts} total entities`}
          icon={Users}
          variant="amber"
          trend={{ value: `${((summary.flagged_accounts / summary.total_accounts) * 100).toFixed(0)}%`, isPositive: false }}
        />
        <MetricCard
          title="Active Mule Rings"
          value={summary.active_mule_rings}
          subtitle="Syndicate clusters"
          icon={Network}
          variant="red"
        />
        <MetricCard
          title="Critical Alerts"
          value={summary.critical_alerts}
          subtitle="Triage required"
          icon={AlertOctagon}
          variant="red"
        />
        <MetricCard
          title="Prevention Rate"
          value={`${summary.fraud_prevention_rate}%`}
          subtitle="Illicit capital blocked"
          icon={ShieldCheck}
          variant="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume & Velocity Chart */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Transaction Volume & Velocity Anomaly Trajectory
              </h3>
              <p className="text-xs text-slate-400">Comparing legitimate payments against rapid-burst fraud spikes</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" /> Normal Volume
              </span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Flagged Spikes
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.hourly_trend}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" name="Volume ($)" />
                <Area type="monotone" dataKey="flagged_tx" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#flagGrad)" name="Flagged TXs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Risk Distribution Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">Multi-factor model classifications</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBarData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(16px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {riskBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-xs font-mono flex items-center justify-between text-slate-300">
            <span>Average Composite Risk:</span>
            <span className="text-cyan-400 font-extrabold text-sm">{summary.avg_risk_score} / 100</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Priority Flagged Entities & Recent Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suspicious Accounts Leaderboard */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Priority Flagged Entities
              </h3>
              <p className="text-xs text-slate-400">High-centrality suspected mule accounts</p>
            </div>
            <button
              onClick={() => onNavigateTab('network')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Explore Topology <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary.top_suspicious_accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('investigator', { accountId: acc.id })}
                className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-400/50 rounded-xl p-3.5 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-400/50 transition-colors">
                    {acc.id}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {acc.holder_name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">{acc.account_number}</p>
                    <p className="text-[10px] text-amber-300/90 font-mono mt-0.5">{acc.flagged_reason}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <RiskBadge level={acc.risk_level} score={acc.risk_score} />
                  <span className="text-[10px] font-mono text-slate-400 font-medium">{acc.mule_ring_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Critical Alerts Stream */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Live High & Critical Alerts
              </h3>
              <p className="text-xs text-slate-400">Streamed from fraud inference engine</p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              All Alerts <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {latestAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-rose-500/50 rounded-xl p-3.5 transition-all flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{alert.title}</h4>
                      <StatusBadge status={alert.status} />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
                      {alert.account_number && <span>Acc: {alert.account_number}</span>}
                      {alert.amount && <span>Amount: ${alert.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <RiskBadge level={alert.severity} score={alert.risk_score} />
                  <button
                    onClick={() => onNavigateTab('alerts')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors"
                  >
                    Triage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
