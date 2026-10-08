import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { Timeline, type TimelineStep } from '../../components/common/Timeline';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodRequestsApi, bloodGroupsApi, allocationsApi } from '../../api';
import type { BloodRequest, BloodGroup, Allocation } from '../../types/api';
import {
  FileText,
  Filter,
  Eye,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Tracking Drawer / Modal
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [relatedAllocations, setRelatedAllocations] = useState<Allocation[]>([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqData, groupData] = await Promise.all([
        bloodRequestsApi.getAll({ limit: 100 }),
        bloodGroupsApi.getAll(),
      ]);

      const groupMap: Record<number, string> = {};
      groupData.forEach((g: BloodGroup) => {
        groupMap[g.blood_group_id] = g.group_name;
      });

      setRequests(reqData);
      setBloodGroups(groupMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve blood requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openTracking = async (request: BloodRequest) => {
    setSelectedRequest(request);
    setIsLoadingTracking(true);
    try {
      const allocs = await allocationsApi.getAll({ request_id: request.request_id });
      setRelatedAllocations(allocs);
    } catch {
      setRelatedAllocations([]);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Filtered dataset
  const filteredRequests = requests.filter((r) => {
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<BloodRequest>[] = [
    {
      key: 'request_id',
      header: 'REQ ID',
      render: (r) => <span className="font-mono font-bold text-slate-900">#{r.request_id}</span>,
    },
    {
      key: 'patient_reference',
      header: 'PATIENT REF',
      render: (r) => <span className="font-mono text-slate-700 text-xs">{r.patient_reference}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'BLOOD GROUP',
      render: (r) => <BloodGroupBadge group={bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`} size="sm" />,
    },
    {
      key: 'quantity_required',
      header: 'UNITS',
      render: (r) => <span className="font-bold text-slate-900">{r.quantity_required}</span>,
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      render: (r) => (
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
            r.priority === 'EMERGENCY'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : r.priority === 'URGENT'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: 'doctor_approval_status',
      header: 'DOC APPROVAL',
      render: (r) => <StatusBadge status={r.doctor_approval_status} size="sm" />,
    },
    {
      key: 'status',
      header: 'LIFECYCLE STATUS',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'required_by',
      header: 'REQUIRED BY',
      render: (r) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(r.required_by).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openTracking(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>
          <Link
            to={`/hospital/allocation-intelligence?request_id=${r.request_id}`}
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-xs ml-1"
          >
            <span>Preview</span>
          </Link>
        </div>
      ),
    },
  ];

  // Build real Timeline steps from actual request record
  const getTimelineSteps = (req: BloodRequest, allocs: Allocation[]): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        title: 'Requisition Created',
        description: `Order logged for ${req.quantity_required} units of ${bloodGroups[req.blood_group_id] || ''} (Ref: ${req.patient_reference})`,
        timestamp: new Date(req.request_date).toLocaleString(),
        status: 'completed',
      },
      {
        title: `Doctor Approval (${req.doctor_approval_status})`,
        description:
          req.doctor_approval_status === 'APPROVED'
            ? `Verified by attending doctor #${req.attending_doctor_id}`
            : 'Pending clinical verification sign-off',
        timestamp: req.doctor_approved_at ? new Date(req.doctor_approved_at).toLocaleString() : null,
        status: req.doctor_approval_status === 'APPROVED' ? 'completed' : 'current',
      },
      {
        title: 'Allocation Matching',
        description:
          allocs.length > 0
            ? `${allocs.length} physical unit(s) allocated: ${allocs.map((a) => `#${a.unit_id}`).join(', ')}`
            : req.status === 'PARTIALLY_ALLOCATED'
            ? 'Partially allocated from available network inventory'
            : 'Awaiting allocation matching by blood bank',
        timestamp: allocs.length > 0 ? new Date(allocs[0].allocated_at).toLocaleString() : null,
        status: allocs.length > 0 ? 'completed' : req.doctor_approval_status === 'APPROVED' ? 'current' : 'pending',
      },
      {
        title: `Requisition Fulfillment (${req.status})`,
        description:
          req.status === 'FULFILLED'
            ? 'All units issued and transferred to hospital transfusion ward.'
            : req.status === 'CANCELLED'
            ? 'Requisition was cancelled.'
            : 'Pending final issue and courier dispatch.',
        status: req.status === 'FULFILLED' ? 'completed' : req.status === 'CANCELLED' ? 'failed' : 'pending',
      },
    ];
    return steps;
  };

  return (
    <AeroShell
      title="Hospital Requisition Tracking"
      subtitle="Inspect live status, doctor approvals, and physical unit allocations"
    >
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgent</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredRequests.length}</strong> requisitions
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRequests} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRequests}
          keyField="request_id"
          searchable
          searchPlaceholder="Search by patient ref or request ID..."
          searchFilter={(r, q) =>
            r.patient_reference.toLowerCase().includes(q.toLowerCase()) ||
            String(r.request_id).includes(q)
          }
          pageSize={10}
        />
      )}

      {/* Tracking Modal / Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Requisition #{selectedRequest.request_id} Lifecycle Timeline
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Ref</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRequest.patient_reference}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Group</span>
                  <BloodGroupBadge group={bloodGroups[selectedRequest.blood_group_id] || ''} size="sm" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Units</span>
                  <span className="font-bold text-slate-800">{selectedRequest.quantity_required} Units</span>
                </div>
              </div>

              {/* Real Timeline */}
              {isLoadingTracking ? (
                <LoadingState message="Loading allocation history..." />
              ) : (
                <Timeline steps={getTimelineSteps(selectedRequest, relatedAllocations)} />
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/hospital/allocation-intelligence?request_id=${selectedRequest.request_id}`}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Preview Allocation Candidates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </AeroShell>
  );
};
