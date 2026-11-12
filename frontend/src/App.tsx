/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTransactions,
  getAlerts,
  getGraph,
  getAccount,
  getStats,
  freezeAccount,
  escalateAccount,
  isOfflineMode,
  subscribeOfflineMode,
} from './api.js';
import { Transaction, Alert, GraphData, AccountDossier, Stats, CaseStatus } from './types.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { NetworkGraph } from './components/NetworkGraph.tsx';
import { TransactionsTable } from './components/TransactionsTable.tsx';
import { AlertsPanel } from './components/AlertsPanel.tsx';
import { CasesList } from './components/CasesList.tsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.tsx';
import { AccountDrawer } from './components/AccountDrawer.tsx';

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountDossier | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, CaseStatus>>({});
  const accountStatusesRef = useRef<Record<string, CaseStatus>>({});
  const selectedAccountIdRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(() => isOfflineMode());
  const [newTxIds, setNewTxIds] = useState<Set<string>>(() => new Set());
  const knownTxIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedTxRef = useRef<boolean>(false);
  const flashTimersRef = useRef<number[]>([]);
  const [isDrawerLoading, setIsDrawerLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'transactions' | 'alerts' | 'cases' | 'analytics'>('graph');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'suspicious' | 'normal'>('all');
  const [highlightPreset, setHighlightPreset] = useState<'cycle' | 'fan-in' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
  );

  const applyTransactions = useCallback((txRes: Transaction[]) => {
    if (!hasLoadedTxRef.current) {
      knownTxIdsRef.current = new Set(txRes.map((tx) => tx.id));
      hasLoadedTxRef.current = true;
      setTransactions(txRes);
      return;
    }

    const arrivedIds = txRes
      .filter((tx) => !knownTxIdsRef.current.has(tx.id))
      .map((tx) => tx.id);

    if (arrivedIds.length > 0) {
      arrivedIds.forEach((id) => knownTxIdsRef.current.add(id));
      setNewTxIds((prev) => {
        const next = new Set(prev);
        arrivedIds.forEach((id) => next.add(id));
        return next;
      });

      const timerId = window.setTimeout(() => {
        setNewTxIds((prev) => {
          const next = new Set(prev);
          arrivedIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 1800);
      flashTimersRef.current.push(timerId);
    }

    setTransactions(txRes);
  }, []);

  const applyAlerts = useCallback((alertsRes: Alert[]) => {
    const nextStatuses: Record<string, CaseStatus> = { ...accountStatusesRef.current };
    const mergedAlerts = alertsRes.map((alert) => {
      const known = nextStatuses[alert.account_id];
      if (known && alert.case_status === 'open' && known !== 'open') {
        return { ...alert, case_status: known };
      }
      nextStatuses[alert.account_id] = alert.case_status;
      return alert;
    });

    accountStatusesRef.current = nextStatuses;
    setAccountStatuses(nextStatuses);
    setAlerts(mergedAlerts);

    const activeId = selectedAccountIdRef.current;
    if (activeId && nextStatuses[activeId]) {
      const nextStatus = nextStatuses[activeId];
      setSelectedAccount((prev) =>
        prev && prev.account_id === activeId && prev.case_status !== nextStatus
          ? { ...prev, case_status: nextStatus }
          : prev
      );
    }
  }, []);

  const applyCaseStatus = useCallback((accountId: string, caseStatus: CaseStatus) => {
    accountStatusesRef.current = {
      ...accountStatusesRef.current,
      [accountId]: caseStatus,
    };
    setAccountStatuses((prev) => ({
      ...prev,
      [accountId]: caseStatus,
    }));
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.account_id === accountId ? { ...alert, case_status: caseStatus } : alert
      )
    );
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === accountId ? { ...node, case_status: caseStatus } : node
      ),
    }));
    setSelectedAccount((prev) =>
      prev && prev.account_id === accountId ? { ...prev, case_status: caseStatus } : prev
    );
  }, []);

  // Load all initial data via api.js
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, graphRes, txRes, alertsRes] = await Promise.all([
        getStats(),
        getGraph(),
        getTransactions(50),
        getAlerts(),
      ]);
      setStats(statsRes);
      setGraphData(graphRes);
      applyTransactions(txRes);
      applyAlerts(alertsRes);
    } catch (err) {
      console.error('Failed to load forensic data from api.js:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyTransactions, applyAlerts]);

  useEffect(() => {
    setIsOffline(isOfflineMode());
    return subscribeOfflineMode(setIsOffline);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll getTransactions, getAlerts, and getStats every 2s
  useEffect(() => {
    let isMounted = true;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const [txRes, alertsRes, statsRes] = await Promise.all([
          getTransactions(50),
          getAlerts(),
          getStats(),
        ]);
        if (!isMounted) return;
        applyTransactions(txRes);
        applyAlerts(alertsRes);
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to poll forensic telemetry from api.js:', err);
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [applyTransactions, applyAlerts]);

  // Poll getGraph() every 5s
  useEffect(() => {
    let isMounted = true;
    let isPolling = false;

    const pollGraph = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const graphRes = await getGraph();
        if (!isMounted) return;
        setGraphData(graphRes);
      } catch (err) {
        console.error('Failed to poll graph topology from api.js:', err);
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(pollGraph, 5000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    return () => {
      flashTimersRef.current.forEach((id) => clearTimeout(id));
      flashTimersRef.current = [];
    };
  }, []);

  // Select and drill down to account
  const handleSelectAccount = useCallback(async (accountId: string) => {
    selectedAccountIdRef.current = accountId;
    setSelectedAccountId(accountId);
    setIsDrawerLoading(true);
    try {
      const acc = await getAccount(accountId);
      const knownStatus = acc.case_status ?? accountStatusesRef.current[accountId] ?? 'open';
      setSelectedAccount({ ...acc, case_status: knownStatus });
    } catch (err) {
      console.error('Failed to get account dossier:', err);
    } finally {
      setIsDrawerLoading(false);
    }
  }, []);

  // Freeze action
  const handleFreezeAccount = useCallback(
    async (accountId: string) => {
      try {
        const res = await freezeAccount(accountId);
        const targetId = res?.account_id || accountId;
        const returnedStatus: CaseStatus = res?.case_status || 'frozen';
        applyCaseStatus(targetId, returnedStatus);

        // Refresh alerts and active account while preserving returned case_status
        const [updatedAlerts, updatedAcc] = await Promise.all([
          getAlerts(),
          selectedAccountIdRef.current === targetId ? getAccount(targetId) : Promise.resolve(null),
        ]);
        applyAlerts(updatedAlerts);
        if (updatedAcc && selectedAccountIdRef.current === targetId) {
          setSelectedAccount({
            ...updatedAcc,
            case_status: returnedStatus,
          });
        }
      } catch (err) {
        console.error('Failed to freeze account:', err);
      }
    },
    [applyCaseStatus, applyAlerts]
  );

  // Escalate action
  const handleEscalateAccount = useCallback(
    async (accountId: string) => {
      try {
        const res = await escalateAccount(accountId);
        const targetId = res?.account_id || accountId;
        const returnedStatus: CaseStatus = res?.case_status || 'escalated';
        applyCaseStatus(targetId, returnedStatus);

        // Refresh alerts and active account while preserving returned case_status
        const [updatedAlerts, updatedAcc] = await Promise.all([
          getAlerts(),
          selectedAccountIdRef.current === targetId ? getAccount(targetId) : Promise.resolve(null),
        ]);
        applyAlerts(updatedAlerts);
        if (updatedAcc && selectedAccountIdRef.current === targetId) {
          setSelectedAccount({
            ...updatedAcc,
            case_status: returnedStatus,
          });
        }
      } catch (err) {
        console.error('Failed to escalate account:', err);
      }
    },
    [applyCaseStatus, applyAlerts]
  );

  // Preset selection (Cycle vs Fan-in)
  const handleSelectPreset = (preset: 'cycle' | 'fan-in') => {
    setActiveTab('graph');
    setHighlightPreset(preset);
    if (preset === 'cycle') {
      handleSelectAccount('A101');
    } else if (preset === 'fan-in') {
      handleSelectAccount('A4821');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-[#dee2f5] flex flex-col font-body selection:bg-[#00f2fe]/30 selection:text-[#f8fafc]">
      {/* Top Header */}
      <Header
        stats={stats}
        isLoading={isLoading}
        isOffline={isOffline}
        onRefresh={loadData}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main 3-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setHighlightPreset(null);
          }}
          riskFilter={riskFilter}
          setRiskFilter={setRiskFilter}
          onSelectPreset={handleSelectPreset}
          openAlertsCount={alerts.filter((a) => a.case_status === 'open').length}
          casesCount={
            alerts.length +
            Object.entries(accountStatuses).filter(
              ([id, status]) => status !== 'open' && !alerts.some((a) => a.account_id === id)
            ).length
          }
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Canvas / Module Content */}
        <main className="flex-1 overflow-y-auto relative flex flex-col min-w-0">
          {activeTab === 'graph' && (
            <div className="flex-1 h-full min-h-[600px] flex flex-col">
              <NetworkGraph
                graphData={graphData}
                selectedAccountId={selectedAccountId}
                accountStatuses={accountStatuses}
                onSelectAccount={handleSelectAccount}
                riskFilter={riskFilter}
                highlightPreset={highlightPreset}
                onClearPreset={() => setHighlightPreset(null)}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionsTable
              transactions={transactions}
              newTxIds={newTxIds}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsPanel
              alerts={alerts}
              onSelectAccount={handleSelectAccount}
              onFreezeAccount={handleFreezeAccount}
              onEscalateAccount={handleEscalateAccount}
            />
          )}

          {activeTab === 'cases' && (
            <CasesList
              alerts={alerts}
              accountStatuses={accountStatuses}
              graphNodes={graphData.nodes}
              onSelectAccount={handleSelectAccount}
              onFreezeAccount={handleFreezeAccount}
              onEscalateAccount={handleEscalateAccount}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsCharts transactions={transactions} alerts={alerts} />
          )}
        </main>

        {/* Right Contextual Sliding Drawer (380px) for Account Drill-Down */}
        <AccountDrawer
          account={selectedAccount}
          isLoading={isDrawerLoading}
          onClose={() => {
            selectedAccountIdRef.current = null;
            setSelectedAccount(null);
            setSelectedAccountId(null);
          }}
          onFreeze={handleFreezeAccount}
          onEscalate={handleEscalateAccount}
          transactions={transactions}
          onSelectCounterparty={handleSelectAccount}
        />
      </div>
    </div>
  );
}
