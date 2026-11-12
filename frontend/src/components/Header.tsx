import React from 'react';
import { Stats } from '../types.ts';
import { ShieldAlertIcon, ActivityIcon, RefreshCwIcon, NetworkIcon } from './Icons.tsx';

interface HeaderProps {
  stats: Stats | null;
  isLoading: boolean;
  onRefresh: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ stats, isLoading, onRefresh, onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  return (
    <header className="border-b border-[rgba(56,189,248,0.14)] bg-[#080d1a]/95 backdrop-blur-md px-4 py-2.5 z-30 sticky top-0">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Brand and System Telemetry */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                className="lg:hidden p-1.5 rounded bg-[#0b1329] border border-[rgba(56,189,248,0.2)] text-[#00f2fe] text-xs font-mono-data"
              >
                {isSidebarCollapsed ? '☰' : '✕'}
              </button>
            )}
            <div className="w-9 h-9 rounded bg-[#0f1c3f] border border-[#00f2fe]/40 flex items-center justify-center glow-cyan shadow-sm">
              <NetworkIcon size={20} className="text-[#00f2fe]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-wider text-[#f8fafc]">
                  OBSIDIAN <span className="text-[#00f2fe]">FORENSICS</span>
                </span>
                <span className="font-mono-data text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,242,254,0.12)] text-[#00f2fe] border border-[rgba(0,242,254,0.3)]">
                  v2.4-PROD
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono-data">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>SURVEILLANCE RADAR ACTIVE</span>
                <span className="text-[#475569]">•</span>
                <span className="text-[#38bdf8]">FRAUDGRAPH AI CONTRACT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Macro Stats from GET /stats */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-xs w-full lg:w-auto">
          {/* 24h Transactions */}
          <div className="glass-panel px-3 py-1.5 rounded flex items-center gap-2 min-w-[130px]">
            <ActivityIcon size={14} className="text-[#38bdf8]" />
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono-data">
                24h Volume
              </div>
              <div className="font-mono-data font-bold text-sm text-[#f8fafc]">
                {stats ? stats.transactions_24h.toLocaleString() : '---'}
              </div>
            </div>
          </div>

          {/* Suspicious Accounts */}
          <div className="glass-panel px-3 py-1.5 rounded flex items-center gap-2 min-w-[135px]">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono-data">
                Suspicious Accs
              </div>
              <div className="font-mono-data font-bold text-sm text-[#f59e0b]">
                {stats ? stats.suspicious_accounts : '---'}
              </div>
            </div>
          </div>

          {/* Mule Networks */}
          <div className="glass-panel px-3 py-1.5 rounded flex items-center gap-2 min-w-[125px]">
            <NetworkIcon size={14} className="text-[#f43f5e]" />
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono-data">
                Mule Rings
              </div>
              <div className="font-mono-data font-bold text-sm text-[#f43f5e]">
                {stats ? stats.mule_networks : '---'}
              </div>
            </div>
          </div>

          {/* High Risk Alerts */}
          <div className="glass-panel-danger px-3 py-1.5 rounded flex items-center gap-2 min-w-[125px] glow-red">
            <ShieldAlertIcon size={14} className="text-[#f43f5e]" />
            <div>
              <div className="text-[10px] text-[#f43f5e] uppercase tracking-wider font-mono-data font-bold">
                High Alerts
              </div>
              <div className="font-mono-data font-bold text-sm text-[#f8fafc]">
                {stats ? stats.high_alerts : '---'}
              </div>
            </div>
          </div>

          {/* Refresh action */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh telemetry and graph data"
            className="p-2 rounded bg-[#0b1329] border border-[rgba(56,189,248,0.2)] hover:border-[#00f2fe] text-[#dee2f5] hover:text-[#00f2fe] transition-colors ml-auto lg:ml-0"
            title="Reload telemetry data"
          >
            <RefreshCwIcon size={16} className={isLoading ? 'animate-spin text-[#00f2fe]' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}
