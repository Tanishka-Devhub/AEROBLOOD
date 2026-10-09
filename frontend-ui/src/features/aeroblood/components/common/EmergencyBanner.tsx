import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from '@/features/aeroblood/navigation';

interface EmergencyBannerProps {
  count: number;
  portalPrefix?: string;
  className?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  count,
  portalPrefix = '/hospital',
  className = '',
}) => {
  if (count <= 0) return null;

  return (
    <div
      className={`flex items-center justify-between p-3.5 px-5 bg-gradient-to-r from-primary to-primary text-foreground rounded-lg shadow-md border border-primary ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-card opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-card" />
        </span>
        <AlertCircle className="w-5 h-5 text-blood-light" />
        <div className="text-xs font-medium">
          <strong className="font-bold text-sm tracking-normal">
            {count} ACTIVE EMERGENCY {count === 1 ? 'REQUEST' : 'REQUESTS'}
          </strong>
          <span className="mx-2 opacity-60">|</span>
          <span>Requires rapid response and priority allocation intelligence.</span>
        </div>
      </div>
      <Link
        to={`${portalPrefix}/emergency`}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-card text-blood-light hover:bg-accent rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        <span>View Emergency Desk</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
