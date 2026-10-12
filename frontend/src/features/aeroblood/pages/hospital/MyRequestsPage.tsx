import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { BloodTransfer } from '../../components/common/BloodTransfer';
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
import { Link } from '@/features/aeroblood/navigation';

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
      render: (r) => <span className="font-mono font-medium text-foreground">#{r.request_id}</span>,
    },
    {
      key: 'patient_reference',
      header: 'PATIENT REF',
      render: (r) => <span className="font-mono text-foreground text-xs">{r.patient_reference}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'BLOOD GROUP',
      render: (r) => <BloodGroupBadge group={bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`} size="sm" />,
    },
    {
      key: 'quantity_required',
      header: 'UNITS',
      render: (r) => <span className="font-medium text-foreground">{r.quantity_required}</span>,
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      render: (r) => (
        <span
          className={`text-[10px] uppercase font-medium tracking-wide px-2 py-0.5 rounded ${
            r.priority === 'EMERGENCY'
              ? 'bg-accent text-blood-light border border-primary'
              : r.priority === 'URGENT'
              ? 'bg-accent text-blood-light border border-primary'
              : 'bg-muted text-foreground'
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
        <span className="font-mono text-[11px] text-muted-foreground">
          {new Date(r.required_by).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost"
            onClick={() => openTracking(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Track</span>
          </Button>
          <Link
            to={`/hospital/allocation-intelligence?request_id=${r.request_id}`}
            className="inline-flex items-center gap-1 text-clinical hover:text-clinical font-semibold text-xs ml-1"
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
          allocs[0] !== undefined
            ? `${allocs.length} physical unit(s) allocated: ${allocs.map((a) => `#${a.unit_id}`).join(', ')}`
            : req.status === 'PARTIALLY_ALLOCATED'
            ? 'Partially allocated from available network inventory'
            : 'Awaiting allocation matching by blood bank',
        timestamp: allocs[0] !== undefined ? new Date(allocs[0].allocated_at).toLocaleString() : null,
        status: allocs[0] !== undefined ? 'completed' : req.doctor_approval_status === 'APPROVED' ? 'current' : 'pending',
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
      <div className="bg-card rounded-lg border border-border/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
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
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{filteredRequests.length}</strong> requisitions
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div role="dialog" aria-modal="true" aria-label="Requisition tracking" className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-card rounded-lg shadow-xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground" />
                <h3 className="font-medium text-sm text-foreground">
                  Requisition #{selectedRequest.request_id} Lifecycle Timeline
                </h3>
              </div>
              <Button variant="ghost"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close requisition tracking"
                className="p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {selectedRequest.status === 'FULFILLED' && (
                <BloodTransfer
                  key={selectedRequest.request_id}
                  bloodGroup={bloodGroups[selectedRequest.blood_group_id] || ''}
                  units={selectedRequest.quantity_required}
                  requestedAt={selectedRequest.request_date}
                  completedAt={selectedRequest.doctor_approved_at ?? null}
                />
              )}
              {/* Context Summary Cards */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-card rounded-lg border border-border text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground block">Patient Ref</span>
                  <span className="font-mono font-medium text-foreground">{selectedRequest.patient_reference}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground block">Target Group</span>
                  <BloodGroupBadge group={bloodGroups[selectedRequest.blood_group_id] || ''} size="sm" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground block">Units</span>
                  <span className="font-medium text-foreground">{selectedRequest.quantity_required} Units</span>
                </div>
              </div>

              {/* Real Timeline */}
              {isLoadingTracking ? (
                <LoadingState message="Loading allocation history..." />
              ) : (
                <Timeline steps={getTimelineSteps(selectedRequest, relatedAllocations)} />
              )}
            </div>

            <div className="p-4 bg-card border-t border-border flex items-center justify-between">
              <Link
                to={`/hospital/allocation-intelligence?request_id=${selectedRequest.request_id}`}
                className="text-xs font-semibold text-clinical hover:text-clinical flex items-center gap-1 cursor-pointer"
              >
                <span>Preview Allocation Candidates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Button variant="ghost"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer"
              >
                Close Tracking
              </Button>
            </div>
          </div>
        </div>
      )}
    </AeroShell>
  );
};
