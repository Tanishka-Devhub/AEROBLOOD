import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

        if (!initialRequestId && reqs.length > 0) {
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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Target Blood Requisition
            </h4>
            <div className="text-xs text-slate-500 mt-0.5">
              Select an existing hospital request from the active queue or enter request ID
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            {activeRequests.map((r) => (
              <option key={r.request_id} value={r.request_id}>
                Req #{r.request_id} · {r.patient_reference} ({bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`}) - {r.quantity_required} Units
              </option>
            ))}
          </select>
          <button
            onClick={() => runPreview(selectedRequestId)}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Run Intelligence
          </button>
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Blood Group
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <BloodGroupBadge group={bloodGroups[previewData.recipient_blood_group_id] || `#${previewData.recipient_blood_group_id}`} />
                  <span className="text-xs text-slate-500">Recipient</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requested Quantity
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {previewData.quantity_required} <span className="text-xs text-slate-400 font-normal">Units</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Allocatable Quantity
                </span>
                <div className={`mt-1 text-2xl font-black ${previewData.is_fully_allocatable ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {previewData.quantity_allocated} <span className="text-xs text-slate-400 font-normal">Units</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Evaluated Physical Units ({previewData.candidates.length})
                </h4>
                <div className="text-xs text-slate-500">
                  Selected for allocation: <strong className="text-slate-800">{previewData.selected_unit_ids.length}</strong> units
                </div>
              </div>

              {previewData.candidates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                  No matching physical blood units found in available inventory for this blood group.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100">
                      {previewData.candidates.map((c) => {
                        const isSelected = previewData.selected_unit_ids.includes(c.unit_id);
                        return (
                          <tr key={c.unit_id} className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                            <td className="p-3 font-mono font-bold text-slate-900">#{c.unit_id}</td>
                            <td className="p-3">
                              <BloodGroupBadge group={bloodGroups[c.donor_blood_group_id] || `#${c.donor_blood_group_id}`} size="sm" />
                            </td>
                            <td className="p-3 font-mono text-slate-600">Bank #{c.blood_bank_id}</td>
                            <td className="p-3 font-mono text-slate-500">{c.collection_date}</td>
                            <td className="p-3 font-mono text-slate-500">{c.expiry_date}</td>
                            <td className="p-3">
                              <StatusBadge status={c.status} size="sm" />
                            </td>
                            <td className="p-3">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  SELECTED
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase text-slate-400 font-medium">
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
