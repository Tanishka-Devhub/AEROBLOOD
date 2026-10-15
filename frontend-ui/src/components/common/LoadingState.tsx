import React from 'react';
import { Activity } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading live telemetry...',
  subtext = 'Querying FastAPI backend & MySQL database',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-slate-200/80 shadow-xs ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center border border-teal-200">
          <Activity className="w-6 h-6 text-teal-600 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{message}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtext}</p>}
    </div>
  );
};
