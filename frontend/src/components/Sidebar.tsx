import React from 'react';
import { NetworkIcon, FileTextIcon, ShieldAlertIcon, ActivityIcon, FilterIcon, LayersIcon, CheckCircleIcon } from './Icons.tsx';

interface SidebarProps {
  activeTab: 'graph' | 'transactions' | 'alerts' | 'cases' | 'analytics';
  setActiveTab: (tab: 'graph' | 'transactions' | 'alerts' | 'cases' | 'analytics') => void;
  riskFilter: 'all' | 'high' | 'suspicious' | 'normal';
  setRiskFilter: (filter: 'all' | 'high' | 'suspicious' | 'normal') => void;
  onSelectPreset: (preset: 'cycle' | 'fan-in') => void;
  openAlertsCount?: number;
  casesCount?: number;
  isCollapsed: boolean;
  setIsCollapsed: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  riskFilter,
  setRiskFilter,
  onSelectPreset,
  openAlertsCount = 0,
  casesCount = 0,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`border-r border-[rgba(56,189,248,0.14)] bg-[#0b1329]/98 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        isCollapsed
          ? 'hidden lg:flex lg:w-16'
          : 'w-64 fixed lg:static inset-y-12 lg:inset-auto left-0 shadow-2xl lg:shadow-none'
      }`}
    >
      <div className="p-3 space-y-5">
        {/* Workspace Views */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            {!isCollapsed && (
              <span className="font-mono-data text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                Investigation Modules
              </span>
            )}
            <button
              onClick={setIsCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="text-[#94a3b8] hover:text-[#00f2fe] p-1 rounded hover:bg-[#0f1c3f] transition-colors text-xs font-mono-data ml-auto"
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('graph')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono-data transition-all text-left ${
                activeTab === 'graph'
                  ? 'bg-[#0f1c3f] text-[#00f2fe] border-l-2 border-[#00f2fe] font-semibold glow-cyan'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f]/50'
              }`}
            >
              <NetworkIcon size={16} className={activeTab === 'graph' ? 'text-[#00f2fe]' : 'text-[#94a3b8]'} />
              {!isCollapsed && <span>Network Topology</span>}
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono-data transition-all text-left ${
                activeTab === 'transactions'
                  ? 'bg-[#0f1c3f] text-[#00f2fe] border-l-2 border-[#00f2fe] font-semibold glow-cyan'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f]/50'
              }`}
            >
              <FileTextIcon size={16} className={activeTab === 'transactions' ? 'text-[#00f2fe]' : 'text-[#94a3b8]'} />
              {!isCollapsed && <span>Transaction Ledger</span>}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono-data transition-all text-left ${
                activeTab === 'alerts'
                  ? 'bg-[#0f1c3f] text-[#00f2fe] border-l-2 border-[#00f2fe] font-semibold glow-cyan'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f]/50'
              }`}
            >
              <ShieldAlertIcon size={16} className={activeTab === 'alerts' ? 'text-[#f43f5e]' : 'text-[#94a3b8]'} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Alerts Feed</span>
                  <span className="px-1.5 py-0.2 rounded bg-[rgba(244,63,94,0.2)] text-[#f43f5e] text-[10px] border border-[rgba(244,63,94,0.4)]">
                    {openAlertsCount}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cases')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono-data transition-all text-left ${
                activeTab === 'cases'
                  ? 'bg-[#0f1c3f] text-[#00f2fe] border-l-2 border-[#00f2fe] font-semibold glow-cyan'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f]/50'
              }`}
            >
              <LayersIcon size={16} className={activeTab === 'cases' ? 'text-[#00f2fe]' : 'text-[#94a3b8]'} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Cases</span>
                  <span className="px-1.5 py-0.2 rounded bg-[rgba(56,189,248,0.18)] text-[#38bdf8] text-[10px] border border-[rgba(56,189,248,0.35)]">
                    {casesCount}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono-data transition-all text-left ${
                activeTab === 'analytics'
                  ? 'bg-[#0f1c3f] text-[#00f2fe] border-l-2 border-[#00f2fe] font-semibold glow-cyan'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f1c3f]/50'
              }`}
            >
              <ActivityIcon size={16} className={activeTab === 'analytics' ? 'text-[#00f2fe]' : 'text-[#94a3b8]'} />
              {!isCollapsed && <span>Velocity Analytics</span>}
            </button>
          </nav>
        </div>

        {/* Forensic Topology Highlights */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[rgba(56,189,248,0.1)]">
            <span className="font-mono-data text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold block px-2 mb-2">
              Illicit Patterns
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => onSelectPreset('cycle')}
                className="w-full text-left px-2.5 py-2 rounded bg-[rgba(244,63,94,0.08)] hover:bg-[rgba(244,63,94,0.18)] border border-[rgba(244,63,94,0.3)] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping" />
                  <span className="font-mono-data text-xs text-[#f8fafc] font-semibold group-hover:text-[#f43f5e]">
                    5-Node Red Cycle
                  </span>
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5 font-mono-data">
                  A101 → A105 circular wash
                </div>
              </button>

              <button
                onClick={() => onSelectPreset('fan-in')}
                className="w-full text-left px-2.5 py-2 rounded bg-[rgba(244,63,94,0.08)] hover:bg-[rgba(244,63,94,0.18)] border border-[rgba(244,63,94,0.3)] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                  <span className="font-mono-data text-xs text-[#f8fafc] font-semibold group-hover:text-[#f43f5e]">
                    Red Fan-in Cluster
                  </span>
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5 font-mono-data">
                  8 Feeders → Hub A4821
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Risk Filter */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[rgba(56,189,248,0.1)]">
            <div className="flex items-center gap-1.5 px-2 mb-2 text-[#94a3b8]">
              <FilterIcon size={12} />
              <span className="font-mono-data text-[10px] uppercase tracking-wider font-semibold">
                Risk Classification
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 font-mono-data text-[11px]">
              <button
                onClick={() => setRiskFilter('all')}
                className={`px-2 py-1.5 rounded text-center transition-all ${
                  riskFilter === 'all'
                    ? 'bg-[#00f2fe] text-[#080d1a] font-bold glow-cyan'
                    : 'bg-[#080d1a] text-[#94a3b8] hover:text-[#f8fafc] border border-[rgba(56,189,248,0.15)]'
                }`}
              >
                All (40)
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`px-2 py-1.5 rounded text-center transition-all ${
                  riskFilter === 'high'
                    ? 'bg-[#f43f5e] text-[#080d1a] font-bold glow-red'
                    : 'bg-[#080d1a] text-[#f43f5e] hover:bg-[#f43f5e]/10 border border-[rgba(244,63,94,0.3)]'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setRiskFilter('suspicious')}
                className={`px-2 py-1.5 rounded text-center transition-all ${
                  riskFilter === 'suspicious'
                    ? 'bg-[#f59e0b] text-[#080d1a] font-bold glow-amber'
                    : 'bg-[#080d1a] text-[#f59e0b] hover:bg-[#f59e0b]/10 border border-[rgba(245,158,11,0.3)]'
                }`}
              >
                Suspicious
              </button>
              <button
                onClick={() => setRiskFilter('normal')}
                className={`px-2 py-1.5 rounded text-center transition-all ${
                  riskFilter === 'normal'
                    ? 'bg-[#10b981] text-[#080d1a] font-bold'
                    : 'bg-[#080d1a] text-[#10b981] hover:bg-[#10b981]/10 border border-[rgba(16,185,129,0.3)]'
                }`}
              >
                Normal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & System Info Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[rgba(56,189,248,0.1)] bg-[#080d1a]/80 text-[10px] font-mono-data text-[#94a3b8] space-y-1">
          <div className="flex justify-between items-center">
            <span>DATABASE:</span>
            <span className="text-[#10b981] flex items-center gap-1">
              <CheckCircleIcon size={10} /> SYNCED
            </span>
          </div>
          <div className="flex justify-between">
            <span>GRAPH ALGO:</span>
            <span className="text-[#38bdf8]">FORCE-DIRECTED</span>
          </div>
          <div className="text-[9px] text-[#475569] pt-1 border-t border-[rgba(255,255,255,0.05)]">
            STRICT CONTRACT ADHERENCE
          </div>
        </div>
      )}
    </aside>
  );
}
