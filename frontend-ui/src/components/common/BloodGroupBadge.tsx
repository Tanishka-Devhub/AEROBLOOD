import React from 'react';

interface BloodGroupBadgeProps {
  group: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid' | 'emergency';
  className?: string;
}

export const BloodGroupBadge: React.FC<BloodGroupBadgeProps> = ({
  group,
  size = 'md',
  variant = 'subtle',
  className = '',
}) => {
  const isNegative = group.includes('-');
  
  let baseClasses = 'inline-flex items-center justify-center font-bold tracking-tight rounded-md border';

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
  if (variant === 'emergency') {
    colorClasses = 'bg-rose-600 text-white border-rose-700 shadow-sm';
  } else if (variant === 'solid') {
    colorClasses = 'bg-slate-800 text-white border-slate-900';
  } else if (isNegative) {
    // O- or negative groups are precious universal donors
    colorClasses = 'bg-amber-50 text-amber-900 border-amber-300';
  } else {
    colorClasses = 'bg-slate-100 text-slate-900 border-slate-200';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 min-w-[28px]'
      : size === 'lg'
      ? 'text-base px-3.5 py-1.5 min-w-[48px]'
      : 'text-sm px-2.5 py-1 min-w-[36px]';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses} ${className}`}>
      {group}
    </span>
  );
};
