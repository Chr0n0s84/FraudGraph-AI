import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Network,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  RefreshCw,
  Users
} from 'lucide-react';
import { AnalyticsMetrics } from '../../types';
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
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
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
            className="p-2.5 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
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
          <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
            <h3 className="text-sm font-bold font-mono text-slate-100 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Identified Mule Account Rings & Syndicates
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-cyber-850 border-b border-cyber-border text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">Syndicate Identifier</th>
                    <th className="py-3 px-4">Topology Archetype</th>
                    <th className="py-3 px-4">Entity Count</th>
                    <th className="py-3 px-4">Identified Member Accounts</th>
                    <th className="py-3 px-4">Aggregated Volume</th>
                    <th className="py-3 px-4 text-right">Risk Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/60">
                  {metrics.mule_rings.map((ring) => (
                    <tr key={ring.ring_id} className="hover:bg-cyber-850/60">
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        {ring.ring_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-cyber-950 border border-cyber-border text-amber-300 font-bold">
                          {ring.primary_topology}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {ring.member_count} nodes
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {ring.members.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        ${ring.total_volume.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-rose-400 font-bold">
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
          <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
            <h3 className="text-sm font-bold font-mono text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Payment Rail Vulnerability & Exposure Analysis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.channel_analytics.map((ch) => (
                <div key={ch.channel} className="bg-cyber-850 p-4 rounded-xl border border-cyber-border space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{ch.channel}</span>
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
                    <span className="text-slate-100 font-bold">${ch.total_volume.toLocaleString()}</span>
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
