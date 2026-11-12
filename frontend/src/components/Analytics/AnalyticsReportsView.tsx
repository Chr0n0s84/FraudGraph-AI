import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Network,
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Users
} from 'lucide-react';
import type { AnalyticsMetrics } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { api } from '../../services/api';

export const AnalyticsReportsView: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/v1/analytics/export/csv', '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-5 shadow-glass flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Graph Analytics & Forensic AML Intelligence Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Macro syndication cluster analysis and regulatory compliance export
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Suspicious Activity Report (CSV)
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Topological Telemetry Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Mule Ring Clusters"
              value={metrics.graph_topology.detected_clusters_count}
              subtitle="Weakly connected components"
              icon={Network}
              variant="red"
            />
            <MetricCard
              title="Circular Cycles"
              value={metrics.graph_topology.circular_cycles_count}
              subtitle="Directed layering rings"
              icon={Layers}
              variant="amber"
            />
            <MetricCard
              title="Fan-In Funnels"
              value={metrics.graph_topology.fan_in_hubs_count}
              subtitle="Aggregator collector mules"
              icon={Users}
              variant="cyan"
            />
            <MetricCard
              title="Smurfing Hubs"
              value={metrics.graph_topology.fan_out_hubs_count}
              subtitle="Near-threshold dispersal"
              icon={ShieldAlert}
              variant="emerald"
            />
          </div>

          {/* Mule Rings Breakdown Table */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass card-3d">
            <h3 className="text-sm font-bold font-mono text-slate-100 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Identified Mule Account Rings & Syndicates
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">Syndicate Identifier</th>
                    <th className="py-3 px-4">Topology Archetype</th>
                    <th className="py-3 px-4">Entity Count</th>
                    <th className="py-3 px-4">Identified Member Accounts</th>
                    <th className="py-3 px-4">Aggregated Volume</th>
                    <th className="py-3 px-4 text-right">Risk Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {metrics.mule_rings.map((ring) => (
                    <tr key={ring.ring_id} className="hover:bg-white/[0.08] hover:translate-x-1 transition-all duration-200">
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        {ring.ring_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
                          {ring.primary_topology}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {ring.member_count} nodes
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {ring.members.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        ${ring.total_volume.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-rose-400 font-bold px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40">
                          {ring.risk_score}% CRITICAL
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Rails Channel Risk Analytics */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass">
            <h3 className="text-sm font-bold font-mono text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Payment Rail Vulnerability & Exposure Analysis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.channel_analytics.map((ch) => (
                <div key={ch.channel} className="bg-white/[0.03] p-4 rounded-xl border border-white/10 space-y-2 text-xs font-mono backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{ch.channel}</span>
                    <span className={`text-[11px] font-bold ${ch.avg_risk >= 60 ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {ch.avg_risk} / 100 Risk
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Transaction Count:</span>
                    <span className="text-slate-200 font-bold">{ch.tx_count}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Rail Volume:</span>
                    <span className="text-white font-bold">${ch.total_volume.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
