import React from 'react';
import type { DonorRecommendationItem } from '../../types/api';
import { BloodGroupBadge } from './BloodGroupBadge';
import { ScoreBreakdown } from './ScoreBreakdown';
import { Award, Clock, MapPin, Info } from 'lucide-react';

interface RecommendationCardProps {
  item: DonorRecommendationItem;
  priority?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, priority = 'NORMAL' }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
      <div>
        {/* Header: Rank + Donor ID + Final Score */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-xs ${
                item.rank === 1
                  ? 'bg-amber-400 text-amber-950'
                  : item.rank === 2
                  ? 'bg-slate-200 text-slate-800'
                  : item.rank === 3
                  ? 'bg-amber-700/20 text-amber-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              #{item.rank}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Donor #{item.donor_id}</span>
                <BloodGroupBadge group={item.blood_group} size="sm" />
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    item.match_type === 'EXACT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {item.match_type} MATCH
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-black text-slate-900 flex items-center gap-1 justify-end">
              <Award className="w-4 h-4 text-teal-600" />
              <span>{item.final_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Adaptive Score</div>
          </div>
        </div>

        {/* Telemetry Chips */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recency</span>
              <span className="font-medium text-slate-800">
                {item.days_since_last_donation !== null && item.days_since_last_donation !== undefined
                  ? `${item.days_since_last_donation} days ago`
                  : 'First-time donor'}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Est. Arrival</span>
              <span className="font-medium text-slate-800">
                {item.estimated_arrival_minutes !== null && item.estimated_arrival_minutes !== undefined
                  ? `${item.estimated_arrival_minutes} min (${item.distance_km?.toFixed(1)} km)`
                  : 'Location unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* Score Breakdown Bars */}
        <div className="my-3 pt-2 border-t border-slate-100">
          <ScoreBreakdown
            matchScore={item.match_score}
            recencyScore={item.recency_score}
            responseScore={item.response_time_score}
            priority={priority}
          />
        </div>
      </div>

      {/* WHY THIS DONOR? Clinical Reasoning */}
      <div className="mt-3 p-3 bg-teal-50/60 rounded-xl border border-teal-200/60 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
          <Info className="w-3.5 h-3.5 text-teal-700" />
          <span>WHY THIS DONOR?</span>
        </div>
        <p className="text-teal-950/80 leading-relaxed font-medium">
          {item.recommendation_reason}
        </p>
      </div>
    </div>
  );
};
