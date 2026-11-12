import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  className?: string;
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className = '', showDot = true }) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (normLevel === 'CRITICAL') {
    colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse-slow';
    dotColor = 'bg-rose-500';
  } else if (normLevel === 'HIGH') {
    colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
    dotColor = 'bg-amber-400';
  } else if (normLevel === 'MEDIUM') {
    colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
    dotColor = 'bg-cyan-400';
  } else if (normLevel === 'LOW') {
    colorClasses = 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${colorClasses} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{normLevel}</span>
      {score !== undefined && (
        <span className="opacity-80 font-bold">({score.toFixed(0)})</span>
      )}
    </span>
  );
};

