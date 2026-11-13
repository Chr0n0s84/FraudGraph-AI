# FraudGraph AI — Real-Time Fraud & Mule Account Network Detection

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.2-orange.svg?style=flat)](https://networkx.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Hackathon Prototype**: FraudGraph AI is an enterprise-grade financial cyber intelligence and anti-money laundering (AML) detection platform. It analyzes digital payment transactions, account behavioral heuristics, and interconnected graph networks in real time to expose money mule syndicates, multi-hop circular laundering, and smurfing operations.
>
> *Disclaimer: This platform operates entirely on deterministic synthetic financial data for demonstration and security research. No real banking credentials or live funds are touched.*

---

## 🌟 Executive Summary & Problem Context

Financial crime networks and money mule rings have grown increasingly distributed:
1. **Layering & Circular Cycles**: Illicit proceeds are passed through multiple intermediary synthetic accounts (A → B → C → D → A) to obscure origin.
2. **Fan-In Mule Funnels**: Multiple compromised or recruiter accounts rapidly funnel funds into a single centralized collector mule.
3. **Fan-Out Smurfing Dispersal**: Dirty capital origins disperse structured micro-transfers (just below $10,000 CTR limits) to satellite mule drop accounts.
4. **Rapid Dormant Drain**: High-velocity depletion of dormant accounts into cash-out endpoints within minutes of receiving wires.

Traditional rule-based transaction monitoring systems analyze transfers in isolation, failing to detect network topologies. **FraudGraph AI** fuses **NetworkX Graph Algorithms**, **Scikit-learn Isolation Forests**, and **AML Regulatory Typologies** to compute **Explainable Multi-Factor Risk Scores (0–100)** with real-time WebSocket streaming.

---

## 🏗️ Architecture & System Design

```
                     ┌──────────────────────────────────────────────┐
                     │          Vite + React 18 + TypeScript        │
                     │  (Cybersecurity Dark UI + Dynamic Topology)  │
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────┴───────────────────────┐
                     │   REST APIs  ◄───────────────►  WebSockets   │
                     │  (/api/v1/*)                    (/ws/live)   │
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────▼───────────────────────┐
                     │              FastAPI Backend Core            │
                     ├──────────────────────────────────────────────┤
                     │  • Transaction Engine    • Case Management   │
                     │  • Alert Pipeline        • Real-Time Sim     │
                     └──────┬───────────────┬───────────────┬───────┘
                            │               │               │
       ┌────────────────────▼─────┐  ┌──────▼──────┐  ┌─────▼────────────────┐
       │   NetworkX Graph Engine  │  │  ML Engine  │  │  Rules Heuristics    │
       ├──────────────────────────┤  ├─────────────┤  ├──────────────────────┤
       │ • Directed Simple Cycles │  │ • Isolation │  │ • CTR Structuring    │
       │ • PageRank Centrality    │  │   Forest    │  │ • Fan-In / Fan-Out   │
       │ • Betweenness Centrality │  │ • 11-Feature│  │ • Velocity Bursts    │
       │ • k-Hop Ego Subgraphs    │  │   Vector    │  │ • Rapid Drain Deltas │
       └────────────────────┬─────┘  └──────┬──────┘  └─────┬────────────────┘
                            │               │               │
                            └───────────────┼───────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │       Explainable Risk Scoring Engine        │
                     │   Score = w_r*Rules + w_g*Graph +            │
                     │           w_m*ML + w_v*Velocity              │
                     └──────────────────────┬───────────────────────┘
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          SQLAlchemy + SQLite / Postgres      │
                     │  (Accounts, Transactions, Alerts, Cases, DB) │
                     └──────────────────────────────────────────────┘
```

---

## 📦 The 10 Core Application Modules

| Module | Purpose & Capabilities |
| :--- | :--- |
| **1. Overview Dashboard** | Real-time KPI telemetry (Processed Volume, Flagged Entities, Active Mule Rings, Prevention Rate), live hourly velocity charts, risk distribution breakdowns, and high-priority entity feed. |
| **2. Live Transaction Monitoring** | High-throughput streaming transaction ledger with real-time websocket updates, multi-criteria filtering (risk level, payment rails, flagged state), and custom transaction injection sandbox. |
| **3. Account Network Visualization** | Interactive topological graph canvas. Features high-risk glowing halo shaders, directional transaction vector flow, community cluster detection, and 1-click Account Dossier drawer. |
| **4. Fraud Detection Engine** | Transparent diagnostic breakdown of the 5 primary AML typologies (Circular Layering, Fan-In Funnel, Fan-Out Smurfing, Rapid Drain, CTR Structuring) with Isolation Forest hyperparameters. |
| **5. Risk Scoring Engine** | Interactive explainability calculator. Adjust amounts, balance ratios, and topological flags to observe real-time factor decomposition and generate audit-ready SAR text. |
| **6. Suspicious Activity Alerts** | Compliance analyst triage queue. Filter by severity (CRITICAL, HIGH, MEDIUM), batch acknowledge, resolve, and 1-click escalate directly into an active investigation case. |
| **7. Investigator Workspace** | 360-degree forensic deep dive for any account. Includes 2-hop ego-network subgraph, debit freeze controls, confirmed mule toggling, and complete chronological transaction ledger. |
| **8. Case Management** | Kanban & detail workbench. Case status workflow (`OPEN` → `INVESTIGATING` → `ESCALATED` → `CLOSED`), immutable audit trails, and investigator evidence notes. |
| **9. Analytics & Reports** | Macro syndicate cluster analytics, PageRank hub rankings, payment rail vulnerability breakdowns, and 1-click CSV export of suspicious activity. |
| **10. System Settings** | Runtime calibration of classification thresholds (`Critical >= 80`, `High >= 60`), ML weight tuning, typology rule toggles, and deterministic benchmark dataset reset. |

---

## 🔬 Detection Typologies & Mathematical Formulation

### 1. Multi-Hop Directed Cycles (Layering)
Using Johnson/Tarjan elementary circuit detection on directed multigraph $G = (V, E)$:
$$\text{Cycle}(u_1, u_2, \dots, u_k) \quad \text{where } (u_i, u_{i+1}) \in E \text{ and } (u_k, u_1) \in E \quad (3 \le k \le 6)$$
Discovers closed loops moving funds back to syndicate organizers with standard commission decay.

### 2. Hub Centrality (PageRank & Betweenness)
- **PageRank**: Computes stationary distribution representing capital concentration in aggregator nodes:
  $$PR(u) = \frac{1-d}{N} + d \sum_{v \in M(u)} \frac{PR(v) \cdot W(v,u)}{\sum_w W(v,w)}$$
- **Betweenness**: Identifies intermediary bridge accounts connecting disconnected financial cliques:
  $$C_B(v) = \sum_{s \ne v \ne t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$

### 3. Isolation Forest Anomaly Inference
Trained on an 11-dimensional feature vector:
$$\mathbf{x} = \left[ \text{amt}, \ln(1+\text{amt}), \text{bal}, \frac{\text{amt}}{\text{bal}}, w_{\text{channel}}, \text{deg}_{\text{in}}^{\text{src}}, \text{deg}_{\text{out}}^{\text{src}}, \text{deg}_{\text{in}}^{\text{tgt}}, \text{deg}_{\text{out}}^{\text{tgt}}, PR^{\text{src}}, PR^{\text{tgt}} \right]$$
Path length $h(\mathbf{x})$ across isolation trees computes anomaly score $s(\mathbf{x}, n) = 2^{-\frac{\mathbb{E}(h(\mathbf{x}))}{c(n)}}$.

### 4. Explainable Risk Score Formula
$$R = w_{\text{rules}} \cdot S_{\text{rules}} + w_{\text{graph}} \cdot S_{\text{graph}} + w_{\text{ml}} \cdot S_{\text{ml}} + w_{\text{velocity}} \cdot S_{\text{velocity}}$$
*(Default weights: Rules 30%, Graph 25%, ML 25%, Velocity 20%)*

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Option 1: Automatic 1-Click Startup (Windows)
Double-click `start.bat` or run in PowerShell:
```powershell
.\start.ps1
```
This automatically launches:
- Backend on `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`)
- Frontend on `http://127.0.0.1:5173`

---

### Option 2: Manual Terminal Startup

#### 1. Start the Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option 3: Docker Compose
```bash
docker compose up --build
```
Access the application at `http://localhost:3000`.

---

## 🧪 Verification & Test Suite

The test suite validates the detection engine, graph cycle discovery, explainability scoring, and REST API endpoints.

Run the tests inside `backend/`:
```bash
cd backend
$env:PYTHONPATH="."
python -m pytest tests -v
```

Output:
```
============================= test session starts =============================
tests/test_api.py::test_dashboard_summary_endpoint PASSED                [ 10%]
tests/test_api.py::test_accounts_endpoint PASSED                         [ 20%]
tests/test_api.py::test_transactions_endpoint PASSED                     [ 30%]
tests/test_api.py::test_graph_network_endpoint PASSED                    [ 40%]
tests/test_api.py::test_alerts_and_cases_endpoint PASSED                 [ 50%]
tests/test_graph_engine.py::test_circular_cycle_detection PASSED         [ 60%]
tests/test_graph_engine.py::test_fan_in_detection PASSED                 [ 70%]
tests/test_risk_engine.py::test_risk_scoring_explanation PASSED          [ 80%]
tests/test_rules_engine.py::test_structuring_threshold_detection PASSED  [ 90%]
tests/test_rules_engine.py::test_normal_transaction PASSED               [100%]
============================== 10 passed in 1.95s ==============================
```

---

## 🛠️ REST API Specification Highlights

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health telemetry |
| `GET` | `/api/v1/dashboard/summary` | Real-time KPI metrics & hourly trend series |
| `GET` | `/api/v1/transactions` | Paginated transactions with filter criteria |
| `GET` | `/api/v1/transactions/{id}` | Deep transaction explainability breakdown |
| `POST`| `/api/v1/transactions` | Submit and immediately score a new transaction |
| `GET` | `/api/v1/accounts` | Query entities by risk level or search query |
| `GET` | `/api/v1/accounts/{id}` | 360-degree account dossier & metrics |
| `POST`| `/api/v1/accounts/{id}/toggle-flag` | Freeze or flag suspected mule account |
| `GET` | `/api/v1/graph/network` | Full graph topology nodes and directed edges |
| `GET` | `/api/v1/graph/ego/{account_id}` | 2-hop neighborhood ego graph |
| `GET` | `/api/v1/alerts` | Alert queue filtered by severity & status |
| `POST`| `/api/v1/alerts/{id}/escalate-to-case`| 1-Click convert alert to investigation case |
| `GET` | `/api/v1/cases` | Active cases across all investigation stages |
| `PUT` | `/api/v1/cases/{id}/status` | Transition case status and append audit log |
| `POST`| `/api/v1/cases/{id}/notes` | Append investigator forensic notes |
| `GET` | `/api/v1/analytics/metrics` | Macro syndicate clusters & rail analytics |
| `GET` | `/api/v1/analytics/export/csv` | Download suspicious activity CSV report |
| `GET` | `/api/v1/settings` | Query detection thresholds & weights |
| `PUT` | `/api/v1/settings` | Save customized scoring parameters |
| `POST`| `/api/v1/simulator/control` | Start, pause, or step real-time transaction feed |
| `POST`| `/api/v1/simulator/reset` | Restore clean deterministic synthetic baseline |
| `WS`  | `/ws/live` | Bidirectional WebSocket stream for live events |

---

## 👥 Hackathon Team & Acknowledgments
Built for demonstration with modern financial intelligence architectures. Designed for compliance officers, fraud data scientists, and FIU (Financial Intelligence Unit) investigators.
