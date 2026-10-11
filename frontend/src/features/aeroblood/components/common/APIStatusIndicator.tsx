import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import { RefreshCw, Server, AlertCircle } from 'lucide-react';

export const APIStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'degraded'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      const res = await healthApi.check();
      if (res && res.status === 'healthy') {
        setStatus('healthy');
      } else {
        setStatus('degraded');
      }
    } catch {
      setStatus('degraded');
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 bg-card border border-border rounded-full text-xs shadow-xs">
      <Server className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-medium text-muted-foreground">FastAPI:</span>
      {status === 'checking' && (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          Connecting
        </span>
      )}
      {status === 'healthy' && (
        <span className="inline-flex items-center gap-1 font-semibold text-clinical">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Online
        </span>
      )}
      {status === 'degraded' && (
        <span className="inline-flex items-center gap-1 font-semibold text-blood-light">
          <AlertCircle className="w-3 h-3 text-blood-light" />
          Degraded
        </span>
      )}
      <Button variant="ghost"
        onClick={checkStatus}
        title={`Last checked: ${lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}. Click to re-check.`}
        className="text-muted-foreground hover:text-foreground ml-0.5 transition-colors cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
