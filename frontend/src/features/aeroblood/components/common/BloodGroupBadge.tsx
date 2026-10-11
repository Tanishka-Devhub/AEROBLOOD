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
  
  let baseClasses = 'inline-flex items-center justify-center font-medium tracking-normal rounded-md border';

  let colorClasses = 'bg-muted text-foreground border-border';
  if (variant === 'emergency') {
    colorClasses = 'bg-primary text-foreground border-primary shadow-sm';
  } else if (variant === 'solid') {
    colorClasses = 'bg-secondary text-foreground border-border';
  } else if (isNegative) {
    // O- or negative groups are precious universal donors
    colorClasses = 'bg-accent text-blood-light border-primary';
  } else {
    colorClasses = 'bg-muted text-foreground border-border';
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
