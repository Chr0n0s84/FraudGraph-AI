export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Account {
  id: number;
  account_number: string;
  holder_name: string;
  account_type: string;
  bank_name: string;
  balance: number;
  risk_score: number;
  risk_level: RiskLevel;
  is_flagged: boolean;
  flagged_reason?: string;
  mule_ring_id?: string;
  is_mule: boolean;
  in_degree: number;
  out_degree: number;
  pagerank: number;
  betweenness: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountDetail extends Account {
  total_inflow: number;
  total_outflow: number;
  transaction_count: number;
  connected_counterparties: number;
}

export interface Transaction {
  id: number;
  tx_hash: string;
  source_account_id: number;
  source_account_number?: string;
  source_holder_name?: string;
  target_account_id: number;
  target_account_number?: string;
  target_holder_name?: string;
  amount: number;
  currency: string;
  channel: string;
  status: 'COMPLETED' | 'FLAGGED' | 'BLOCKED' | 'UNDER_REVIEW';
  risk_score: number;
  risk_level: RiskLevel;
  is_flagged: boolean;
  pattern_type?: string;
  detection_reasons?: string;
  timestamp: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  details: string;
}

export interface RiskBreakdown {
  final_score: number;
  risk_level: RiskLevel;
  is_flagged: boolean;
  factors: RiskFactor[];
  explanation_summary: string;
}

export interface TransactionDetail extends Transaction {
  risk_breakdown: RiskBreakdown;
  raw_features: Record<string, any>;
}

export interface Alert {
  id: number;
  alert_type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  account_id?: number;
  transaction_id?: number;
  risk_score: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED_TO_CASE';
  metadata_json?: string;
  created_at: string;
  account_number?: string;
  holder_name?: string;
  tx_hash?: string;
  amount?: number;
}

export interface CaseNote {
  id: number;
  case_id: number;
  author: string;
  note: string;
  created_at: string;
}

export interface CaseAudit {
  id: number;
  case_id: number;
  action: string;
  author: string;
  details?: string;
  created_at: string;
}

export interface CaseItem {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'CLOSED_CONFIRMED_FRAUD' | 'CLOSED_FALSE_POSITIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to: string;
  risk_score: number;
  target_account_id?: number;
  target_account_number?: string;
  target_holder_name?: string;
  mule_ring_id?: string;
  evidence_summary?: string;
  created_at: string;
  updated_at: string;
  notes: CaseNote[];
  audit_logs: CaseAudit[];
}

export interface DashboardSummary {
  total_transactions: number;
  total_volume: number;
  total_accounts: number;
  flagged_accounts: number;
  mule_accounts: number;
  active_mule_rings: number;
  critical_alerts: number;
  blocked_transactions: number;
  avg_risk_score: number;
  fraud_prevention_rate: number;
  risk_distribution: Record<string, number>;
  hourly_trend: Array<{
    time: string;
    normal_tx: number;
    flagged_tx: number;
    volume: number;
  }>;
  pattern_breakdown: Record<string, number>;
  top_suspicious_accounts: Array<{
    id: number;
    account_number: string;
    holder_name: string;
    risk_score: number;
    risk_level: RiskLevel;
    mule_ring_id: string;
    flagged_reason: string;
  }>;
}

export interface GraphNodeData {
  id: string;
  account_id: number;
  account_number: string;
  holder_name: string;
  account_type: string;
  balance: number;
  risk_score: number;
  risk_level: RiskLevel;
  is_flagged: boolean;
  is_mule: boolean;
  mule_ring_id?: string;
  in_degree: number;
  out_degree: number;
  pagerank: number;
  betweenness: number;
  is_focus?: boolean;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  amount: number;
  channel: string;
  tx_count: number;
  risk_score: number;
  is_flagged: boolean;
  pattern_type?: string;
}

export interface NetworkGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  stats: {
    total_nodes: number;
    total_edges: number;
    flagged_nodes: number;
    mule_clusters_found: number;
    cycles_found: number;
    fan_in_nodes: number;
    fan_out_nodes: number;
    focus_account?: string;
  };
  detected_patterns: Array<{
    type: string;
    label: string;
    node_count: number;
    total_volume?: number;
    nodes: string[];
  }>;
}

export interface AnalyticsMetrics {
  mule_rings: Array<{
    ring_id: string;
    member_count: number;
    members: string[];
    total_volume: number;
    primary_topology: string;
    risk_score: number;
  }>;
  graph_topology: {
    detected_clusters_count: number;
    circular_cycles_count: number;
    fan_in_hubs_count: number;
    fan_out_hubs_count: number;
  };
  channel_analytics: Array<{
    channel: string;
    tx_count: number;
    avg_risk: number;
    total_volume: number;
  }>;
  summary: {
    total_mules: number;
    total_flagged_volume: number;
    high_risk_tx_count: number;
  };
}

export interface SystemSettings {
  critical_threshold: number;
  high_threshold: number;
  medium_threshold: number;
  weight_graph: number;
  weight_velocity: number;
  weight_ml: number;
  weight_rules: number;
  enable_circular_rule: boolean;
  enable_fan_in_rule: boolean;
  enable_fan_out_rule: boolean;
  enable_velocity_rule: boolean;
  enable_structuring_rule: boolean;
  simulator_interval_ms: number;
}
