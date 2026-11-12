import {
  DashboardSummary,
  Transaction,
  TransactionDetail,
  Account,
  AccountDetail,
  NetworkGraphData,
  Alert,
  CaseItem,
  AnalyticsMetrics,
  SystemSettings
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummary>(`${API_BASE}/dashboard/summary`),

  // Transactions
  getTransactions: (params?: {
    risk_level?: string;
    channel?: string;
    is_flagged?: boolean;
    account_id?: number;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.risk_level) sp.append('risk_level', params.risk_level);
    if (params?.channel) sp.append('channel', params.channel);
    if (params?.is_flagged !== undefined) sp.append('is_flagged', String(params.is_flagged));
    if (params?.account_id) sp.append('account_id', String(params.account_id));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return fetchJson<Transaction[]>(`${API_BASE}/transactions${qs}`);
  },

  getTransactionDetail: (id: number) => fetchJson<TransactionDetail>(`${API_BASE}/transactions/${id}`),

  createTransaction: (data: {
    source_account_id: number;
    target_account_id: number;
    amount: number;
    currency?: string;
    channel: string;
  }) => fetchJson<Transaction>(`${API_BASE}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Accounts
  getAccounts: (params?: {
    risk_level?: string;
    is_flagged?: boolean;
    is_mule?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.risk_level) sp.append('risk_level', params.risk_level);
    if (params?.is_flagged !== undefined) sp.append('is_flagged', String(params.is_flagged));
    if (params?.is_mule !== undefined) sp.append('is_mule', String(params.is_mule));
    if (params?.search) sp.append('search', params.search);
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return fetchJson<Account[]>(`${API_BASE}/accounts${qs}`);
  },

  getAccountDetail: (id: number) => fetchJson<AccountDetail>(`${API_BASE}/accounts/${id}`),

  toggleAccountFlag: (id: number) => fetchJson<{ id: number; is_flagged: boolean; risk_level: string }>(
    `${API_BASE}/accounts/${id}/toggle-flag`,
    { method: 'POST' }
  ),

  // Graph
  getNetworkGraph: (params?: { limit_nodes?: number; risk_level?: string; only_flagged?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.limit_nodes) sp.append('limit_nodes', String(params.limit_nodes));
    if (params?.risk_level) sp.append('risk_level', params.risk_level);
    if (params?.only_flagged !== undefined) sp.append('only_flagged', String(params.only_flagged));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return fetchJson<NetworkGraphData>(`${API_BASE}/graph/network${qs}`);
  },

  getEgoGraph: (accountId: number, hops: number = 2) =>
    fetchJson<NetworkGraphData>(`${API_BASE}/graph/ego/${accountId}?hops=${hops}`),

  // Alerts
  getAlerts: (params?: { severity?: string; status?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.severity) sp.append('severity', params.severity);
    if (params?.status) sp.append('status', params.status);
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return fetchJson<Alert[]>(`${API_BASE}/alerts${qs}`);
  },

  updateAlertStatus: (alertId: number, status: string) =>
    fetchJson<Alert>(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  escalateAlertToCase: (alertId: number) =>
    fetchJson<{ success: boolean; case_id: number; case_number: string; alert_id: number }>(
      `${API_BASE}/alerts/${alertId}/escalate-to-case`,
      { method: 'POST' }
    ),

  // Cases
  getCases: (status?: string) => {
    const qs = status && status !== 'ALL' ? `?status=${status}` : '';
    return fetchJson<CaseItem[]>(`${API_BASE}/cases${qs}`);
  },

  getCaseDetail: (caseId: number) => fetchJson<CaseItem>(`${API_BASE}/cases/${caseId}`),

  createCase: (data: {
    title: string;
    description?: string;
    priority?: string;
    assigned_to?: string;
    risk_score?: number;
    target_account_id?: number;
    mule_ring_id?: string;
    evidence_summary?: string;
  }) => fetchJson<CaseItem>(`${API_BASE}/cases`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateCaseStatus: (caseId: number, status: string, author?: string, details?: string) =>
    fetchJson<CaseItem>(`${API_BASE}/cases/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, author: author || 'Lead Investigator', details }),
    }),

  addCaseNote: (caseId: number, note: string, author?: string) =>
    fetchJson<any>(`${API_BASE}/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note, author: author || 'Investigator' }),
    }),

  // Analytics
  getAnalyticsMetrics: () => fetchJson<AnalyticsMetrics>(`${API_BASE}/analytics/metrics`),

  // Settings
  getSettings: () => fetchJson<SystemSettings>(`${API_BASE}/settings`),

  updateSettings: (data: SystemSettings) =>
    fetchJson<{ status: string; message: string }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Simulator
  getSimulatorStatus: () => fetchJson<{ is_running: boolean; speed_ms: number }>(`${API_BASE}/simulator/status`),

  controlSimulator: (action: 'start' | 'stop' | 'step', speed_ms: number = 2000) =>
    fetchJson<any>(`${API_BASE}/simulator/control`, {
      method: 'POST',
      body: JSON.stringify({ action, speed_ms }),
    }),

  resetDatabase: (seed: number = 42) =>
    fetchJson<any>(`${API_BASE}/simulator/reset?seed=${seed}`, {
      method: 'POST',
    }),
};

