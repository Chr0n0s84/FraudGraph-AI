/**
 * Mock data conforming strictly to the API CONTRACT: FraudGraph AI
 * Rules:
 * 1. Field names are FIXED. Never rename them.
 * 2. You may ADD fields, never remove or rename existing ones.
 *
 * Enums:
 * level: "LOW" | "MEDIUM" | "HIGH"
 * node risk: "normal" | "suspicious" | "high"
 * transaction status: "normal" | "suspicious" | "high"
 * case_status: "open" | "frozen" | "escalated"
 * score: integer 0-100 (0-39 LOW, 40-69 MEDIUM, 70-100 HIGH)
 */

// 1. STATS
export const initialStats = {
  transactions_24h: 1248,
  suspicious_accounts: 37,
  mule_networks: 12,
  high_alerts: 8,
};

// 2. NODES (~40 nodes: including 5-node red cycle & red fan-in cluster)
// Red 5-node cycle: A101, A102, A103, A104, A105
const cycleNodes = [
  { id: "A101", risk: "high", score: 96, cluster: "cycle" },
  { id: "A102", risk: "high", score: 92, cluster: "cycle" },
  { id: "A103", risk: "high", score: 91, cluster: "cycle" },
  { id: "A104", risk: "high", score: 88, cluster: "cycle" },
  { id: "A105", risk: "high", score: 93, cluster: "cycle" },
];

// Red fan-in cluster: aggregator A4821 + feeders A201..A208
const fanInNodes = [
  { id: "A4821", risk: "high", score: 94, cluster: "fan-in-hub" },
  { id: "A201", risk: "high", score: 87, cluster: "fan-in" },
  { id: "A202", risk: "high", score: 85, cluster: "fan-in" },
  { id: "A203", risk: "high", score: 89, cluster: "fan-in" },
  { id: "A204", risk: "high", score: 90, cluster: "fan-in" },
  { id: "A205", risk: "suspicious", score: 68, cluster: "fan-in" },
  { id: "A206", risk: "suspicious", score: 62, cluster: "fan-in" },
  { id: "A207", risk: "high", score: 82, cluster: "fan-in" },
  { id: "A208", risk: "high", score: 85, cluster: "fan-in" },
];

// Suspicious intermediate chain accounts (layering)
const suspiciousChainNodes = [
  { id: "A301", risk: "suspicious", score: 64, cluster: "layering" },
  { id: "A302", risk: "suspicious", score: 67, cluster: "layering" },
  { id: "A303", risk: "suspicious", score: 59, cluster: "layering" },
  { id: "A304", risk: "suspicious", score: 61, cluster: "layering" },
  { id: "A305", risk: "suspicious", score: 58, cluster: "layering" },
  { id: "A306", risk: "suspicious", score: 52, cluster: "layering" },
  { id: "A307", risk: "suspicious", score: 49, cluster: "layering" },
];

// Normal accounts (everyday legitimate commerce & retail)
const normalNodes = [
  { id: "A401", risk: "normal", score: 12, cluster: "normal" },
  { id: "A402", risk: "normal", score: 8, cluster: "normal" },
  { id: "A403", risk: "normal", score: 15, cluster: "normal" },
  { id: "A404", risk: "normal", score: 22, cluster: "normal" },
  { id: "A405", risk: "normal", score: 18, cluster: "normal" },
  { id: "A406", risk: "normal", score: 5, cluster: "normal" },
  { id: "A407", risk: "normal", score: 14, cluster: "normal" },
  { id: "A408", risk: "normal", score: 9, cluster: "normal" },
  { id: "A409", risk: "normal", score: 27, cluster: "normal" },
  { id: "A410", risk: "normal", score: 16, cluster: "normal" },
  { id: "A411", risk: "normal", score: 11, cluster: "normal" },
  { id: "A412", risk: "normal", score: 19, cluster: "normal" },
  { id: "A413", risk: "normal", score: 7, cluster: "normal" },
  { id: "A414", risk: "normal", score: 24, cluster: "normal" },
  { id: "A415", risk: "normal", score: 13, cluster: "normal" },
  { id: "A416", risk: "normal", score: 31, cluster: "normal" },
  { id: "A417", risk: "normal", score: 6, cluster: "normal" },
  { id: "A418", risk: "normal", score: 20, cluster: "normal" },
  { id: "A419", risk: "normal", score: 17, cluster: "normal" },
];

export const initialGraphNodes = [
  ...cycleNodes,
  ...fanInNodes,
  ...suspiciousChainNodes,
  ...normalNodes,
]; // Exactly 40 nodes!

// 3. EDGES
export const initialGraphEdges = [
  // 5-Node Cycle (A101 -> A102 -> A103 -> A104 -> A105 -> A101)
  { source: "A101", target: "A102", amount: 48000 },
  { source: "A102", target: "A103", amount: 47500 },
  { source: "A103", target: "A104", amount: 46800 },
  { source: "A104", target: "A105", amount: 46200 },
  { source: "A105", target: "A101", amount: 45500 },

  // Red Fan-In Cluster: All feeders target hub A4821
  { source: "A201", target: "A4821", amount: 98000 },
  { source: "A202", target: "A4821", amount: 89500 },
  { source: "A203", target: "A4821", amount: 94000 },
  { source: "A204", target: "A4821", amount: 115000 },
  { source: "A205", target: "A4821", amount: 72000 },
  { source: "A206", target: "A4821", amount: 64000 },
  { source: "A207", target: "A4821", amount: 88000 },
  { source: "A208", target: "A4821", amount: 102000 },
  // Hub connects to laundering cycle
  { source: "A4821", target: "A101", amount: 550000 },

  // Suspicious Chain & Layering
  { source: "A301", target: "A302", amount: 35000 },
  { source: "A302", target: "A303", amount: 33800 },
  { source: "A303", target: "A304", amount: 31000 },
  { source: "A304", target: "A203", amount: 28500 },
  { source: "A305", target: "A306", amount: 42000 },
  { source: "A306", target: "A307", amount: 39500 },
  { source: "A307", target: "A103", amount: 37000 },

  // Normal everyday retail network
  { source: "A401", target: "A402", amount: 1200 },
  { source: "A402", target: "A403", amount: 450 },
  { source: "A403", target: "A404", amount: 3200 },
  { source: "A404", target: "A405", amount: 890 },
  { source: "A405", target: "A406", amount: 1500 },
  { source: "A406", target: "A407", amount: 2300 },
  { source: "A407", target: "A408", amount: 780 },
  { source: "A408", target: "A409", amount: 4100 },
  { source: "A409", target: "A410", amount: 1950 },
  { source: "A410", target: "A411", amount: 620 },
  { source: "A411", target: "A412", amount: 3400 },
  { source: "A412", target: "A413", amount: 950 },
  { source: "A413", target: "A414", amount: 1800 },
  { source: "A414", target: "A415", amount: 5100 },
  { source: "A415", target: "A416", amount: 2100 },
  { source: "A416", target: "A417", amount: 870 },
  { source: "A417", target: "A418", amount: 3650 },
  { source: "A418", target: "A419", amount: 1420 },
  { source: "A419", target: "A401", amount: 2890 },
  { source: "A403", target: "A410", amount: 1600 },
  { source: "A407", target: "A415", amount: 2400 },
];

// 4. ALERTS
export const initialAlerts = [
  {
    alert_id: "AL1",
    account_id: "A4821",
    score: 94,
    level: "HIGH",
    reasons: ["High velocity", "Circular movement"],
    time: "2026-11-11T10:30:05",
    case_status: "open",
  },
  {
    alert_id: "AL2",
    account_id: "A101",
    score: 96,
    level: "HIGH",
    reasons: ["Circular wash cycle", "Rapid layering"],
    time: "2026-11-11T10:28:40",
    case_status: "open",
  },
  {
    alert_id: "AL3",
    account_id: "A103",
    score: 91,
    level: "HIGH",
    reasons: ["Part of a 5-account cycle", "Structured fund flow"],
    time: "2026-11-11T10:25:12",
    case_status: "open",
  },
  {
    alert_id: "AL4",
    account_id: "A204",
    score: 90,
    level: "HIGH",
    reasons: ["High-frequency feeder", "Synthetic ID indicator"],
    time: "2026-11-11T10:20:00",
    case_status: "open",
  },
  {
    alert_id: "AL5",
    account_id: "A105",
    score: 93,
    level: "HIGH",
    reasons: ["Circular fund dissipation", "Sanction proximity"],
    time: "2026-11-11T10:15:30",
    case_status: "open",
  },
  {
    alert_id: "AL6",
    account_id: "A302",
    score: 67,
    level: "MEDIUM",
    reasons: ["Velocity spike", "Unusual counterparty"],
    time: "2026-11-11T10:14:22",
    case_status: "open",
  },
  {
    alert_id: "AL7",
    account_id: "A305",
    score: 58,
    level: "MEDIUM",
    reasons: ["New device login", "Dormant account reactivation"],
    time: "2026-11-11T10:08:15",
    case_status: "open",
  },
  {
    alert_id: "AL8",
    account_id: "A208",
    score: 85,
    level: "HIGH",
    reasons: ["Mule account fingerprint", "Instant outbound drain"],
    time: "2026-11-11T09:42:30",
    case_status: "open",
  },
];

// 5. TRANSACTIONS (50 items, newest first)
export const initialTransactions = [
  { id: "T1", from: "A4821", to: "A101", amount: 550000, time: "2026-11-11T10:30:00", channel: "UPI", status: "high" },
  { id: "T2", from: "A105", to: "A101", amount: 45500, time: "2026-11-11T10:29:15", channel: "IMPS", status: "high" },
  { id: "T3", from: "A104", to: "A105", amount: 46200, time: "2026-11-11T10:28:40", channel: "RTGS", status: "high" },
  { id: "T4", from: "A208", to: "A4821", amount: 102000, time: "2026-11-11T10:27:50", channel: "UPI", status: "high" },
  { id: "T5", from: "A103", to: "A104", amount: 46800, time: "2026-11-11T10:26:10", channel: "NEFT", status: "high" },
  { id: "T6", from: "A207", to: "A4821", amount: 88000, time: "2026-11-11T10:25:30", channel: "UPI", status: "high" },
  { id: "T7", from: "A102", to: "A103", amount: 47500, time: "2026-11-11T10:24:00", channel: "IMPS", status: "high" },
  { id: "T8", from: "A204", to: "A4821", amount: 115000, time: "2026-11-11T10:22:45", channel: "UPI", status: "high" },
  { id: "T9", from: "A101", to: "A102", amount: 48000, time: "2026-11-11T10:21:10", channel: "UPI", status: "high" },
  { id: "T10", from: "A203", to: "A4821", amount: 94000, time: "2026-11-11T10:19:30", channel: "UPI", status: "high" },
  { id: "T11", from: "A307", to: "A103", amount: 37000, time: "2026-11-11T10:18:20", channel: "RTGS", status: "suspicious" },
  { id: "T12", from: "A202", to: "A4821", amount: 89500, time: "2026-11-11T10:17:15", channel: "IMPS", status: "high" },
  { id: "T13", from: "A306", to: "A307", amount: 39500, time: "2026-11-11T10:16:00", channel: "UPI", status: "suspicious" },
  { id: "T14", from: "A201", to: "A4821", amount: 98000, time: "2026-11-11T10:14:40", channel: "UPI", status: "high" },
  { id: "T15", from: "A301", to: "A302", amount: 35000, time: "2026-11-11T10:13:25", channel: "NEFT", status: "suspicious" },
  { id: "T16", from: "A302", to: "A303", amount: 33800, time: "2026-11-11T10:12:00", channel: "IMPS", status: "suspicious" },
  { id: "T17", from: "A205", to: "A4821", amount: 72000, time: "2026-11-11T10:10:45", channel: "UPI", status: "suspicious" },
  { id: "T18", from: "A305", to: "A306", amount: 42000, time: "2026-11-11T10:09:10", channel: "RTGS", status: "suspicious" },
  { id: "T19", from: "A206", to: "A4821", amount: 64000, time: "2026-11-11T10:07:30", channel: "UPI", status: "suspicious" },
  { id: "T20", from: "A303", to: "A304", amount: 31000, time: "2026-11-11T10:05:50", channel: "UPI", status: "suspicious" },
  { id: "T21", from: "A304", to: "A203", amount: 28500, time: "2026-11-11T10:04:15", channel: "IMPS", status: "suspicious" },
  { id: "T22", from: "A401", to: "A402", amount: 1200, time: "2026-11-11T10:01:00", channel: "UPI", status: "normal" },
  { id: "T23", from: "A402", to: "A403", amount: 450, time: "2026-11-11T09:58:30", channel: "UPI", status: "normal" },
  { id: "T24", from: "A403", to: "A404", amount: 3200, time: "2026-11-11T09:55:12", channel: "NEFT", status: "normal" },
  { id: "T25", from: "A404", to: "A405", amount: 890, time: "2026-11-11T09:52:45", channel: "UPI", status: "normal" },
  { id: "T26", from: "A405", to: "A406", amount: 1500, time: "2026-11-11T09:50:00", channel: "IMPS", status: "normal" },
  { id: "T27", from: "A406", to: "A407", amount: 2300, time: "2026-11-11T09:47:18", channel: "UPI", status: "normal" },
  { id: "T28", from: "A407", to: "A408", amount: 780, time: "2026-11-11T09:44:00", channel: "UPI", status: "normal" },
  { id: "T29", from: "A408", to: "A409", amount: 4100, time: "2026-11-11T09:40:30", channel: "RTGS", status: "normal" },
  { id: "T30", from: "A409", to: "A410", amount: 1950, time: "2026-11-11T09:37:15", channel: "UPI", status: "normal" },
  { id: "T31", from: "A410", to: "A411", amount: 620, time: "2026-11-11T09:34:00", channel: "UPI", status: "normal" },
  { id: "T32", from: "A411", to: "A412", amount: 3400, time: "2026-11-11T09:30:25", channel: "NEFT", status: "normal" },
  { id: "T33", from: "A412", to: "A413", amount: 950, time: "2026-11-11T09:27:00", channel: "UPI", status: "normal" },
  { id: "T34", from: "A413", to: "A414", amount: 1800, time: "2026-11-11T09:23:40", channel: "IMPS", status: "normal" },
  { id: "T35", from: "A414", to: "A415", amount: 5100, time: "2026-11-11T09:20:10", channel: "RTGS", status: "normal" },
  { id: "T36", from: "A415", to: "A416", amount: 2100, time: "2026-11-11T09:17:00", channel: "UPI", status: "normal" },
  { id: "T37", from: "A416", to: "A417", amount: 870, time: "2026-11-11T09:13:30", channel: "UPI", status: "normal" },
  { id: "T38", from: "A417", to: "A418", amount: 3650, time: "2026-11-11T09:10:00", channel: "NEFT", status: "normal" },
  { id: "T39", from: "A418", to: "A419", amount: 1420, time: "2026-11-11T09:05:40", channel: "UPI", status: "normal" },
  { id: "T40", from: "A419", to: "A401", amount: 2890, time: "2026-11-11T09:00:15", channel: "IMPS", status: "normal" },
  { id: "T41", from: "A403", to: "A410", amount: 1600, time: "2026-11-11T08:55:00", channel: "UPI", status: "normal" },
  { id: "T42", from: "A407", to: "A415", amount: 2400, time: "2026-11-11T08:50:30", channel: "UPI", status: "normal" },
  { id: "T43", from: "A201", to: "A202", amount: 15000, time: "2026-11-11T08:45:00", channel: "IMPS", status: "suspicious" },
  { id: "T44", from: "A402", to: "A409", amount: 980, time: "2026-11-11T08:40:00", channel: "UPI", status: "normal" },
  { id: "T45", from: "A411", to: "A418", amount: 1100, time: "2026-11-11T08:35:10", channel: "UPI", status: "normal" },
  { id: "T46", from: "A102", to: "A105", amount: 22000, time: "2026-11-11T08:28:00", channel: "RTGS", status: "high" },
  { id: "T47", from: "A404", to: "A412", amount: 760, time: "2026-11-11T08:20:00", channel: "UPI", status: "normal" },
  { id: "T48", from: "A413", to: "A417", amount: 1350, time: "2026-11-11T08:12:40", channel: "UPI", status: "normal" },
  { id: "T49", from: "A301", to: "A304", amount: 18500, time: "2026-11-11T08:05:00", channel: "NEFT", status: "suspicious" },
  { id: "T50", from: "A405", to: "A414", amount: 2250, time: "2026-11-11T08:00:00", channel: "UPI", status: "normal" },
];

// 6. ACCOUNTS DICTIONARY (for GET /account/{id})
export const initialAccounts = {
  A4821: {
    account_id: "A4821",
    score: 94,
    level: "HIGH",
    reasons: ["12 inbound transfers in 5 min", "Part of a 5-account cycle", "Fan-in aggregator for multiple high-velocity nodes"],
    age_days: 12,
    counterparties: 18,
    case_status: "open",
  },
  A101: {
    account_id: "A101",
    score: 96,
    level: "HIGH",
    reasons: ["Circular wash cycle hub", "High-velocity layer 1 smurfing", "Rapid fund dissipation"],
    age_days: 9,
    counterparties: 14,
    case_status: "open",
  },
  A102: {
    account_id: "A102",
    score: 92,
    level: "HIGH",
    reasons: ["Immediate pass-through of funds", "Part of a 5-account cycle"],
    age_days: 14,
    counterparties: 8,
    case_status: "open",
  },
  A103: {
    account_id: "A103",
    score: 91,
    level: "HIGH",
    reasons: ["Structured fund flow", "Part of a 5-account cycle", "Cross-channel dispersion"],
    age_days: 16,
    counterparties: 11,
    case_status: "open",
  },
  A104: {
    account_id: "A104",
    score: 88,
    level: "HIGH",
    reasons: ["Part of a 5-account cycle", "Micro-structuring below AML threshold"],
    age_days: 19,
    counterparties: 6,
    case_status: "open",
  },
  A105: {
    account_id: "A105",
    score: 93,
    level: "HIGH",
    reasons: ["Part of a 5-account cycle", "Circular movement closure", "Sanction proximity risk"],
    age_days: 10,
    counterparties: 9,
    case_status: "open",
  },
  A201: {
    account_id: "A201",
    score: 87,
    level: "HIGH",
    reasons: ["High velocity outbound to aggregator", "Synthetic ID flag"],
    age_days: 5,
    counterparties: 4,
    case_status: "open",
  },
  A204: {
    account_id: "A204",
    score: 90,
    level: "HIGH",
    reasons: ["High-frequency feeder", "Synthetic ID indicator", "Dormant account sudden surge"],
    age_days: 7,
    counterparties: 5,
    case_status: "open",
  },
  A208: {
    account_id: "A208",
    score: 85,
    level: "HIGH",
    reasons: ["Mule account fingerprint", "Instant outbound drain"],
    age_days: 8,
    counterparties: 6,
    case_status: "open",
  },
  A302: {
    account_id: "A302",
    score: 67,
    level: "MEDIUM",
    reasons: ["Velocity spike", "Unusual counterparty", "Layering hop suspect"],
    age_days: 45,
    counterparties: 12,
    case_status: "open",
  },
  A305: {
    account_id: "A305",
    score: 58,
    level: "MEDIUM",
    reasons: ["New device login", "Dormant account reactivation"],
    age_days: 90,
    counterparties: 7,
    case_status: "open",
  },
  A401: {
    account_id: "A401",
    score: 12,
    level: "LOW",
    reasons: ["Normal consumer retail activity", "Consistent payroll inflow"],
    age_days: 420,
    counterparties: 26,
    case_status: "open",
  },
  A402: {
    account_id: "A402",
    score: 8,
    level: "LOW",
    reasons: ["Clean counterparty history", "Verified merchant entity"],
    age_days: 680,
    counterparties: 42,
    case_status: "open",
  },
};

// Mutable runtime state (cloned from initial data so state persists per session)
class MockStore {
  constructor() {
    this.stats = { ...initialStats };
    this.nodes = JSON.parse(JSON.stringify(initialGraphNodes));
    this.edges = JSON.parse(JSON.stringify(initialGraphEdges));
    this.alerts = JSON.parse(JSON.stringify(initialAlerts));
    this.transactions = JSON.parse(JSON.stringify(initialTransactions));
    this.accounts = JSON.parse(JSON.stringify(initialAccounts));
  }

  getTransactions(limit = 50) {
    return this.transactions.slice(0, limit);
  }

  getAlerts() {
    return this.alerts;
  }

  getGraph() {
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  getAccount(id) {
    if (this.accounts[id]) {
      return { ...this.accounts[id] };
    }
    // Fallback based on node if present in graph
    const foundNode = this.nodes.find((n) => n.id === id);
    const score = foundNode ? foundNode.score : 25;
    const level = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
    const risk = foundNode ? foundNode.risk : "normal";

    const generated = {
      account_id: id,
      score,
      level,
      reasons:
        risk === "high"
          ? ["High velocity outbound transactions", "Suspected mule network intermediary"]
          : risk === "suspicious"
          ? ["Irregular transaction time", "Velocity fluctuation detected"]
          : ["Standard retail banking behavior", "Verified account"],
      age_days: 35 + Math.floor(Math.random() * 200),
      counterparties: 4 + Math.floor(Math.random() * 15),
      case_status: "open",
    };
    this.accounts[id] = generated;
    return { ...generated };
  }

  getStats() {
    return { ...this.stats };
  }

  freezeAccount(id) {
    const acc = this.getAccount(id);
    acc.case_status = "frozen";
    this.accounts[id] = acc;

    // Also update alerts for this account
    this.alerts.forEach((alert) => {
      if (alert.account_id === id) {
        alert.case_status = "frozen";
      }
    });

    return {
      account_id: id,
      case_status: "frozen",
    };
  }

  escalateAccount(id) {
    const acc = this.getAccount(id);
    acc.case_status = "escalated";
    this.accounts[id] = acc;

    // Also update alerts for this account
    this.alerts.forEach((alert) => {
      if (alert.account_id === id) {
        alert.case_status = "escalated";
      }
    });

    return {
      account_id: id,
      case_status: "escalated",
    };
  }
}

export const mockStore = new MockStore();
