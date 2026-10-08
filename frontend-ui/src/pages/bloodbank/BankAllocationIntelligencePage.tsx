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
import { BrainCircuit, CheckCircle2, ArrowRight } from 'lucide-react';

export const BankAllocationIntelligencePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const reqParam = searchParams.get('request_id');

  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<number>(reqParam ? Number(reqParam) : 1);

  const [previewData, setPreviewData] = useState<AllocationPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        if (!reqParam && reqs.length > 0) {
          setSelectedRequestId(reqs[0].request_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadRequests();
  }, [reqParam]);

  const runPreview = async (reqId: number) => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);
    setSearchParams({ request_id: String(reqId) });
    try {
      const result = await intelligenceApi.previewAllocation(reqId);
      setPreviewData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Allocation analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      runPreview(selectedRequestId);
    }
  }, [selectedRequestId]);

  return (
    <AeroShell
      title="Blood Bank Allocation Solver"
      subtitle="Preview physical units candidate matching, expiry buffers, and FIFO priority"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-teal-600" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Requisition
            </h4>
            <div className="text-xs text-slate-500">
              Run allocation preview for hospital requisition
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            Run Solver
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Solving allocation candidates..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => runPreview(selectedRequestId)} />
      ) : previewData ? (
        <IntelligenceCard
          title={`Allocation Preview · Requisition #${previewData.request_id}`}
          disclaimer="ALLOCATION PREVIEW — NO ALLOCATION HAS BEEN EXECUTED"
          subtitle="Decision-support recommendation of physical blood units to reserve"
          actions={<StatusBadge status={previewData.allocation_status} size="md" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Required</span>
              <span className="text-2xl font-bold text-slate-900">{previewData.quantity_required} Units</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Allocatable</span>
              <span className={`text-2xl font-bold ${previewData.is_fully_allocatable ? 'text-emerald-700' : 'text-amber-700'}`}>
                {previewData.quantity_allocated} Units
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Posture</span>
              <span className="text-sm font-bold text-slate-800">{previewData.allocation_status}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3">Unit ID</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Storage Facility</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Decision</th>
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
                      <td className="p-3 font-mono text-slate-600">{c.expiry_date}</td>
                      <td className="p-3">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            SELECTED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Reserve</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </IntelligenceCard>
      ) : null}
    </AeroShell>
  );
};
