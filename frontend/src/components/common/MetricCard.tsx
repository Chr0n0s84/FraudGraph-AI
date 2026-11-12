import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'red' | 'amber' | 'emerald' | 'default';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  let borderHover = 'hover:border-cyan-500/50';
  let iconBg = 'bg-cyber-800 text-cyan-400 border-cyan-500/30';
  let glowStyle = '';

  if (variant === 'red') {
    borderHover = 'hover:border-rose-500/60';
    iconBg = 'bg-rose-950/60 text-rose-400 border-rose-500/40';
    glowStyle = 'hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]';
  } else if (variant === 'cyan') {
    borderHover = 'hover:border-cyan-400/60';
    iconBg = 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40';
    glowStyle = 'hover:shadow-[0_0_20px_rgba(0,242,254,0.15)]';
  } else if (variant === 'amber') {
    borderHover = 'hover:border-amber-500/60';
    iconBg = 'bg-amber-950/60 text-amber-400 border-amber-500/40';
    glowStyle = 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]';
  } else if (variant === 'emerald') {
    borderHover = 'hover:border-emerald-500/60';
    iconBg = 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
    glowStyle = 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]';
  }

  return (
    <div className={`bg-cyber-900/90 border border-cyber-border rounded-xl p-5 transition-all duration-300 ${borderHover} ${glowStyle} relative overflow-hidden backdrop-blur-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-mono text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold font-mono text-slate-100 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg border flex items-center justify-center p-2.5 ${iconBg}`}>
          <Icon className="w-full h-full" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-cyber-800/80 flex items-center text-xs">
          <span className={`font-mono font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.value}
          </span>
          <span className="text-slate-500 ml-1.5 font-sans">vs previous period</span>
        </div>
      )}
    </div>
  );
};
