# API CONTRACT: FraudGraph AI
Base URL: http://localhost:8000   Format: JSON   CORS: all origins

## Rules
1. Field names are FIXED. Never rename them.
2. You may ADD fields, never remove or rename existing ones.
3. Any change: announce in group chat and edit this file first.
4. Frontend uses src/mock.js with these exact shapes until API is ready.

## Enums
level: "LOW" | "MEDIUM" | "HIGH"
node risk: "normal" | "suspicious" | "high"
transaction status: "normal" | "suspicious" | "high"
case_status: "open" | "frozen" | "escalated"
score: integer 0-100 (0-39 LOW, 40-69 MEDIUM, 70-100 HIGH)

## GET /transactions?limit=50   (newest first)
[{"id":"T1","from":"A1","to":"A2","amount":48000,
  "time":"2026-11-11T10:30:00","channel":"UPI","status":"high"}]

## GET /alerts
[{"alert_id":"AL1","account_id":"A4821","score":94,"level":"HIGH",
  "reasons":["High velocity","Circular movement"],
  "time":"2026-11-11T10:30:05","case_status":"open"}]

## GET /graph
{"nodes":[{"id":"A1","risk":"high","score":94}],
 "edges":[{"source":"A1","target":"A2","amount":48000}]}

## GET /account/{id}
{"account_id":"A4821","score":94,"level":"HIGH",
 "reasons":["12 inbound transfers in 5 min","Part of a 5-account cycle"],
 "age_days":12,"counterparties":18}

## POST /account/{id}/freeze
-> {"account_id":"A4821","case_status":"frozen"}

## POST /account/{id}/escalate
-> {"account_id":"A4821","case_status":"escalated"}

## GET /stats
{"transactions_24h":1248,"suspicious_accounts":37,
 "mule_networks":12,"high_alerts":8}

## Ownership
M1: all endpoints in /backend/main.py
M2: score_account(id), build_graph() in /backend/detection.py
M3: consumes everything via /frontend/src/api.js