export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type NodeRisk = 'normal' | 'suspicious' | 'high';
export type TransactionStatus = 'normal' | 'suspicious' | 'high';
export type CaseStatus = 'open' | 'frozen' | 'escalated';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  time: string;
  channel: string;
  status: TransactionStatus;
}

export interface Alert {
  alert_id: string;
  account_id: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  time: string;
  case_status: CaseStatus;
}

export interface GraphNode {
  id: string;
  risk: NodeRisk;
  score: number;
  case_status?: CaseStatus;
  cluster?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  amount: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AccountDossier {
  account_id: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  age_days: number;
  counterparties: number;
  case_status?: CaseStatus;
}

export interface Stats {
  transactions_24h: number;
  suspicious_accounts: number;
  mule_networks: number;
  high_alerts: number;
}
