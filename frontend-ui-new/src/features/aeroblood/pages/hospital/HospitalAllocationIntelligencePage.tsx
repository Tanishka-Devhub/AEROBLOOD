import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from '@/features/aeroblood/navigation';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { intelligenceApi, bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { AllocationPreviewResponse, BloodRequest, BloodGroup } from '../../types/api';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const HospitalAllocationIntelligencePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRequestId = searchParams.get('request_id');

  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<number>(initialRequestId ? Number(initialRequestId) : 1);

  const [previewData, setPreviewData] = useState<AllocationPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load requests for quick selection
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const [reqs, groups] = await Promise.all([
          bloodRequestsApi.getAll({ limit: 50 }),
          bloodGroupsApi.getAll(),
        ]);
        setActiveRequests(reqs);

        const groupMap: Record<number, string> = {};
        groups.forEach((g: BloodGroup) => {
          groupMap[g.blood_group_id] = g.group_name;
        });
        setBloodGroups(groupMap);

        if (!initialRequestId && reqs[0] !== undefined) {
          setSelectedRequestId(reqs[0].request_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadRequests();
  }, [initialRequestId]);

  const runPreview = async (reqId: number) => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);
    setSearchParams({ request_id: String(reqId) });

    try {
      const result = await intelligenceApi.previewAllocation(reqId);
      setPreviewData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate allocation preview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      runPreview(selectedRequestId);
    }
  }, [selectedRequestId]);

  const activeReq = activeRequests.find((r) => r.request_id === selectedRequestId);

  return (
    <AeroShell
      title="Allocation Intelligence Decision Support"
      subtitle="Preview candidate blood units, ABO/Rh compatibility, and fulfillment feasibility"
    >
      {/* Requisition Selector Control */}
      <div className="bg-card rounded-lg border border-border/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent border border-primary text-clinical">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Select Target Blood Requisition
            </h4>
            <div className="text-xs text-muted-foreground mt-0.5">
              Select an existing hospital request from the active queue or enter request ID
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
          >
            {activeRequests.map((r) => (
              <option key={r.request_id} value={r.request_id}>
                Req #{r.request_id} · {r.patient_reference} ({bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`}) - {r.quantity_required} Units
              </option>
            ))}
          </select>
          <Button variant="ghost"
            onClick={() => runPreview(selectedRequestId)}
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary text-foreground rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Run Intelligence
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Executing Allocation Engine solver..." subtext="Evaluating physical blood units, expiry dates, and compatibility hierarchy" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => runPreview(selectedRequestId)} />
      ) : previewData ? (
        <div className="space-y-6">
          <IntelligenceCard
            title={`Allocation Preview · Request #${previewData.request_id}`}
            disclaimer="ALLOCATION PREVIEW — NO ALLOCATION HAS BEEN EXECUTED"
            subtitle="Read-only clinical recommendation from AERO-BLOOD allocation engine"
            actions={
              <StatusBadge status={previewData.allocation_status} size="md" />
            }
          >
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-card rounded-lg border border-border">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Target Blood Group
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <BloodGroupBadge group={bloodGroups[previewData.recipient_blood_group_id] || `#${previewData.recipient_blood_group_id}`} />
                  <span className="text-xs text-muted-foreground">Recipient</span>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Requested Quantity
                </span>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {previewData.quantity_required} <span className="text-xs text-muted-foreground font-normal">Units</span>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Allocatable Quantity
                </span>
                <div className={`mt-1 text-2xl font-semibold ${previewData.is_fully_allocatable ? 'text-clinical' : 'text-blood-light'}`}>
                  {previewData.quantity_allocated} <span className="text-xs text-muted-foreground font-normal">Units</span>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Fulfillment Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={previewData.allocation_status} size="sm" />
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Evaluated Physical Units ({previewData.candidates.length})
                </h4>
                <div className="text-xs text-muted-foreground">
                  Selected for allocation: <strong className="text-foreground">{previewData.selected_unit_ids.length}</strong> units
                </div>
              </div>

              {previewData.candidates.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-lg border border-border text-xs text-muted-foreground">
                  No matching physical blood units found in available inventory for this blood group.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs text-muted-foreground">
                    <thead className="bg-card text-[10px] uppercase font-medium text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-3">Physical Unit ID</th>
                        <th className="p-3">Donor Blood Group</th>
                        <th className="p-3">Source Blood Bank</th>
                        <th className="p-3">Collection Date</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Unit Status</th>
                        <th className="p-3">Allocation Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.candidates.map((c) => {
                        const isSelected = previewData.selected_unit_ids.includes(c.unit_id);
                        return (
                          <tr key={c.unit_id} className={`hover:bg-card ${isSelected ? 'bg-accent/30' : ''}`}>
                            <td className="p-3 font-mono font-medium text-foreground">#{c.unit_id}</td>
                            <td className="p-3">
                              <BloodGroupBadge group={bloodGroups[c.donor_blood_group_id] || `#${c.donor_blood_group_id}`} size="sm" />
                            </td>
                            <td className="p-3 font-mono text-muted-foreground">Bank #{c.blood_bank_id}</td>
                            <td className="p-3 font-mono text-muted-foreground">{c.collection_date}</td>
                            <td className="p-3 font-mono text-muted-foreground">{c.expiry_date}</td>
                            <td className="p-3">
                              <StatusBadge status={c.status} size="sm" />
                            </td>
                            <td className="p-3">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-accent text-clinical border border-primary">
                                  <CheckCircle2 className="w-3 h-3 text-clinical" />
                                  SELECTED
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                                  Reserve (Not Selected)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </IntelligenceCard>
        </div>
      ) : null}
    </AeroShell>
  );
};
