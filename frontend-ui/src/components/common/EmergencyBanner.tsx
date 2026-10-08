import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      className={`flex items-center justify-between p-3.5 px-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl shadow-md border border-rose-800 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <AlertCircle className="w-5 h-5 text-rose-100" />
        <div className="text-xs font-medium">
          <strong className="font-bold text-sm tracking-wide">
            {count} ACTIVE EMERGENCY {count === 1 ? 'REQUEST' : 'REQUESTS'}
          </strong>
          <span className="mx-2 opacity-60">|</span>
          <span>Requires rapid response and priority allocation intelligence.</span>
        </div>
      </div>
      <Link
        to={`${portalPrefix}/emergency`}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        <span>View Emergency Desk</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
