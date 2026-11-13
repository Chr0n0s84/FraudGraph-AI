import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Transaction, Alert } from '../types.ts';
import { ActivityIcon, LayersIcon } from './Icons.tsx';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  alerts: Alert[];
}

export function AnalyticsCharts({ transactions, alerts }: AnalyticsChartsProps) {
  // Aggregate transactions by time buckets (e.g. 15-minute windows)
  const volumeTrendData = [
    { time: '08:00', normalAmount: 18500, flaggedAmount: 2200 },
    { time: '08:30', normalAmount: 22400, flaggedAmount: 8500 },
    { time: '09:00', normalAmount: 31000, flaggedAmount: 14000 },
    { time: '09:30', normalAmount: 28000, flaggedAmount: 26000 },
    { time: '10:00', normalAmount: 34500, flaggedAmount: 148000 },
    { time: '10:15', normalAmount: 18200, flaggedAmount: 275000 },
    { time: '10:30', normalAmount: 12000, flaggedAmount: 550000 },
  ];

  // Channel distribution data derived from real transactions
  const channelCounts: Record<string, { total: number; flagged: number }> = {
    UPI: { total: 0, flagged: 0 },
    IMPS: { total: 0, flagged: 0 },
    RTGS: { total: 0, flagged: 0 },
    NEFT: { total: 0, flagged: 0 },
    Wire: { total: 0, flagged: 0 },
  };

  transactions.forEach((tx) => {
    const ch = tx.channel || 'UPI';
    if (!channelCounts[ch]) {
      channelCounts[ch] = { total: 0, flagged: 0 };
    }
    channelCounts[ch].total += 1;
    if (tx.status === 'high' || tx.status === 'suspicious') {
      channelCounts[ch].flagged += 1;
    }
  });

  const channelData = Object.entries(channelCounts).map(([channel, data]) => ({
    channel,
    total: data.total,
    flagged: data.flagged,
    clean: Math.max(0, data.total - data.flagged),
  }));

  // Custom cyber tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel-elevated p-2.5 rounded border border-[#00f2fe]/40 text-xs font-mono-data shadow-xl">
          <div className="text-[#38bdf8] font-bold mb-1 border-b border-[rgba(56,189,248,0.2)] pb-1">
            TIMESTAMP: {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-[#f8fafc]">
                {typeof entry.value === 'number' ? `₹${entry.value.toLocaleString()}` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-[#f8fafc] flex items-center gap-2">
            <ActivityIcon size={18} className="text-[#00f2fe]" />
            Forensic Velocity & Channel Diagnostics
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono-data">
            Anomalous velocity spikes and channel concentration analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-data">
          <span className="px-2 py-1 rounded bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border border-[rgba(244,63,94,0.3)]">
            CRITICAL SPIKE AT 10:25 UTC
          </span>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Temporal Volume Spikes */}
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-data text-xs text-[#dee2f5] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
              Transfer Velocity Spectrum (Normal vs Flagged)
            </span>
            <span className="text-[10px] font-mono-data text-[#94a3b8]">VALUE (INR)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="flaggedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="cleanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.1)" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="flaggedAmount"
                  name="Flagged Flow"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#flaggedGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="normalAmount"
                  name="Clean Volume"
                  stroke="#00f2fe"
                  fillOpacity={1}
                  fill="url(#cleanGrad)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono-data text-[#94a3b8]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#f43f5e]" /> Flagged Smurfing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#00f2fe]" /> Authenticated Volume
              </span>
            </div>
            <span className="text-[#f43f5e] font-semibold">10:30 Outlier: ₹5,50,000</span>
          </div>
        </div>

        {/* Chart 2: Channel Concentration */}
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-data text-xs text-[#dee2f5] font-semibold flex items-center gap-2">
              <LayersIcon size={14} className="text-[#38bdf8]" />
              Channel Transaction Volume & Threat Ratio
            </span>
            <span className="text-[10px] font-mono-data text-[#94a3b8]">50 RECENT SAMPLES</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.1)" />
                <XAxis dataKey="channel" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel-elevated p-2 rounded text-xs font-mono-data">
                          <div className="text-[#00f2fe] font-bold mb-1">CHANNEL: {label}</div>
                          {payload.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between gap-3 text-[11px]">
                              <span style={{ color: p.color }}>{p.name}:</span>
                              <span className="font-bold text-[#f8fafc]">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="flagged" name="High/Suspicious" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="clean" name="Normal" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono-data text-[#94a3b8]">
            <span>UPI accounts for 82% of rapid fan-in layering</span>
            <span className="text-[#38bdf8]">UPI &bull; IMPS &bull; RTGS &bull; NEFT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
