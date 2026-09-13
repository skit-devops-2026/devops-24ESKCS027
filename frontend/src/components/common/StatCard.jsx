import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitle, trend }) => {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-500/20 to-indigo-500/5',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      border: 'hover:border-indigo-500/50',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-500/5',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      border: 'hover:border-emerald-500/50',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-500/5',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      border: 'hover:border-amber-500/50',
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      border: 'hover:border-purple-500/50',
    },
    rose: {
      bg: 'from-rose-500/20 to-rose-500/5',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      border: 'hover:border-rose-500/50',
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      border: 'hover:border-cyan-500/50',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${scheme.bg} bg-slate-900/90 border border-slate-800 p-5 shadow-lg transition-all duration-200 ${scheme.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h4 className="mt-2 text-3xl font-extrabold tracking-tight text-white">{value}</h4>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span>↑ {trend}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${scheme.iconBg} shadow-inner`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};
