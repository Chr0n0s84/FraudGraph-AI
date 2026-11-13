import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['BLOCKED', 'CLOSED_CONFIRMED_FRAUD', 'CRITICAL'].includes(norm)) {
    styles = 'bg-red-950/80 text-red-300 border-red-500/50';
  } else if (['FLAGGED', 'INVESTIGATING', 'OPEN', 'HIGH'].includes(norm)) {
    styles = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
  } else if (['ESCALATED', 'ESCALATED_TO_CASE'].includes(norm)) {
    styles = 'bg-purple-950/80 text-purple-300 border-purple-500/50';
  } else if (['COMPLETED', 'RESOLVED', 'CLOSED_FALSE_POSITIVE'].includes(norm)) {
    styles = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
  } else if (['ACKNOWLEDGED'].includes(norm)) {
    styles = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
  }

  const label = norm.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase font-semibold border ${styles} ${className}`}>
      {label}
    </span>
  );
};

