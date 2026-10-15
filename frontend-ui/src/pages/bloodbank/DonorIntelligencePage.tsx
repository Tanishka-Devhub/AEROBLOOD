import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { RecommendationCard } from '../../components/common/RecommendationCard';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { intelligenceApi, bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { DonorRankingPreviewResponse, BloodRequest, BloodGroup } from '../../types/api';
import {
  BrainCircuit,
  Search,
  Sparkles,
  Users,
  Award,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const DonorIntelligencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reqParam = searchParams.get('request_id');

  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<number>(reqParam ? Number(reqParam) : 1);
  const [topN, setTopN] = useState<number>(10);

  const [previewData, setPreviewData] = useState<DonorRankingPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const [reqs, groups] = await Promise.all([
          bloodRequestsApi.getAll({ limit: 50 }),
          bloodGroupsApi.getAll(),
        ]);
        setBloodRequests(reqs);

        const groupMap: Record<number, string> = {};
        groups.forEach((g: BloodGroup) => {
          groupMap[g.blood_group_id] = g.group_name;
        });
        setBloodGroups(groupMap);

        if (!reqParam && reqs.length > 0) {
          setSelectedRequestId(reqs[0].request_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadRequests();
  }, [reqParam]);

  const runDonorRanking = async () => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);
    try {
      const data = await intelligenceApi.previewDonorRanking({
        request_id: Number(selectedRequestId),
        top_n: Number(topN),
      });
      setPreviewData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Adaptive donor ranking failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      runDonorRanking();
    }
  }, [selectedRequestId]);

  const selectedReqObj = bloodRequests.find((r) => r.request_id === selectedRequestId);

  return (
    <AeroShell
      title="Adaptive Donor Ranking Intelligence"
      subtitle="PRIMARY HERO ALGORITHM · Multi-criteria decision support from DonorRankingEngine"
    >
      {/* Target Requisition Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unfulfilled Requisition Target
            </h4>
            <div className="text-xs text-slate-500 mt-0.5">
              Rank compatible, eligible active donors according to urgency-weighted match, recency, and response time
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            {bloodRequests.map((r) => (
              <option key={r.request_id} value={r.request_id}>
                Req #{r.request_id} · {r.patient_reference} ({bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`}) - {r.priority}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <span>Top N:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center"
            />
          </div>

          <button
            onClick={runDonorRanking}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Ranking...' : 'Rank Donors'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Executing Adaptive Donor Ranking Engine..." subtext="Filtering active donors, verifying BloodCompatibility matrix, and calculating multi-dimensional scores" />
      ) : error ? (
        <ErrorState message={error} onRetry={runDonorRanking} />
      ) : previewData ? (
        <div className="space-y-6">
          <IntelligenceCard
            title={`Adaptive Donor Ranking Results · Request #${previewData.request_id}`}
            disclaimer="RANKING RECOMMENDATION — NO DONOR CONTACT HAS BEEN INITIATED"
            subtitle={`Target: ${previewData.required_blood_group} · Hospital: ${previewData.hospital_name} · Priority: ${previewData.priority}`}
            actions={
              <span className="text-xs font-bold text-teal-200 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
                {previewData.donors_found} Candidates Ranked
              </span>
            }
          >
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Group
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <BloodGroupBadge group={previewData.required_blood_group} />
                  <span className="text-xs text-slate-500 font-semibold">Required</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Priority Weighting Model
                </span>
                <div className="mt-1">
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    previewData.priority === 'EMERGENCY'
                      ? 'bg-rose-100 text-rose-800'
                      : previewData.priority === 'URGENT'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {previewData.priority} (M:50% R:{previewData.priority === 'EMERGENCY' ? '10%' : previewData.priority === 'URGENT' ? '15%' : '20%'} T:{previewData.priority === 'EMERGENCY' ? '40%' : previewData.priority === 'URGENT' ? '35%' : '30%'})
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Donors Evaluated
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {previewData.donors_found}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Hospital
                </span>
                <div className="mt-1 text-xs font-bold text-slate-800 truncate">
                  {previewData.hospital_name}
                </div>
              </div>
            </div>

            {/* Recommendations Grid */}
            {previewData.recommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                {previewData.message || 'No eligible compatible donors were found for this request.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {previewData.recommendations.map((item) => (
                  <RecommendationCard
                    key={item.donor_id}
                    item={item}
                    priority={previewData.priority}
                  />
                ))}
              </div>
            )}
          </IntelligenceCard>
        </div>
      ) : null}
    </AeroShell>
  );
};
