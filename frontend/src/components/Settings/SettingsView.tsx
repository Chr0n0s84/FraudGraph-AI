import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Network,
  Zap,
  Activity
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { api } from '../../services/api';

interface SettingsViewProps {
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetData }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-400 font-mono text-sm">
        Loading System Parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl">
      {/* Top Header */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Detection Engine Configuration & Thresholds
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tune scoring weights, heuristic toggles, and streaming simulator intervals
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/50 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" /> Parameters Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
        {/* Risk Thresholds Card */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            1. Classification Score Thresholds
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-slate-300">
                <span>Critical Risk Threshold (Hold & Block)</span>
                <span className="text-rose-400 font-bold">{settings.critical_threshold} / 100</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={settings.critical_threshold}
                onChange={(e) => setSettings({ ...settings, critical_threshold: parseInt(e.target.value) })}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-slate-300">
                <span>High Risk Threshold (Flag for Investigation)</span>
                <span className="text-amber-400 font-bold">{settings.high_threshold} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                value={settings.high_threshold}
                onChange={(e) => setSettings({ ...settings, high_threshold: parseInt(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-slate-300">
                <span>Medium Risk Threshold</span>
                <span className="text-cyan-400 font-bold">{settings.medium_threshold} / 100</span>
              </div>
              <input
                type="range"
                min="20"
                max="45"
                value={settings.medium_threshold}
                onChange={(e) => setSettings({ ...settings, medium_threshold: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Scoring Factor Weights Card */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            2. Multi-Factor Scoring Weights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-cyber-950 p-3.5 rounded-xl border border-cyber-border space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>AML Typology Rules Weight</span>
                <span className="text-cyan-400 font-bold">{(settings.weight_rules * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={settings.weight_rules}
                onChange={(e) => setSettings({ ...settings, weight_rules: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="bg-cyber-950 p-3.5 rounded-xl border border-cyber-border space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Graph Centrality & Topology Weight</span>
                <span className="text-cyan-400 font-bold">{(settings.weight_graph * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={settings.weight_graph}
                onChange={(e) => setSettings({ ...settings, weight_graph: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="bg-cyber-950 p-3.5 rounded-xl border border-cyber-border space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>ML Isolation Forest Anomaly Weight</span>
                <span className="text-cyan-400 font-bold">{(settings.weight_ml * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={settings.weight_ml}
                onChange={(e) => setSettings({ ...settings, weight_ml: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="bg-cyber-950 p-3.5 rounded-xl border border-cyber-border space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Transaction Velocity Burst Weight</span>
                <span className="text-cyan-400 font-bold">{(settings.weight_velocity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={settings.weight_velocity}
                onChange={(e) => setSettings({ ...settings, weight_velocity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Rule Active Toggles Card */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            3. Regulatory Typology Detection Toggles
          </h3>

          <div className="space-y-2">
            {[
              { key: 'enable_circular_rule', label: 'Circular Money Laundering Layering Loop Detection' },
              { key: 'enable_fan_in_rule', label: 'Fan-In Collector Funnel Mule Detection' },
              { key: 'enable_fan_out_rule', label: 'Fan-Out Smurfing Dispersal Detection' },
              { key: 'enable_structuring_rule', label: 'Near-Threshold CTR Structuring Evasion ($9k-$10k)' },
              { key: 'enable_velocity_rule', label: 'Rapid Account Drain & Temporal Velocity Bursts' },
            ].map((rule) => (
              <label
                key={rule.key}
                className="flex items-center justify-between p-3 rounded-lg bg-cyber-950 border border-cyber-border cursor-pointer hover:border-slate-600 transition-colors"
              >
                <span className="text-slate-200">{rule.label}</span>
                <input
                  type="checkbox"
                  checked={(settings as any)[rule.key]}
                  onChange={(e) => setSettings({ ...settings, [rule.key]: e.target.checked } as any)}
                  className="rounded bg-cyber-900 border-cyber-border text-cyan-500 focus:ring-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Simulator Interval & Reset Benchmark Data */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
              Synthetic Benchmark Reset
            </h4>
            <p className="text-[11px] text-slate-500">
              Restore clean deterministic dataset with 4 fraud rings & 140+ benchmark transactions
            </p>
          </div>

          <button
            type="button"
            onClick={onResetData}
            className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-300 bg-rose-950/60 hover:bg-rose-900 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Deterministic Benchmark
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Apply & Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
