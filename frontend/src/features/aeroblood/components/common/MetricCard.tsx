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
  let iconBg = 'bg-muted text-foreground border-border';
  let borderHighlight = 'border-border/90';

  if (variant === 'emergency') {
    iconBg = 'bg-accent text-blood-light border-primary';
    borderHighlight = 'border-primary hover:border-primary';
  } else if (variant === 'intelligence') {
    iconBg = 'bg-accent text-clinical border-primary';
    borderHighlight = 'border-primary hover:border-primary';
  } else if (variant === 'success') {
    iconBg = 'bg-accent text-clinical border-primary';
    borderHighlight = 'border-primary hover:border-primary';
  } else if (variant === 'warning') {
    iconBg = 'bg-accent text-blood-light border-primary';
    borderHighlight = 'border-primary hover:border-primary';
  }

  return (
    <div
      className={`p-5 rounded-lg bg-card border ${borderHighlight} shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          <div className="mt-1 text-2xl font-medium tracking-normal text-foreground">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${iconBg}`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
