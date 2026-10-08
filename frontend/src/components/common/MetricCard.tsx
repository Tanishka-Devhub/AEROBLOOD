import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'emergency' | 'intelligence' | 'success' | 'warning';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  className = '',
}) => {
  let iconBg = 'bg-slate-100 text-slate-700 border-slate-200';
  let borderHighlight = 'border-slate-200/90';

  if (variant === 'emergency') {
    iconBg = 'bg-rose-50 text-rose-700 border-rose-200';
    borderHighlight = 'border-rose-200 hover:border-rose-300';
  } else if (variant === 'intelligence') {
    iconBg = 'bg-teal-50 text-teal-700 border-teal-200';
    borderHighlight = 'border-teal-200 hover:border-teal-300';
  } else if (variant === 'success') {
    iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    borderHighlight = 'border-emerald-200 hover:border-emerald-300';
  } else if (variant === 'warning') {
    iconBg = 'bg-amber-50 text-amber-700 border-amber-200';
    borderHighlight = 'border-amber-200 hover:border-amber-300';
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-white border ${borderHighlight} shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl border ${iconBg}`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
