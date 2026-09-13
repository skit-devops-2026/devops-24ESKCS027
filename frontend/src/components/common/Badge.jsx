import React from 'react';

const statusStyles = {
  // Event Statuses
  Published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Draft: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Ongoing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Completed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',

  // Registration Statuses
  Confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Attended: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const categoryStyles = {
  'Tech & Coding': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Cultural & Arts': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'Sports & Fitness': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Workshops & Training': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Seminars & Talks': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Gaming & E-Sports': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Networking': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

export const Badge = ({ children, variant = 'status', type, className = '', size = 'sm' }) => {
  let style = 'bg-slate-700/50 text-slate-300 border-slate-600';

  const key = type || children;
  if (variant === 'status' && statusStyles[key]) {
    style = statusStyles[key];
  } else if (variant === 'category' && categoryStyles[key]) {
    style = categoryStyles[key];
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
};
