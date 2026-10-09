import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

export interface TimelineStep {
  title: string;
  description: string;
  timestamp?: string | null;
  status: 'completed' | 'current' | 'pending' | 'failed';
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ steps, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;

        let icon = <Clock className="w-4 h-4 text-muted-foreground" />;
        let iconBg = 'bg-muted border-border text-muted-foreground';

        if (step.status === 'completed') {
          icon = <CheckCircle2 className="w-4 h-4 text-clinical" />;
          iconBg = 'bg-accent border-primary text-clinical';
        } else if (step.status === 'current') {
          icon = <ArrowRight className="w-4 h-4 text-foreground animate-pulse" />;
          iconBg = 'bg-accent border-primary text-foreground shadow-xs ring-2 ring-primary';
        } else if (step.status === 'failed') {
          icon = <XCircle className="w-4 h-4 text-blood-light" />;
          iconBg = 'bg-accent border-primary text-blood-light';
        }

        return (
          <div key={idx} className="relative flex items-start gap-3">
            {/* Connecting vertical line */}
            {!isLast && (
              <span
                className="absolute top-6 left-3.5 -ml-px w-0.5 h-[calc(100%+8px)] bg-muted"
                aria-hidden="true"
              />
            )}

            {/* Icon Circle */}
            <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full border ${iconBg} shrink-0`}>
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className={`text-xs font-bold tracking-normal ${step.status === 'current' ? 'text-foreground' : 'text-foreground'}`}>
                  {step.title}
                </h4>
                {step.timestamp && (
                  <time className="text-[10px] text-muted-foreground font-mono">
                    {step.timestamp}
                  </time>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
