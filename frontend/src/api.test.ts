import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTransactions,
  getAlerts,
  getGraph,
  getAccount,
  getStats,
  freezeAccount,
  escalateAccount,
} from './api.js';

test('getStats conforms to CONTRACT fields', async () => {
  const stats = await getStats();
  assert.equal(typeof stats.transactions_24h, 'number');
  assert.equal(typeof stats.suspicious_accounts, 'number');
  assert.equal(typeof stats.mule_networks, 'number');
  assert.equal(typeof stats.high_alerts, 'number');
  assert.equal(stats.transactions_24h, 1248);
  assert.equal(stats.suspicious_accounts, 37);
  assert.equal(stats.mule_networks, 12);
  assert.equal(stats.high_alerts, 8);
});

test('getTransactions returns 50 items with required contract fields', async () => {
  const txs = await getTransactions(50);
  assert.equal(txs.length, 50);
  for (const tx of txs) {
    assert.ok(tx.id, 'Transaction must have id');
    assert.ok(tx.from, 'Transaction must have from');
    assert.ok(tx.to, 'Transaction must have to');
    assert.equal(typeof tx.amount, 'number');
    assert.ok(tx.time, 'Transaction must have time');
    assert.ok(['UPI', 'IMPS', 'RTGS', 'NEFT', 'Wire'].includes(tx.channel));
    assert.ok(['normal', 'suspicious', 'high'].includes(tx.status));
  }
});

test('getAlerts returns alert items with required contract fields', async () => {
  const alerts = await getAlerts();
  assert.ok(alerts.length >= 8);
  for (const alert of alerts) {
    assert.ok(alert.alert_id);
    assert.ok(alert.account_id);
    assert.equal(typeof alert.score, 'number');
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(alert.level));
    assert.ok(Array.isArray(alert.reasons));
    assert.ok(alert.time);
    assert.ok(['open', 'frozen', 'escalated'].includes(alert.case_status));
  }
});

test('getGraph returns ~40 nodes with 5-node red cycle and fan-in cluster', async () => {
  const graph = await getGraph();
  assert.equal(graph.nodes.length, 40, 'Should have exactly 40 nodes');
  assert.ok(graph.edges.length >= 25, 'Should have robust edge relationships');

  // Verify 5-node red cycle
  const cycleIds = ['A101', 'A102', 'A103', 'A104', 'A105'];
  for (const id of cycleIds) {
    const node = graph.nodes.find((n: { id: string }) => n.id === id);
    assert.ok(node, `Node ${id} in cycle exists`);
    assert.equal(node.risk, 'high', `Cycle node ${id} must be high risk`);
  }

  // Verify cyclic edges: A101->A102->A103->A104->A105->A101
  const cycleEdges = [
    ['A101', 'A102'],
    ['A102', 'A103'],
    ['A103', 'A104'],
    ['A104', 'A105'],
    ['A105', 'A101'],
  ];
  for (const [src, tgt] of cycleEdges) {
    const edge = graph.edges.find((e: { source: any; target: any }) => e.source === src && e.target === tgt);
    assert.ok(edge, `Cycle edge from ${src} to ${tgt} must exist`);
    assert.ok(edge.amount > 0);
  }

  // Verify fan-in cluster targeting A4821
  const hubNode = graph.nodes.find((n: { id: string }) => n.id === 'A4821');
  assert.ok(hubNode, 'Fan-in hub A4821 must exist');
  assert.equal(hubNode.risk, 'high');

  const fanInInbound = graph.edges.filter((e: { target: any }) => e.target === 'A4821');
  assert.ok(fanInInbound.length >= 6, 'A4821 must have >= 6 inbound feeder edges');
});

test('getAccount returns valid contract fields and supports freeze/escalate mutations', async () => {
  const acc = await getAccount('A4821');
  assert.equal(acc.account_id, 'A4821');
  assert.equal(acc.score, 94);
  assert.equal(acc.level, 'HIGH');
  assert.ok(Array.isArray(acc.reasons));
  assert.equal(acc.age_days, 12);
  assert.equal(acc.counterparties, 18);

  // Freeze action
  const frozenRes = await freezeAccount('A4821');
  assert.equal(frozenRes.account_id, 'A4821');
  assert.equal(frozenRes.case_status, 'frozen');

  const updatedAcc = await getAccount('A4821');
  assert.equal(updatedAcc.case_status, 'frozen');

  // Escalate action
  const escalatedRes = await escalateAccount('A101');
  assert.equal(escalatedRes.account_id, 'A101');
  assert.equal(escalatedRes.case_status, 'escalated');
});
