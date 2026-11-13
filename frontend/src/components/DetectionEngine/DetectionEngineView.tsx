import React, { useState } from 'react';
import {
  ShieldAlert,
  Cpu,
  Network,
  CheckCircle2,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const DetectionEngineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'ml' | 'graph'>('rules');

  const typologies = [
    {
      id: 'CIRCULAR',
      title: 'Circular Money Movement / Layering Ring',
      severity: 'CRITICAL',
      algorithm: 'NetworkX Simple Cycles (Tarjan / Johnson DFS)',
      description: 'Identifies closed directed loops of capital routing through 3 to 6 intermediary accounts where funds return to the syndicate originator to disguise origin.',
      ruleCondition: 'Directed Cycle detected (min_len=3, max_len=6) with transaction volume matching ±15% commission variance.',
      triggersCount: 24,
      color: 'from-rose-500/20 to-rose-950/20 border-rose-500/40 text-rose-300'
    },
    {
      id: 'FAN_IN',
      title: 'Fan-In Mule Funnel Convergence',
      severity: 'CRITICAL',
      algorithm: 'In-Degree Centrality & Temporal Clustering',
      description: 'Flags central aggregator accounts receiving rapid sequential inflows from multiple distinct originators within a tight time window.',
      ruleCondition: 'In-degree >= 4 AND In/Out degree ratio >= 2.5 within 2-hour sliding window.',
      triggersCount: 18,
      color: 'from-amber-500/20 to-amber-950/20 border-amber-500/40 text-amber-300'
    },
    {
      id: 'FAN_OUT',
      title: 'Fan-Out Smurfing Dispersal',
      severity: 'CRITICAL',
      algorithm: 'Out-Degree Dispersion & Threshold Clamping',
      description: 'Detects a high-balance source account disbursing funds to multiple satellite drop accounts to avoid triggering single-transaction AML limits.',
      ruleCondition: 'Out-degree >= 4 AND Out/In degree ratio >= 2.5 with individual amounts < $10,000.',
      triggersCount: 16,
      color: 'from-purple-500/20 to-purple-950/20 border-purple-500/40 text-purple-300'
    },
    {
      id: 'STRUCTURING',
      title: 'CTR Reporting Threshold Structuring',
      severity: 'HIGH',
      algorithm: 'Bounded Threshold Heuristic ($9,000 - $9,999)',
      description: 'Flags payments intentionally positioned just under the statutory $10,000 Currency Transaction Report (CTR) filing threshold.',
      ruleCondition: '$9,000 <= Amount <= $9,999 OR >= 2 cumulative transfers near threshold within 24 hours.',
      triggersCount: 32,
      color: 'from-cyan-500/20 to-cyan-950/20 border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'VELOCITY_DRAIN',
      title: 'Rapid Account Drain / Pass-Through Mule',
      severity: 'HIGH',
      algorithm: 'Temporal Velocity & Balance Depletion Delta',
      description: 'Identifies previously dormant or low-balance accounts that receive a substantial incoming credit and immediately drain >85% via external endpoints.',
      ruleCondition: 'Transferred amount >= 85% of total account balance AND interval < 30 minutes.',
      triggersCount: 14,
      color: 'from-emerald-500/20 to-emerald-950/20 border-emerald-500/40 text-emerald-300'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-5 shadow-glass flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Detection Engine Forensic Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Hybrid Multi-Tier Detection: Graph Theory + Unsupervised Isolation Forest + Regulatory Typology Heuristics
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-white/10 rounded-xl text-xs font-mono backdrop-blur-md">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-lg transition-all duration-300 ${
              activeTab === 'rules' ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white font-bold border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            AML Typologies (5)
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={`px-3.5 py-1.5 rounded-lg transition-all duration-300 ${
              activeTab === 'ml' ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white font-bold border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Isolation Forest Model
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3.5 py-1.5 rounded-lg transition-all duration-300 ${
              activeTab === 'graph' ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white font-bold border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Graph Centrality
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {typologies.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass flex flex-col justify-between hover:border-cyan-400/50 transition-all duration-300 group card-3d frost-shine cursor-pointer`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">{t.title}</h3>
                  <StatusBadge status={t.severity} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.08] text-xs font-mono">
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Trigger Logic</span>
                  <span className="text-cyan-300 text-[11px] font-medium">{t.ruleCondition}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Detections:</span>
                  <span className="text-amber-300 font-bold">{t.triggersCount} incidents</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ml' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Isolation Forest ML Diagnostic Telemetry
                </h3>
                <p className="text-xs text-slate-400">Unsupervised multivariate anomaly detection</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Trained & Operational
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Estimators</span>
                <span className="text-white font-bold text-base">60 Trees</span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Contamination</span>
                <span className="text-cyan-400 font-bold text-base">12.0%</span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Input Vector</span>
                <span className="text-white font-bold text-base">11 Features</span>
              </div>
              <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase">Inference Latency</span>
                <span className="text-emerald-400 font-bold text-base">&lt; 1.4 ms</span>
              </div>
            </div>

            {/* Feature Weights List */}
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3">
                Engineered Feature Importances
              </h4>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { name: 'Transfer Amount to Source Balance Ratio', weight: 92 },
                  { name: 'Target Node In-Degree Centrality (Funnel)', weight: 88 },
                  { name: 'Channel Risk Factor (Wire/Crypto Ramps)', weight: 82 },
                  { name: 'Normalized PageRank Centrality Differential', weight: 78 },
                  { name: 'Logarithmic Transaction Amount Outlier', weight: 74 },
                  { name: 'Source Node Betweenness Centrality (Bridge Mule)', weight: 70 },
                ].map((feat, i) => (
                  <div key={i} className="bg-white/[0.02] p-3 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-200">{feat.name}</span>
                      <span className="text-cyan-400 font-bold">{feat.weight}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] rounded-full" style={{ width: `${feat.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Health Summary Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Unsupervised Partitioning
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Isolation Forest builds an ensemble of random isolation trees. Suspicious transactions require significantly fewer partitioning splits to isolate, resulting in negative decision function values that map directly to high anomaly scores.
              </p>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Anomaly Range:</span>
                  <span className="text-slate-200">-0.32 to +0.28</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Decision Boundary:</span>
                  <span className="text-rose-400 font-bold">&lt;= 0.00 (Outlier)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Online Retraining:</span>
                  <span className="text-emerald-400 font-bold">Continuous Stream</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-slate-400 font-mono">
              Designed to eliminate zero-day laundering bypass vulnerabilities.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              PageRank & Collector Sink Detection
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Centralized collector mules act as high-inflow sinks in the directed transaction graph. By applying weighted PageRank (alpha=0.85, weighted by transfer volume), nodes with disproportionate capital concentration are flagged before money can exit into untraceable cash or crypto rails.
            </p>
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 font-mono text-xs text-cyan-300">
              PR(u) = (1 - d) / N + d * Σ [PR(v) * W(v,u) / Σ W(v,w)]
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-6 shadow-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Betweenness Centrality for Mule Intermediaries
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Professional money launderers rely on "layering mules" to pass money between origin syndicates and ultimate recipients. Betweenness centrality computes the fraction of all shortest financial paths that pass through a given account, instantly identifying bridge mules even if their balance remains zero.
            </p>
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 font-mono text-xs text-amber-300">
              C_B(v) = Σ [σ_st(v) / σ_st] (for s ≠ v ≠ t)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
