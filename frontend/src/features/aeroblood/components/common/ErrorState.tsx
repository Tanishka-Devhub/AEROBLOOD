import { Button } from '@/components/ui/button';
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
    <div className={`flex flex-col items-center justify-center p-10 text-center rounded-lg bg-accent/50 border border-primary shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-blood-light mb-3 border border-primary">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-blood-light tracking-normal">{title}</h3>
      <p className="text-xs text-blood-light/90 mt-1 max-w-md mb-4 leading-relaxed font-mono bg-accent/60 p-2 rounded border border-primary break-words">
        {displayMsg}
      </p>
      {onRetry && (
        <Button variant="ghost"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary hover:bg-primary text-foreground rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
};
