/**
 * API client module for FraudGraph AI / Obsidian Forensics.
 * Components read data ONLY via this api.js.
 * All field names adhere strictly to the CONTRACT.
 */

import { mockStore } from "./mock.js";

/**
 * GET /transactions?limit=50 (newest first)
 * Returns array of transactions:
 * [{"id":"T1","from":"A1","to":"A2","amount":48000,"time":"...","channel":"UPI","status":"high"}]
 */
export async function getTransactions(limit = 50) {
  // Simulate standard network latency for fidelity
  return Promise.resolve(mockStore.getTransactions(limit));
}

/**
 * GET /alerts
 * Returns array of alerts:
 * [{"alert_id":"AL1","account_id":"A4821","score":94,"level":"HIGH","reasons":[...],"time":"...","case_status":"open"}]
 */
export async function getAlerts() {
  return Promise.resolve(mockStore.getAlerts());
}

/**
 * GET /graph
 * Returns graph data:
 * {"nodes":[{"id":"A1","risk":"high","score":94}],"edges":[{"source":"A1","target":"A2","amount":48000}]}
 */
export async function getGraph() {
  return Promise.resolve(mockStore.getGraph());
}

/**
 * GET /account/{id}
 * Returns account dossier:
 * {"account_id":"A4821","score":94,"level":"HIGH","reasons":[...],"age_days":12,"counterparties":18}
 */
export async function getAccount(id) {
  if (!id) throw new Error("Account ID required");
  return Promise.resolve(mockStore.getAccount(id));
}

/**
 * GET /stats
 * Returns overall forensic stats:
 * {"transactions_24h":1248,"suspicious_accounts":37,"mule_networks":12,"high_alerts":8}
 */
export async function getStats() {
  return Promise.resolve(mockStore.getStats());
}

/**
 * POST /account/{id}/freeze
 * Freezes the specified account:
 * -> {"account_id":"A4821","case_status":"frozen"}
 */
export async function freezeAccount(id) {
  if (!id) throw new Error("Account ID required");
  return Promise.resolve(mockStore.freezeAccount(id));
}

/**
 * POST /account/{id}/escalate
 * Escalates the specified account to Tier 2:
 * -> {"account_id":"A4821","case_status":"escalated"}
 */
export async function escalateAccount(id) {
  if (!id) throw new Error("Account ID required");
  return Promise.resolve(mockStore.escalateAccount(id));
}
