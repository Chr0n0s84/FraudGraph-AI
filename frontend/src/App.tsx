import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Activity,
  Network,
  Sliders,
  AlertOctagon,
  Search,
  FolderKanban,
  BarChart3,
  Settings,
  Radio,
  X,
  Sparkles
} from 'lucide-react';
import type {
  DashboardSummary,
  Transaction,
  Alert,
  TransactionDetail,
  AccountDetail
} from './types';
import { api } from './services/api';
import { useWebSocketStream } from './hooks/useWebSocketStream';

// Modules
import { OverviewDashboard } from './components/Dashboard/OverviewDashboard';
import { LiveTransactions } from './components/Transactions/LiveTransactions';
import { NetworkGraphView } from './components/NetworkGraph/NetworkGraphView';
import { DetectionEngineView } from './components/DetectionEngine/DetectionEngineView';
import { RiskEngineView } from './components/RiskEngine/RiskEngineView';
import { AlertsView } from './components/Alerts/AlertsView';
import { InvestigatorWorkspace } from './components/Investigator/InvestigatorWorkspace';
import { CaseManagementView } from './components/Cases/CaseManagementView';
import { AnalyticsReportsView } from './components/Analytics/AnalyticsReportsView';
import { SettingsView } from './components/Settings/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation states
  const [investigatorAccountId, setInvestigatorAccountId] = useState<number | undefined>(undefined);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(undefined);

  // Simulator status
  const [isSimulating, setIsSimulating] = useState(false);

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumData, txsData, alertsData, simData] = await Promise.all([
        api.getDashboardSummary(),
        api.getTransactions({ limit: 40 }),
        api.getAlerts({ limit: 30 }),
        api.getSimulatorStatus(),
      ]);
      setSummary(sumData);
      setTransactions(txsData);
      setAlerts(alertsData);
      setIsSimulating(simData.is_running);
    } catch (e) {
      console.error('Failed to load initial data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // WebSocket Live Stream Handlers
  const handleLiveTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev.slice(0, 70)]);
    api.getDashboardSummary().then(setSummary).catch(() => {});
  }, []);

  const handleLiveAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  const { isConnected, toastMessage, dismissToast } = useWebSocketStream(
    handleLiveTransaction,
    handleLiveAlert
  );

  // Simulator Controls
  const toggleSimulator = async () => {
    const nextAction = isSimulating ? 'stop' : 'start';
    try {
      await api.controlSimulator(nextAction, 2000);
      setIsSimulating(!isSimulating);
    } catch (e) {
      console.error('Failed to toggle simulator', e);
    }
  };

  const stepSimulator = async () => {
    try {
      await api.controlSimulator('step', 2000);
    } catch (e) {
      console.error('Failed to step simulator', e);
    }
  };

  const resetSimulator = async () => {
    if (window.confirm('Reset database to clean deterministic synthetic financial dataset?')) {
      try {
        await api.resetDatabase(42);
        loadInitialData();
      } catch (e) {
        console.error('Failed to reset data', e);
      }
    }
  };

  const handleNavigateToInvestigator = (accountId: number) => {
    setInvestigatorAccountId(accountId);
    setActiveTab('investigator');
  };

  const handleNavigateToCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  const handleCreateCaseForAccount = (acc: AccountDetail) => {
    api.createCase({
      title: `Investigation: ${acc.holder_name} (${acc.account_number})`,
      description: `Formal AML investigation opened on suspected mule node ${acc.account_number}.`,
      priority: acc.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      assigned_to: 'Senior Fraud Analyst',
      risk_score: acc.risk_score,
      target_account_id: acc.id,
      mule_ring_id: acc.mule_ring_id,
      evidence_summary: `Account balance: $${acc.balance}. Centrality: PageRank ${acc.pagerank}%, Betweenness ${acc.betweenness}%. Connected to ${acc.connected_counterparties} counterparties.`
    }).then((newCase) => {
      setSelectedCaseId(newCase.id);
      setActiveTab('cases');
    });
  };

  const handleEscalateTxToCase = (tx: TransactionDetail) => {
    api.createCase({
      title: `Suspicious Transaction Escalation: ${tx.tx_hash.slice(0, 12)}`,
      description: `Escalated high-risk transfer of $${tx.amount.toLocaleString()} via ${tx.channel}.`,
      priority: tx.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      assigned_to: 'Lead AML Specialist',
      risk_score: tx.risk_score,
      target_account_id: tx.source_account_id,
      evidence_summary: tx.detection_reasons || 'Flagged by ensemble risk engine.'
    }).then((newCase) => {
      setSelectedCaseId(newCase.id);
      setActiveTab('cases');
    });
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'transactions', label: 'Live Transactions', icon: Radio },
    { id: 'network', label: 'Network Graph', icon: Network },
    { id: 'detection', label: 'Detection Engine', icon: ShieldAlert },
    { id: 'risk', label: 'Risk Scoring', icon: Sliders },
    { id: 'alerts', label: 'Alerts', icon: AlertOctagon, badge: alerts.filter(a => a.status === 'OPEN').length },
    { id: 'investigator', label: 'Investigator', icon: Search },
    { id: 'cases', label: 'Case Management', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[600px] h-[450px] bg-rose-600/08 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Floating Alert Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-rose-950/80 border border-rose-500/60 backdrop-blur-2xl text-rose-100 px-5 py-4 rounded-2xl shadow-[0_10px_40px_rgba(244,63,94,0.3)] flex items-center gap-3.5 animate-bounce">
          <div className="p-2 rounded-xl bg-rose-900/60 border border-rose-500/40 text-rose-300">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs font-mono font-bold">{toastMessage}</span>
          <button
            onClick={dismissToast}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo with 3D Float */}
            <div className="flex items-center gap-3.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/25 via-blue-600/20 to-purple-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(0,242,254,0.35)] backdrop-blur-md animate-float-3d group-hover:scale-105 transition-transform duration-300">
                <Network className="w-5 h-5 animate-pulse-slow text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold font-mono tracking-wider text-white flex items-center gap-1.5">
                    FRAUDGRAPH <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 font-black text-shimmer">AI</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.25)]">
                    ENTERPRISE AML
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 tracking-tight flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Real-Time Mule Ring & Network Forensics
                </p>
              </div>
            </div>

            {/* Live Telemetry Glass Pills with 3D Depth */}
            <div className="hidden md:flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-1.5 shadow-glass hover:border-cyan-400/30 transition-all hover:-translate-y-0.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-ping' : 'bg-rose-500'}`} />
                <span className="text-slate-300 text-[11px]">
                  WebSocket: <strong className={isConnected ? 'text-emerald-300' : 'text-rose-400'}>{isConnected ? 'LIVE FEED' : 'OFFLINE'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-1.5 shadow-glass hover:border-cyan-400/30 transition-all hover:-translate-y-0.5">
                <span className="text-slate-300 text-[11px]">
                  Simulator: <strong className={isSimulating ? 'text-cyan-300 font-bold' : 'text-amber-400 font-bold'}>{isSimulating ? '2000ms TX STREAM' : 'PAUSED'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs with 3D Hover Depth */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-white/[0.06] scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-purple-500/20 text-white font-bold border border-cyan-400/60 shadow-[0_0_25px_rgba(0,242,254,0.3)] backdrop-blur-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent hover:border-white/10 hover:shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(0,242,254,0.5)]' : 'bg-rose-500/80 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <OverviewDashboard
            summary={summary}
            loading={loading}
            onRefresh={loadInitialData}
            onNavigateTab={(tab, meta) => {
              if (tab === 'investigator' && meta?.accountId) {
                handleNavigateToInvestigator(meta.accountId);
              } else {
                setActiveTab(tab);
              }
            }}
            isSimulating={isSimulating}
            onToggleSimulator={toggleSimulator}
            onStepSimulator={stepSimulator}
            onResetSimulator={resetSimulator}
            latestAlerts={alerts}
          />
        )}

        {activeTab === 'transactions' && (
          <LiveTransactions
            transactions={transactions}
            loading={loading}
            onRefresh={loadInitialData}
            onEscalateToCase={handleEscalateTxToCase}
          />
        )}

        {activeTab === 'network' && (
          <NetworkGraphView
            onNavigateToInvestigator={handleNavigateToInvestigator}
          />
        )}

        {activeTab === 'detection' && (
          <DetectionEngineView />
        )}

        {activeTab === 'risk' && (
          <RiskEngineView />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            loading={loading}
            onRefresh={loadInitialData}
            onNavigateToCase={handleNavigateToCase}
            onNavigateToInvestigator={handleNavigateToInvestigator}
          />
        )}

        {activeTab === 'investigator' && (
          <InvestigatorWorkspace
            initialAccountId={investigatorAccountId}
            onNavigateToCase={handleNavigateToCase}
            onCreateCaseForAccount={handleCreateCaseForAccount}
          />
        )}

        {activeTab === 'cases' && (
          <CaseManagementView
            initialCaseId={selectedCaseId}
            onNavigateToInvestigator={handleNavigateToInvestigator}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReportsView />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onResetData={resetSimulator}
          />
        )}
      </main>

      {/* Status Bar Footer */}
      <footer className="bg-slate-950/60 backdrop-blur-2xl border-t border-white/10 py-3.5 px-6 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-200">FRAUDGRAPH AI v1.0.0</span>
          <span>•</span>
          <span>FastAPI + NetworkX + Scikit-Learn + React + Tailwind</span>
          <span>•</span>
          <span className="text-cyan-400">Glassmorphic Cyber Defense UI</span>
        </div>
        <div className="text-slate-400">
          Strictly for Demonstration • Synthetic Banking Ecosystem
        </div>
      </footer>
    </div>
  );
}

export default App;
