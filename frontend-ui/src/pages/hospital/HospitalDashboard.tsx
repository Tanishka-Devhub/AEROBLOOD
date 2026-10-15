import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { BloodRequest, BloodGroup } from '../../types/api';
import {
  PlusCircle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
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
      setError(err instanceof Error ? err.message : 'Failed to retrieve hospital telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const emergencyRequests = requests.filter((r) => r.priority === 'EMERGENCY').length;
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED').length;

  const columns: Column<BloodRequest>[] = [
    {
      key: 'request_id',
      header: 'REQ ID',
      render: (r) => <span className="font-mono font-bold text-slate-900">#{r.request_id}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'BLOOD GROUP',
      render: (r) => <BloodGroupBadge group={bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`} size="sm" />,
    },
    {
      key: 'quantity_required',
      header: 'UNITS',
      render: (r) => <span className="font-bold text-slate-800">{r.quantity_required}</span>,
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
      key: 'status',
      header: 'STATUS',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'patient_reference',
      header: 'PATIENT REF',
      render: (r) => <span className="font-mono text-slate-600 text-xs">{r.patient_reference}</span>,
    },
    {
      key: 'required_by',
      header: 'REQUIRED BY',
      render: (r) => (
        <span className="text-[11px] text-slate-500 font-mono">
          {new Date(r.required_by).toLocaleDateString()} {new Date(r.required_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'INTELLIGENCE',
      render: (r) => (
        <Link
          to={`/hospital/allocation-intelligence?request_id=${r.request_id}`}
          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-xs"
        >
          <span>Preview Allocation</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <AeroShell
      title="Hospital Operational Desk"
      subtitle="Live blood requisition queue, emergency workflow monitoring, and allocation previews"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/hospital/new-request"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Link>
          <Link
            to="/hospital/emergency"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Emergency Request</span>
          </Link>
        </div>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requisitions"
          value={totalRequests}
          subtitle="Hospital demand volume"
          icon={<FileText className="w-5 h-5 text-slate-700" />}
          variant="default"
        />
        <MetricCard
          title="Pending Queue"
          value={pendingRequests}
          subtitle="Awaiting allocation matching"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
          variant="warning"
        />
        <MetricCard
          title="Emergency Flags"
          value={emergencyRequests}
          subtitle="Critical priority requisitions"
          icon={<AlertOctagon className="w-5 h-5 text-rose-700" />}
          variant="emergency"
        />
        <MetricCard
          title="Fulfilled Units"
          value={fulfilledRequests}
          subtitle="Successfully allocated & received"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
          variant="success"
        />
      </div>

      {/* Main Request Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Blood Requisitions Queue</h3>
            <p className="text-xs text-slate-500">Live request telemetry from MySQL database via FastAPI backend</p>
          </div>
          <Link
            to="/hospital/requests"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View All Requisitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <DataTable
            columns={columns}
            data={requests}
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
      </div>
    </AeroShell>
  );
};
