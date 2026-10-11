import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { Link } from '@/features/aeroblood/navigation';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { MetricCard } from '../../components/common/MetricCard';
import { bloodRequestsApi, hospitalsApi, bloodGroupsApi } from '../../api';
import type { BloodRequest, Hospital, BloodGroup } from '../../types/api';
import {
  Layers,
  Search,
  Filter,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitals, setHospitals] = useState<Record<number, string>>({});
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqList, hospList, groupList] = await Promise.all([
        bloodRequestsApi.getAll({ limit: 150 }),
        hospitalsApi.getAll({ limit: 100 }),
        bloodGroupsApi.getAll(),
      ]);

      setRequests(reqList);

      const hMap: Record<number, string> = {};
      hospList.forEach((h: Hospital) => {
        hMap[h.hospital_id] = h.name;
      });
      setHospitals(hMap);

      const gMap: Record<number, string> = {};
      groupList.forEach((g: BloodGroup) => {
        gMap[g.blood_group_id] = g.group_name;
      });
      setBloodGroups(gMap);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch network blood requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const emergencyCount = requests.filter(
    (r) => r.priority === 'EMERGENCY'
  ).length;

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const fulfilledCount = requests.filter((r) => r.status === 'FULFILLED').length;

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      req.request_id.toString().includes(query) ||
      (req.patient_reference && req.patient_reference.toLowerCase().includes(query)) ||
      (hospitals[req.hospital_id] && hospitals[req.hospital_id]?.toLowerCase().includes(query));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const columns: Column<BloodRequest>[] = [
    {
      header: 'Request ID',
      accessor: (item) => (
        <span className="font-mono text-clinical font-semibold">#{item.request_id}</span>
      ),
    },
    {
      header: 'Hospital Facility',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[160px]">{hospitals[item.hospital_id] || `Hospital #${item.hospital_id}`}</span>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessor: (item) => (
        <BloodGroupBadge group={bloodGroups[item.blood_group_id] || `Group #${item.blood_group_id}`} size="sm" />
      ),
    },
    {
      header: 'Units',
      accessor: (item) => (
        <span className="font-mono text-foreground font-semibold">{item.quantity_required}</span>
      ),
    },
    {
      header: 'Urgency',
      accessor: (item) => <StatusBadge status={item.priority} />,
    },
    {
      header: 'Lifecycle Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Doctor Approval',
      accessor: (item) => (
        <span className="text-[11px] text-muted-foreground font-mono">
          {item.doctor_approval_status || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: (item) => (
        <span className="text-[11px] text-muted-foreground font-mono">
          {new Date(item.request_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/hospital/allocation-intelligence?request_id=${item.request_id}`}
            title="Solve Allocation"
            className="p-1.5 bg-secondary hover:bg-muted text-clinical hover:text-clinical rounded border border-border text-[11px] flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Solve</span>
          </Link>
          <Link
            to={`/admin/donor-intelligence?request_id=${item.request_id}`}
            title="Rank Donors"
            className="p-1.5 bg-secondary hover:bg-muted text-blood-light hover:text-blood-light rounded border border-border text-[11px] flex items-center gap-1 transition"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Donors</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-clinical" />
              <h1 className="text-2xl font-medium text-foreground tracking-normal">
                Global Requisitions Oversight
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              National hospital demand feed, triage classification, and algorithm-assisted fulfillment pipeline
            </p>
          </div>
          <Button variant="ghost"
            onClick={loadData}
            className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground text-sm font-medium rounded-lg border border-border transition"
          >
            Refresh Pipeline
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Requisitions"
            value={requests.length}
            icon={<Layers className="w-5 h-5 text-clinical" />}
            subtitle="Recorded demand events"
          />
          <MetricCard
            title="Emergency Triage"
            value={emergencyCount}
            variant="emergency"
            icon={<AlertTriangle className="w-5 h-5 text-blood-light" />}
            subtitle="Immediate priority cases"
          />
          <MetricCard
            title="Pending Fulfillment"
            value={pendingCount}
            variant="warning"
            icon={<Clock className="w-5 h-5 text-blood-light" />}
            subtitle="Awaiting allocation/dispatch"
          />
          <MetricCard
            title="Fulfilled Demands"
            value={fulfilledCount}
            variant="success"
            icon={<CheckCircle className="w-5 h-5 text-clinical" />}
            subtitle="Successfully closed cases"
          />
        </div>

        {error && <ErrorState error={error} onRetry={loadData} />}

        {/* Filters and Search Bar */}
        <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, hospital, patient ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-64"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="FULFILLED">FULFILLED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Urgency:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Urgencies</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="URGENT">URGENT</option>
                <option value="ROUTINE">ROUTINE</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {filteredRequests.length} of {requests.length} requisitions
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-secondary border border-border rounded-lg p-5">
          {isLoading ? (
            <LoadingState message="Fetching live hospital requisitions..." />
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              keyExtractor={(item) => item.request_id}
              emptyMessage="No blood requisitions matching current filter criteria."
            />
          )}
        </div>
      </div>
    </AeroShell>
  );
};
