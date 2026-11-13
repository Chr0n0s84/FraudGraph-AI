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
  let glowGradient = 'from-cyan-500/10 via-transparent to-transparent';
  let iconBg = 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.2)]';
  let borderHover = 'hover:border-cyan-400/40 hover:shadow-[0_8px_30px_rgba(0,242,254,0.12)]';

  if (variant === 'red') {
    glowGradient = 'from-rose-500/15 via-rose-950/10 to-transparent';
    iconBg = 'bg-rose-950/70 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]';
    borderHover = 'hover:border-rose-400/50 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]';
  } else if (variant === 'cyan') {
    glowGradient = 'from-cyan-500/15 via-blue-950/10 to-transparent';
    iconBg = 'bg-cyan-950/70 text-cyan-400 border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.25)]';
    borderHover = 'hover:border-cyan-400/50 hover:shadow-[0_8px_30px_rgba(0,242,254,0.15)]';
  } else if (variant === 'amber') {
    glowGradient = 'from-amber-500/15 via-amber-950/10 to-transparent';
    iconBg = 'bg-amber-950/70 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    borderHover = 'hover:border-amber-400/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]';
  } else if (variant === 'emerald') {
    glowGradient = 'from-emerald-500/15 via-emerald-950/10 to-transparent';
    iconBg = 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    borderHover = 'hover:border-emerald-400/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]';
  }

  const cardClass = variant === 'red' ? 'card-3d-danger' : 'card-3d';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-5 frost-shine cursor-pointer ${cardClass} ${borderHover}`}>
      {/* 3D Specular Highlight Edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Ambient background light orb */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${glowGradient} rounded-full blur-2xl pointer-events-none`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse" />
            {title}
          </p>
          <h3 className="text-2xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-300/80 mt-1 font-sans">{subtitle}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center p-2.5 backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
          <Icon className="w-full h-full" />
        </div>
      </div>

      {trend && (
        <div className="relative z-10 mt-3 pt-3 border-t border-white/[0.08] flex items-center text-xs">
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded shadow-sm ${
            trend.isPositive ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-rose-300 bg-rose-950/70 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
          }`}>
            {trend.value}
          </span>
          <span className="text-slate-400 ml-2 font-sans text-[11px]">vs previous cycle</span>
        </div>
      )}
    </div>
  );
};
