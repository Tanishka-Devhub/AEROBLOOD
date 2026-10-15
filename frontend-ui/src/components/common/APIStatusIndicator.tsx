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
    <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs shadow-xs">
      <Server className="w-3.5 h-3.5 text-slate-500" />
      <span className="font-medium text-slate-600">FastAPI:</span>
      {status === 'checking' && (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Connecting
        </span>
      )}
      {status === 'healthy' && (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Online
        </span>
      )}
      {status === 'degraded' && (
        <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Degraded
        </span>
      )}
      <button
        onClick={checkStatus}
        title={`Last checked: ${lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}. Click to re-check.`}
        className="text-slate-400 hover:text-slate-700 ml-0.5 transition-colors cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
