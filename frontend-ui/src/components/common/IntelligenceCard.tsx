import React from 'react';
import { Sparkles, ShieldAlert, Cpu } from 'lucide-react';

interface IntelligenceCardProps {
  title: string;
  disclaimer?: string;
  children: React.ReactNode;
  subtitle?: string;
  engine?: string;
  timestamp?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({
  title,
  disclaimer = 'PREVIEW / DECISION SUPPORT ONLY — All proposals require clinical authorization before dispatch.',
  children,
  subtitle,
  engine,
  timestamp,
  actions,
  className = '',
}) => {
  return (
    <div className={`bg-slate-900 rounded-2xl border border-teal-800/40 shadow-sm overflow-hidden ${className}`}>
      {/* Top Intelligence Banner */}
      <div className="bg-slate-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
              {engine && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {engine}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {timestamp && (
            <span className="text-[11px] font-mono text-slate-400">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Clinical Disclaimer Strip */}
      {disclaimer && (
        <div className="bg-amber-950/30 border-b border-amber-900/40 px-5 py-2 flex items-center gap-2 text-xs text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium">{disclaimer}</span>
        </div>
      )}

      {/* Content Body */}
      <div className="p-5">{children}</div>
    </div>
  );
};
