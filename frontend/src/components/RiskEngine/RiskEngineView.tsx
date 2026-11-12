import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Cpu,
  Network,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Copy
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export const RiskEngineView: React.FC = () => {
  // Sandbox Interactive Inputs
  const [amount, setAmount] = useState<number>(9850.0);
  const [channel, setChannel] = useState<string>('WIRE');
  const [sourceBalance, setSourceBalance] = useState<number>(10200.0);
  const [isCircularCycle, setIsCircularCycle] = useState<boolean>(false);
  const [isFanInCollector, setIsFanInCollector] = useState<boolean>(false);
  const [velocityBurstCount, setVelocityBurstCount] = useState<number>(4);
  const [copied, setCopied] = useState<boolean>(false);

  // Weights configuration
  const weights = {
    rules: 0.30,
    graph: 0.25,
    ml: 0.25,
    velocity: 0.20,
  };

  // Dynamic simulation evaluation
  const evaluation = useMemo(() => {
    // 1. Rules Score
    let rulesScore = 10.0;
    const ruleReasons: string[] = [];

    if (amount >= 9000 && amount <= 9999) {
      rulesScore = Math.max(rulesScore, 85.0);
      ruleReasons.push('Near-threshold transfer ($9,000-$9,999) - CTR evasion heuristic');
    }
    if (sourceBalance > 0 && amount >= sourceBalance * 0.85 && amount > 5000) {
      rulesScore = Math.max(rulesScore, 75.0);
      ruleReasons.push('Rapid account balance depletion (>85% drained)');
    }
    if (isCircularCycle) {
      rulesScore = 98.0;
      ruleReasons.push('Multi-hop circular layering cycle detected');
    }
    if (isFanInCollector) {
      rulesScore = Math.max(rulesScore, 90.0);
      ruleReasons.push('Centralized aggregator mule funnel convergence');
    }
    if (amount >= 50000) {
      rulesScore = Math.max(rulesScore, 65.0);
      ruleReasons.push('Extreme high-value outlier transfer');
    }

    // 2. Graph Score
    let graphScore = 15.0;
    if (isCircularCycle) graphScore = 98.0;
    else if (isFanInCollector) graphScore = 88.0;

    // 3. ML Score
    const amtToBal = amount / Math.max(1, sourceBalance);
    const chWeight = channel === 'CRYPTO_RAMP' ? 0.95 : (channel === 'WIRE' ? 0.7 : 0.5);
    const rawMl = Math.min(99.0, (Math.log1p(amount) * 3.8) + (amtToBal * 18.0) + (chWeight * 32.0));
    const mlScore = Math.round(rawMl * 10) / 10;

    // 4. Velocity Score
    const velocityScore = Math.min(100.0, velocityBurstCount * 22.0);

    // Weighted composite
    const cRules = rulesScore * weights.rules;
    const cGraph = graphScore * weights.graph;
    const cMl = mlScore * weights.ml;
    const cVelocity = velocityScore * weights.velocity;

    const finalScore = Math.min(99.9, Math.round((cRules + cGraph + cMl + cVelocity) * 10) / 10);

    let riskLevel = 'LOW';
    if (finalScore >= 80) riskLevel = 'CRITICAL';
    else if (finalScore >= 60) riskLevel = 'HIGH';
    else if (finalScore >= 35) riskLevel = 'MEDIUM';

    const isFlagged = finalScore >= 60;

    const factors = [
      {
        name: 'Regulatory AML Rules',
        score: rulesScore,
        weight: weights.rules * 100,
        contribution: Math.round(cRules * 10) / 10,
        details: ruleReasons.length ? ruleReasons.join('; ') : 'No AML rule triggers',
      },
      {
        name: 'Graph Network Topology',
        score: graphScore,
        weight: weights.graph * 100,
        contribution: Math.round(cGraph * 10) / 10,
        details: isCircularCycle ? 'Closed directed loop (Layering)' : (isFanInCollector ? 'Fan-In aggregation hub' : 'Standard topological dispersion'),
      },
      {
        name: 'ML Isolation Forest Anomaly',
        score: mlScore,
        weight: weights.ml * 100,
        contribution: Math.round(cMl * 10) / 10,
        details: mlScore >= 70 ? 'Multivariate statistical outlier' : 'Conforms to baseline distribution',
      },
      {
        name: 'Transaction Velocity Burst',
        score: velocityScore,
        weight: weights.velocity * 100,
        contribution: Math.round(cVelocity * 10) / 10,
        details: `${velocityBurstCount} transfers in 15-minute window`,
      },
    ];

    const narrative = isFlagged
      ? `FLAGGED AS ${riskLevel} RISK (${finalScore}/100): Transaction of $${amount.toLocaleString()} via ${channel} exhibited elevated risk across ${factors.filter(f => f.score >= 60).length} assessment pillars. Primary indicators: ${ruleReasons.join('; ') || 'Statistical & graph anomaly'}. Recommended for automated hold and immediate SAR review.`
      : `CLEARED AS ${riskLevel} RISK (${finalScore}/100): Transaction of $${amount.toLocaleString()} cleared standard AML rules, graph centrality tests, and ML baseline parameters without triggering regulatory intervention thresholds.`;

    return {
      finalScore,
      riskLevel,
      isFlagged,
      factors,
      narrative,
    };
  }, [amount, channel, sourceBalance, isCircularCycle, isFanInCollector, velocityBurstCount]);

  const copyNarrative = () => {
    navigator.clipboard.writeText(evaluation.narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
        <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Interactive Explainable Risk Scoring Sandbox
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Adjust transaction parameters and topological conditions to observe real-time factor weight contributions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Sandbox Controls */}
        <div className="lg:col-span-5 bg-cyber-900 border border-cyber-border rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider text-cyan-400">
            1. Simulation Parameters
          </h3>

          {/* Amount */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <label>Transfer Amount ($ USD)</label>
              <span className="text-cyan-400 font-bold">${amount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="65000"
              step="50"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$100</span>
              <span className="text-amber-400 font-bold">$9k-$10k Structuring</span>
              <span>$65k Outlier</span>
            </div>
          </div>

          {/* Account Balance */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <label>Originator Account Balance</label>
              <span className="text-slate-200">${sourceBalance.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="150000"
              step="1000"
              value={sourceBalance}
              onChange={(e) => setSourceBalance(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Channel */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="block text-slate-300">Payment Channel</label>
            <div className="grid grid-cols-2 gap-2">
              {['WIRE', 'P2P', 'ACH', 'CRYPTO_RAMP'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all ${
                    channel === ch
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                      : 'bg-cyber-950 text-slate-300 border-cyber-border hover:bg-cyber-850'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Flags */}
          <div className="space-y-2.5 pt-2 border-t border-cyber-border font-mono text-xs">
            <label className="block text-slate-400 text-[11px] uppercase tracking-wider">
              Topological Graph Conditions
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-cyber-950 border border-cyber-border cursor-pointer hover:border-slate-600 transition-colors">
              <span className="text-slate-200">Participates in Circular Directed Loop</span>
              <input
                type="checkbox"
                checked={isCircularCycle}
                onChange={(e) => setIsCircularCycle(e.target.checked)}
                className="rounded bg-cyber-900 border-cyber-border text-rose-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-cyber-950 border border-cyber-border cursor-pointer hover:border-slate-600 transition-colors">
              <span className="text-slate-200">Target is Centralized Fan-In Collector</span>
              <input
                type="checkbox"
                checked={isFanInCollector}
                onChange={(e) => setIsFanInCollector(e.target.checked)}
                className="rounded bg-cyber-900 border-cyber-border text-amber-500 focus:ring-0"
              />
            </label>
          </div>

          {/* Velocity */}
          <div className="space-y-1.5 font-mono text-xs pt-2 border-t border-cyber-border">
            <div className="flex items-center justify-between text-slate-300">
              <label>Velocity Burst (TXs in last 15 mins)</label>
              <span className="text-amber-400 font-bold">{velocityBurstCount} TXs</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={velocityBurstCount}
              onChange={(e) => setVelocityBurstCount(parseInt(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        {/* Right: Output Score Breakdown & Explainability */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Risk Gauge Card */}
          <div className="bg-cyber-900 border border-cyber-border rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-cyber-border">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Synthesized Risk Score
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-mono font-extrabold text-slate-100 tracking-tight">
                    {evaluation.finalScore}
                  </span>
                  <span className="text-sm font-mono text-slate-500">/ 100</span>
                  <RiskBadge level={evaluation.riskLevel} className="text-sm px-3 py-1" />
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block mb-1">Policy Outcome</span>
                <span className={`text-base font-mono font-bold ${
                  evaluation.finalScore >= 80 ? 'text-rose-400' : (evaluation.finalScore >= 60 ? 'text-amber-400' : 'text-emerald-400')
                }`}>
                  {evaluation.finalScore >= 80 ? 'HOLD & BLOCK' : (evaluation.finalScore >= 60 ? 'FLAG FOR SAR REVIEW' : 'AUTOMATIC CLEAR')}
                </span>
              </div>
            </div>

            {/* Factor Decomposition */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Factor Decomposition Matrix
              </h4>

              {evaluation.factors.map((f, i) => {
                const pct = Math.min(100, f.score);
                let barColor = 'bg-emerald-500';
                if (pct >= 80) barColor = 'bg-rose-500';
                else if (pct >= 60) barColor = 'bg-amber-500';
                else if (pct >= 35) barColor = 'bg-cyan-500';

                return (
                  <div key={i} className="bg-cyber-850 p-3.5 rounded-xl border border-cyber-border text-xs font-mono">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">
                        {f.name} <span className="text-slate-500 font-normal">({f.weight}% weight)</span>
                      </span>
                      <span className="text-slate-100 font-bold">
                        {f.score} <span className="text-cyan-400 text-[11px]">(+{f.contribution} pts)</span>
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-cyber-950 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans">{f.details}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regulatory Audit Narrative */}
          <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Audit-Ready Regulatory Narrative (Explainability Output)
              </h4>
              <button
                onClick={copyNarrative}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy SAR Text'}
              </button>
            </div>

            <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-border font-mono text-xs text-slate-300 leading-relaxed">
              {evaluation.narrative}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
