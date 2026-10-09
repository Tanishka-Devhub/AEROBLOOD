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
    <div className={`bg-secondary rounded-lg border border-primary/40 shadow-sm overflow-hidden ${className}`}>
      {/* Top Intelligence Banner */}
      <div className="bg-background px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30 text-clinical">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-normal text-foreground">{title}</h3>
              {engine && (
                <span className="text-[10px] uppercase font-bold tracking-normalr px-2 py-0.5 rounded bg-primary/20 text-clinical border border-primary/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {engine}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {timestamp && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Clinical Disclaimer Strip */}
      {disclaimer && (
        <div className="bg-accent/30 border-b border-primary/40 px-5 py-2 flex items-center gap-2 text-xs text-blood-light">
          <ShieldAlert className="w-3.5 h-3.5 text-blood-light shrink-0" />
          <span className="font-medium">{disclaimer}</span>
        </div>
      )}

      {/* Content Body */}
      <div className="p-5">{children}</div>
    </div>
  );
};
