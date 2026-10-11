import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const norm = status.toUpperCase().trim();

  let colorClasses = 'bg-muted text-foreground border-border';
  let dotColor = 'bg-muted';

  // Available / Active / Fulfilled / Approved / Eligible / Passed / Healthy
  if (['AVAILABLE', 'ACTIVE', 'FULFILLED', 'APPROVED', 'ELIGIBLE', 'PASSED', 'COMPLETED', 'BALANCED'].includes(norm)) {
    colorClasses = 'bg-accent text-clinical border-primary';
    dotColor = 'bg-primary';
  }
  // Reserved / Partially / In Transit / Warning / Soon / Critical
  else if (['RESERVED', 'PARTIALLY_ALLOCATED', 'IN_TRANSIT', 'EXPIRING_SOON', 'URGENT', 'SHORTAGE'].includes(norm)) {
    colorClasses = 'bg-accent text-blood-light border-primary';
    dotColor = 'bg-primary';
  }
  // Emergency / Expired / Ineligible / Failed / Cancelled / Critical Shortage
  else if (['EMERGENCY', 'EXPIRED', 'INELIGIBLE', 'FAILED', 'CANCELLED', 'REJECTED', 'DISCARDED', 'CRITICAL'].includes(norm)) {
    colorClasses = 'bg-accent text-blood-light border-primary';
    dotColor = 'bg-primary animate-pulse';
  }
  // Pending / Requested
  else if (['PENDING', 'REQUESTED', 'ALLOCATED', 'ISSUED'].includes(norm)) {
    colorClasses = 'bg-accent text-foreground border-primary';
    dotColor = 'bg-primary';
  }
  // Surplus
  else if (['SURPLUS'].includes(norm)) {
    colorClasses = 'bg-accent text-clinical border-primary';
    dotColor = 'bg-primary';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3 py-1 gap-2 font-medium'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-normal uppercase font-semibold ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
