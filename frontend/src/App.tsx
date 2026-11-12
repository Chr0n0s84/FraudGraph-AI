import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Activity,
  Network,
  Cpu,
  Sliders,
  AlertOctagon,
  Search,
  FolderKanban,
  BarChart3,
  Settings,
  Bell,
  Radio,
  X,
  Play,
  Pause,
  ExternalLink
} from 'lucide-react';
import {
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
    // Refresh summary metrics periodically
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

  // Cross-Module Deep Navigation Handlers
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
    <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification for Real-Time High/Critical Alerts */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-rose-950 border border-rose-500 text-rose-200 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-mono font-semibold">{toastMessage}</span>
          <button
            onClick={dismissToast}
            className="p-1 rounded text-rose-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Navigation Bar */}
      <header className="sticky top-0 z-40 bg-cyber-900/90 border-b border-cyber-border backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
                <Network className="w-6 h-6 animate-pulse-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold font-mono tracking-wider text-slate-100">
                    FRAUDGRAPH <span className="text-cyan-400 font-black">AI</span>
                  </h1>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    V1.0 HACKATHON
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 tracking-tight">
                  Real-Time Mule Network & Fraud Intelligence Platform
                </p>
              </div>
            </div>

            {/* Live Telemetry Pill */}
            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-2 bg-cyber-950 border border-cyber-border rounded-lg px-3 py-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                <span className="text-slate-400 text-[11px]">
                  WebSocket: <strong className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>{isConnected ? 'LIVE FEED' : 'OFFLINE'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 bg-cyber-950 border border-cyber-border rounded-lg px-3 py-1.5">
                <span className="text-slate-400 text-[11px]">
                  Simulator: <strong className={isSimulating ? 'text-cyan-400' : 'text-amber-400'}>{isSimulating ? '2000ms TX STREAM' : 'PAUSED'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-cyber-border/60 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,242,254,0.35)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-cyan-400' : 'bg-rose-600 text-white'
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
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 pt-6">
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
      <footer className="bg-cyber-900 border-t border-cyber-border py-3 px-6 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-4">
          <span>FRAUDGRAPH AI v1.0.0</span>
          <span>•</span>
          <span>FastAPI + NetworkX + Scikit-Learn + React + Tailwind</span>
          <span>•</span>
          <span className="text-cyan-400">Deterministic Synthetic Sandbox</span>
        </div>
        <div>
          <span>Strictly for Demonstration • Synthetic Banking Ecosystem</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
