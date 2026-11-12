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
  ShieldAlert
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
import { DashboardSummary, Alert } from '../../types';
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-cyan-400">Loading Fraud Intelligence Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  // Chart data formatting
  const riskBarData = [
    { name: 'Low', count: summary.risk_distribution['LOW'] || 0, color: '#10b981' },
    { name: 'Medium', count: summary.risk_distribution['MEDIUM'] || 0, color: '#00f2fe' },
    { name: 'High', count: summary.risk_distribution['HIGH'] || 0, color: '#f59e0b' },
    { name: 'Critical', count: summary.risk_distribution['CRITICAL'] || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Bar */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`w-3 h-3 rounded-full block ${isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className={`w-3 h-3 rounded-full absolute top-0 left-0 ${isSimulating ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Transaction Simulation Stream: <span className={isSimulating ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{isSimulating ? 'LIVE STREAMING' : 'PAUSED'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">Simulates real-time multi-channel digital banking transactions</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulator}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              isSimulating
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Pause Stream' : 'Start Stream'}
          </button>

          <button
            onClick={onStepSimulator}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 flex items-center gap-1.5 transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Step 1 TX
          </button>

          <button
            onClick={onResetSimulator}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 bg-cyber-800 border border-cyber-border hover:bg-cyber-700 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
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
          subtitle="Interconnected clusters"
          icon={Network}
          variant="red"
        />
        <MetricCard
          title="Critical Alerts"
          value={summary.critical_alerts}
          subtitle="Require analyst triage"
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
        <div className="lg:col-span-2 bg-cyber-900 border border-cyber-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Transaction Volume & Velocity Anomaly Velocity
              </h3>
              <p className="text-xs text-slate-400">Normal vs Suspicious activity timeline</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Normal Volume
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Flagged Burst
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.hourly_trend}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#1e2e54',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#00f2fe" fillOpacity={1} fill="url(#volGrad)" name="Volume ($)" />
                <Area type="monotone" dataKey="flagged_tx" stroke="#f43f5e" fillOpacity={1} fill="url(#flagGrad)" name="Flagged TXs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Risk Distribution Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">Transaction classifications</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBarData} layout="vertical">
                  <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1120',
                      borderColor: '#1e2e54',
                      borderRadius: '8px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {riskBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-cyber-border/80 text-xs font-mono flex items-center justify-between text-slate-400">
            <span>Average Composite Risk:</span>
            <span className="text-cyan-400 font-bold">{summary.avg_risk_score} / 100</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Flagged Entities & Recent Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suspicious Accounts Leaderboard */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
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
              Explore Graph <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary.top_suspicious_accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('investigator', { accountId: acc.id })}
                className="bg-cyber-850 hover:bg-cyber-800 border border-cyber-border hover:border-cyan-500/50 rounded-xl p-3.5 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyber-900 border border-cyber-border-bright flex items-center justify-center font-mono font-bold text-xs text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                    {acc.id}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {acc.holder_name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">{acc.account_number}</p>
                    <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">{acc.flagged_reason}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <RiskBadge level={acc.risk_level} score={acc.risk_score} />
                  <span className="text-[10px] font-mono text-slate-500">{acc.mule_ring_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Critical Alerts Stream */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
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
                className="bg-cyber-850 border border-cyber-border hover:border-rose-500/50 rounded-xl p-3.5 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{alert.title}</h4>
                      <StatusBadge status={alert.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                      {alert.account_number && <span>Acc: {alert.account_number}</span>}
                      {alert.amount && <span>Amount: ${alert.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <RiskBadge level={alert.severity} score={alert.risk_score} />
                  <button
                    onClick={() => onNavigateTab('alerts')}
                    className="px-2.5 py-1 rounded text-[11px] font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors"
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
