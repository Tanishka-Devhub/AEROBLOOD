import React, { useState, useEffect } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { RecommendationCard } from '../../components/common/RecommendationCard';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  bloodRequestsApi,
  bloodGroupsApi,
  intelligenceApi,
} from '../../api';
import type {
  BloodRequest,
  BloodGroup,
  AllocationPreviewResponse,
  DonorRankingPreviewResponse,
} from '../../types/api';
import {
  AlertOctagon,
  BrainCircuit,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const EmergencyRequestPage: React.FC = () => {
  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Intelligence Previews
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreviewResponse | null>(null);
  const [donorPreview, setDonorPreview] = useState<DonorRankingPreviewResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmergencyRequests = async () => {
      setIsLoadingQueue(true);
      setQueueError(null);
      try {
        const [requests, groups] = await Promise.all([
          bloodRequestsApi.getAll({ priority: 'EMERGENCY', limit: 20 }),
          bloodGroupsApi.getAll(),
        ]);

        const groupMap: Record<number, string> = {};
        groups.forEach((g: BloodGroup) => {
          groupMap[g.blood_group_id] = g.group_name;
        });
        setBloodGroups(groupMap);

        setEmergencyRequests(requests);
        if (requests[0] !== undefined) {
          setSelectedRequestId(requests[0].request_id);
        }
      } catch (err: unknown) {
        setQueueError(err instanceof Error ? err.message : 'Failed to retrieve emergency queue');
      } finally {
        setIsLoadingQueue(false);
      }
    };

    loadEmergencyRequests();
  }, []);

  const runEmergencyIntelligence = async (reqId: number) => {
    setSelectedRequestId(reqId);
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAllocationPreview(null);
    setDonorPreview(null);

    try {
      const [allocRes, donorRes] = await Promise.all([
        intelligenceApi.previewAllocation(reqId),
        intelligenceApi.previewDonorRanking({ request_id: reqId, top_n: 5 }),
      ]);
      setAllocationPreview(allocRes);
      setDonorPreview(donorRes);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Emergency intelligence analysis failed');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      runEmergencyIntelligence(selectedRequestId);
    }
  }, [selectedRequestId]);

  const selectedRequest = emergencyRequests.find((r) => r.request_id === selectedRequestId);

  const pipelineStages = [
    { title: '1. REQUEST RECEIVED', desc: selectedRequest ? `Req #${selectedRequest.request_id} · ${selectedRequest.patient_reference}` : 'Awaiting request selection', done: true },
    { title: '2. COMPATIBILITY MATRIX', desc: selectedRequest ? `Target: ${bloodGroups[selectedRequest.blood_group_id] || selectedRequest.blood_group_id}` : 'Pending target group', done: !!selectedRequest },
    { title: '3. INVENTORY TELEMETRY', desc: allocationPreview ? `${allocationPreview.candidates.length} Candidate units scanned` : 'Pending inventory query', done: !!allocationPreview },
    { title: '4. EXPIRY / QUALITY GATE', desc: allocationPreview ? 'Usable unexpired units filtered' : 'Pending quality filter', done: !!allocationPreview },
    { title: '5. ALLOCATION ENGINE', desc: allocationPreview ? `${allocationPreview.allocation_status} (${allocationPreview.quantity_allocated}/${allocationPreview.quantity_required})` : 'Awaiting allocation solver', done: !!allocationPreview },
    { title: '6. ADAPTIVE DONOR INTEL', desc: donorPreview ? `${donorPreview.donors_found} compatible donors ranked` : 'Awaiting donor ranking engine', done: !!donorPreview },
    { title: '7. REDISTRIBUTION CHECK', desc: allocationPreview && !allocationPreview.is_fully_allocatable ? 'Partial allocation triggers cross-bank redistribution' : 'Local inventory adequate', done: !!allocationPreview },
    { title: '8. RECOMMENDED ACTION', desc: allocationPreview?.is_fully_allocatable ? 'Dispatch local allocated units' : 'Activate top ranked emergency donors', done: !!(allocationPreview || donorPreview) },
  ];

  return (
    <AeroShell
      title="Emergency Operations Desk"
      subtitle="Operational pipeline for rapid emergency response: DETECT → DECIDE → RESPOND"
    >
      {/* Top Operational Alert Strip */}
      <div className="bg-accent/40 border border-primary/80 rounded-lg p-5 text-foreground flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/30 border border-primary/40 text-blood-light">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-normal text-foreground uppercase">
                EMERGENCY PRIORITY DESK ACTIVE
              </h3>
              <span className="text-[10px] bg-primary px-2 py-0.5 rounded font-black tracking-normalr">
                LIVE
              </span>
            </div>
            <p className="text-xs text-blood-light/80 mt-0.5">
              Weighting model adapted: Response time proximity (40%) prioritized while enforcing 100% ABO/Rh compatibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRequestId || ''}
            onChange={(e) => runEmergencyIntelligence(Number(e.target.value))}
            className="px-3 py-1.5 bg-secondary border border-primary/60 rounded-lg text-xs font-semibold text-blood-light focus:ring-2 focus:ring-primary"
          >
            {emergencyRequests.map((r) => (
              <option key={r.request_id} value={r.request_id}>
                Req #{r.request_id} · {r.patient_reference} ({bloodGroups[r.blood_group_id] || r.blood_group_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Operational Flow Pipeline */}
      <div className="bg-card rounded-lg border border-border/90 p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-normalr text-muted-foreground mb-4 flex items-center justify-between">
          <span>OPERATIONAL INTELLIGENCE FLOW (DETECT → DECIDE → RESPOND)</span>
          <span className="font-mono text-clinical text-[11px]">8 STAGE CLINICAL PIPELINE</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border transition-all text-xs ${
                stage.done
                  ? 'bg-accent/50 border-primary text-clinical'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                <span>{stage.title}</span>
                {stage.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-clinical shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-tight">{stage.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Telemetry Results */}
      {isLoadingAnalysis ? (
        <LoadingState message="Executing multi-engine emergency analysis..." subtext="Querying Allocation Engine & Adaptive Donor Intelligence simultaneously" />
      ) : analysisError ? (
        <ErrorState message={analysisError} onRetry={() => selectedRequestId && runEmergencyIntelligence(selectedRequestId)} />
      ) : (
        <div className="space-y-6">
          {/* Stage 1: Allocation Engine Results */}
          {allocationPreview && (
            <IntelligenceCard
              title={`Allocation Engine Analysis · Request #${allocationPreview.request_id}`}
              disclaimer="ALLOCATION PREVIEW — NO ALLOCATION HAS BEEN EXECUTED"
              subtitle={`Required: ${allocationPreview.quantity_required} Units · Allocatable: ${allocationPreview.quantity_allocated} Units`}
              actions={
                <StatusBadge status={allocationPreview.allocation_status} size="sm" />
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-card rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Requested Units</span>
                  <span className="text-xl font-bold text-foreground">{allocationPreview.quantity_required}</span>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Allocated Available</span>
                  <span className={`text-xl font-bold ${allocationPreview.is_fully_allocatable ? 'text-clinical' : 'text-blood-light'}`}>
                    {allocationPreview.quantity_allocated}
                  </span>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fulfillment Posture</span>
                  <span className="text-sm font-bold text-foreground">{allocationPreview.allocation_status}</span>
                </div>
              </div>

              <h5 className="text-xs font-bold uppercase tracking-normalr text-muted-foreground mb-2">Candidate Units Evaluated ({allocationPreview.candidates.length})</h5>
              {allocationPreview.candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No available matching units found in local blood inventory.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-muted-foreground">
                    <thead className="bg-card text-[10px] uppercase font-bold text-muted-foreground border-b">
                      <tr>
                        <th className="p-2">Unit ID</th>
                        <th className="p-2">Donor Group</th>
                        <th className="p-2">Bank ID</th>
                        <th className="p-2">Collection Date</th>
                        <th className="p-2">Expiry Date</th>
                        <th className="p-2">Selected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allocationPreview.candidates.map((c) => (
                        <tr key={c.unit_id} className="hover:bg-card">
                          <td className="p-2 font-mono font-bold">#{c.unit_id}</td>
                          <td className="p-2">
                            <BloodGroupBadge group={bloodGroups[c.donor_blood_group_id] || `#${c.donor_blood_group_id}`} size="sm" />
                          </td>
                          <td className="p-2 font-mono">Bank #{c.blood_bank_id}</td>
                          <td className="p-2 text-muted-foreground">{c.collection_date}</td>
                          <td className="p-2 text-muted-foreground">{c.expiry_date}</td>
                          <td className="p-2">
                            {allocationPreview.selected_unit_ids.includes(c.unit_id) ? (
                              <span className="text-[10px] bg-accent text-clinical font-bold px-2 py-0.5 rounded border border-primary">
                                SELECTED
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Reserve</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </IntelligenceCard>
          )}

          {/* Stage 2: Adaptive Donor Ranking Intelligence */}
          {donorPreview && (
            <IntelligenceCard
              title={`Adaptive Donor Intelligence · Top Ranked Donors for Req #${donorPreview.request_id}`}
              disclaimer="RANKING RECOMMENDATION — NO DONOR CONTACT HAS BEEN INITIATED"
              subtitle={`Required Blood Group: ${donorPreview.required_blood_group} · Clinical Priority: ${donorPreview.priority}`}
              actions={
                <span className="text-xs font-semibold text-muted-foreground">
                  {donorPreview.donors_found} Donors Found
                </span>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donorPreview.recommendations.map((item) => (
                  <RecommendationCard
                    key={item.donor_id}
                    item={item}
                    priority={donorPreview.priority}
                  />
                ))}
              </div>
            </IntelligenceCard>
          )}
        </div>
      )}
    </AeroShell>
  );
};
