import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const norm = status.toUpperCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  // Available / Active / Fulfilled / Approved / Eligible / Passed / Healthy
  if (['AVAILABLE', 'ACTIVE', 'FULFILLED', 'APPROVED', 'ELIGIBLE', 'PASSED', 'COMPLETED', 'BALANCED'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }
  // Reserved / Partially / In Transit / Warning / Soon / Critical
  else if (['RESERVED', 'PARTIALLY_ALLOCATED', 'IN_TRANSIT', 'EXPIRING_SOON', 'URGENT', 'SHORTAGE'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  }
  // Emergency / Expired / Ineligible / Failed / Cancelled / Critical Shortage
  else if (['EMERGENCY', 'EXPIRED', 'INELIGIBLE', 'FAILED', 'CANCELLED', 'REJECTED', 'DISCARDED', 'CRITICAL'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-600 animate-pulse';
  }
  // Pending / Requested
  else if (['PENDING', 'REQUESTED', 'ALLOCATED', 'ISSUED'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500';
  }
  // Surplus
  else if (['SURPLUS'].includes(norm)) {
    colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
    dotColor = 'bg-teal-500';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3 py-1 gap-2 font-medium'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-semibold ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
