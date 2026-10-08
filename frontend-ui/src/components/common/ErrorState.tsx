import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'API Communication Error',
  message = 'Failed to retrieve telemetry from FastAPI backend.',
  error,
  onRetry,
  className = '',
}) => {
  const displayMsg = error || message;
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center rounded-xl bg-rose-50/50 border border-rose-200 shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3 border border-rose-200">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900 tracking-tight">{title}</h3>
      <p className="text-xs text-rose-700/90 mt-1 max-w-md mb-4 leading-relaxed font-mono bg-rose-100/60 p-2 rounded border border-rose-200 break-words">
        {displayMsg}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
