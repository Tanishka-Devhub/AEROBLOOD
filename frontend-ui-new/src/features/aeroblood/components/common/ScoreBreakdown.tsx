import React from 'react';

interface ScoreBreakdownProps {
  matchScore: number;
  recencyScore: number;
  responseScore: number;
  priority?: string;
  className?: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  matchScore,
  recencyScore,
  responseScore,
  priority = 'NORMAL',
  className = '',
}) => {
  const normPriority = priority.toUpperCase();
  const weights =
    normPriority === 'EMERGENCY'
      ? { match: '50%', recency: '10%', response: '40%' }
      : normPriority === 'URGENT'
      ? { match: '50%', recency: '15%', response: '35%' }
      : { match: '50%', recency: '20%', response: '30%' };

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      {/* Match Score */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Compatibility Match ({weights.match} weight)
          </span>
          <span className="font-medium text-foreground">{matchScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
          />
        </div>
      </div>

      {/* Recency Score */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Readiness / Recency ({weights.recency} weight)
          </span>
          <span className="font-medium text-foreground">{recencyScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, recencyScore))}%` }}
          />
        </div>
      </div>

      {/* Response Score */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Response Time / Proximity ({weights.response} weight)
          </span>
          <span className="font-medium text-foreground">{responseScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, responseScore))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
