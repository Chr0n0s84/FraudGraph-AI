/**
 * API client module for FraudGraph AI.
 * Components read data ONLY via this api.js.
 * All field names adhere strictly to the CONTRACT.
 */

import { mockStore } from "./mock.js";

export const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8000";

let offlineMode = false;
const offlineListeners = new Set();

function setOfflineMode(next) {
  if (offlineMode !== next) {
    offlineMode = next;
    offlineListeners.forEach((listener) => listener(offlineMode));
  }
}

export function isOfflineMode() {
  return offlineMode;
}

export function subscribeOfflineMode(listener) {
  offlineListeners.add(listener);
  return () => {
    offlineListeners.delete(listener);
  };
}

async function fetchWithFallback(path, options, fallback) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller ? controller.signal : undefined,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    setOfflineMode(false);
    return data;
  } catch {
    setOfflineMode(true);
    return fallback();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * GET /transactions?limit=50 (newest first)
 * Returns array of transactions:
 * [{"id":"T1","from":"A1","to":"A2","amount":48000,"time":"...","channel":"UPI","status":"high"}]
 */
export async function getTransactions(limit = 50) {
  return fetchWithFallback(
    `/transactions?limit=${encodeURIComponent(limit)}`,
    { method: "GET" },
    () => mockStore.getTransactions(limit)
  );
}

/**
 * GET /alerts
 * Returns array of alerts:
 * [{"alert_id":"AL1","account_id":"A4821","score":94,"level":"HIGH","reasons":[...],"time":"...","case_status":"open"}]
 */
export async function getAlerts() {
  return fetchWithFallback("/alerts", { method: "GET" }, () => mockStore.getAlerts());
}

/**
 * GET /graph
 * Returns graph data:
 * {"nodes":[{"id":"A1","risk":"high","score":94}],"edges":[{"source":"A1","target":"A2","amount":48000}]}
 */
export async function getGraph() {
  return fetchWithFallback("/graph", { method: "GET" }, () => mockStore.getGraph());
}

/**
 * GET /account/{id}
 * Returns account dossier:
 * {"account_id":"A4821","score":94,"level":"HIGH","reasons":[...],"age_days":12,"counterparties":18}
 */
export async function getAccount(id) {
  if (!id) throw new Error("Account ID required");
  return fetchWithFallback(
    `/account/${encodeURIComponent(id)}`,
    { method: "GET" },
    () => mockStore.getAccount(id)
  );
}

/**
 * GET /stats
 * Returns overall forensic stats:
 * {"transactions_24h":1248,"suspicious_accounts":37,"mule_networks":12,"high_alerts":8}
 */
export async function getStats() {
  return fetchWithFallback("/stats", { method: "GET" }, () => mockStore.getStats());
}

/**
 * POST /account/{id}/freeze
 * Freezes the specified account:
 * -> {"account_id":"A4821","case_status":"frozen"}
 */
export async function freezeAccount(id) {
  if (!id) throw new Error("Account ID required");
  return fetchWithFallback(
    `/account/${encodeURIComponent(id)}/freeze`,
    { method: "POST" },
    () => mockStore.freezeAccount(id)
  );
}

/**
 * POST /account/{id}/escalate
 * Escalates the specified account to Tier 2:
 * -> {"account_id":"A4821","case_status":"escalated"}
 */
export async function escalateAccount(id) {
  if (!id) throw new Error("Account ID required");
  return fetchWithFallback(
    `/account/${encodeURIComponent(id)}/escalate`,
    { method: "POST" },
    () => mockStore.escalateAccount(id)
  );
}
