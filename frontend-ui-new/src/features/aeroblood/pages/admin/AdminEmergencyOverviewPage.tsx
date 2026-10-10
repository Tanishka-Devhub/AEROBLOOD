import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { BloodRequest, BloodGroup } from '../../types/api';
import { AlertOctagon, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Link } from '@/features/aeroblood/navigation';

export const AdminEmergencyOverviewPage: React.FC = () => {
  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [reqs, groups] = await Promise.all([
          bloodRequestsApi.getAll({ priority: 'EMERGENCY', limit: 100 }),
          bloodGroupsApi.getAll(),
        ]);

        const groupMap: Record<number, string> = {};
        groups.forEach((g: BloodGroup) => {
          groupMap[g.blood_group_id] = g.group_name;
        });

        setEmergencyRequests(reqs);
        setBloodGroups(groupMap);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load emergency telemetry');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const pendingCount = emergencyRequests.filter((r) => r.status === 'PENDING').length;
  const fulfilledCount = emergencyRequests.filter((r) => r.status === 'FULFILLED').length;

  const columns: Column<BloodRequest>[] = [
    {
      key: 'request_id',
      header: 'REQ ID',
      render: (r) => <span className="font-mono font-medium text-foreground">#{r.request_id}</span>,
    },
    {
      key: 'hospital_id',
      header: 'REQUESTING HOSPITAL',
      render: (r) => <span className="font-mono text-xs text-foreground">Hospital #{r.hospital_id}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'BLOOD GROUP',
      render: (r) => <BloodGroupBadge group={bloodGroups[r.blood_group_id] || `#${r.blood_group_id}`} size="sm" variant="emergency" />,
    },
    {
      key: 'quantity_required',
      header: 'UNITS',
      render: (r) => <span className="font-medium text-foreground">{r.quantity_required} Units</span>,
    },
    {
      key: 'patient_reference',
      header: 'PATIENT REF',
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.patient_reference}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'SOLVER PREVIEW',
      render: (r) => (
        <Link
          to={`/hospital/allocation-intelligence?request_id=${r.request_id}`}
          className="inline-flex items-center gap-1 text-clinical hover:text-clinical font-semibold text-xs"
        >
          <span>Allocation Preview</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <AeroShell
      title="National Emergency Operations Posture"
      subtitle="Federated monitoring of critical-priority clinical requisitions"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Emergency Requisitions"
          value={emergencyRequests.length}
          subtitle="All-time life-critical orders"
          icon={<AlertOctagon className="w-5 h-5 text-blood-light" />}
          variant="emergency"
        />
        <MetricCard
          title="Pending Emergency Queue"
          value={pendingCount}
          subtitle="Awaiting allocation matching"
          icon={<Clock className="w-5 h-5 text-blood-light" />}
          variant="warning"
        />
        <MetricCard
          title="Fulfilled Emergency Units"
          value={fulfilledCount}
          subtitle="Successfully delivered"
          icon={<CheckCircle2 className="w-5 h-5 text-clinical" />}
          variant="success"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Active Emergency Demand Feed</h3>
            <p className="text-xs text-muted-foreground">Live emergency requests queried from FastAPI backend</p>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : (
          <DataTable
            columns={columns}
            data={emergencyRequests}
            keyField="request_id"
            searchable
            searchPlaceholder="Search emergency requisitions..."
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
