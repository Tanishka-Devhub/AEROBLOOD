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
        <div className="flex justify-between text-slate-600 mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Compatibility Match ({weights.match} weight)
          </span>
          <span className="font-bold text-slate-800">{matchScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
          />
        </div>
      </div>

      {/* Recency Score */}
      <div>
        <div className="flex justify-between text-slate-600 mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Readiness / Recency ({weights.recency} weight)
          </span>
          <span className="font-bold text-slate-800">{recencyScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, recencyScore))}%` }}
          />
        </div>
      </div>

      {/* Response Score */}
      <div>
        <div className="flex justify-between text-slate-600 mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Response Time / Proximity ({weights.response} weight)
          </span>
          <span className="font-bold text-slate-800">{responseScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, responseScore))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
