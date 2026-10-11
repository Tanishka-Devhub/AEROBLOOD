import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { BloodRequest, BloodGroup } from '../../types/api';
import { History, Calendar } from 'lucide-react';

export const RequestHistoryPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
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

        // Filter to fulfilled, cancelled, or expired requests (history archive)
        const historyData = reqData.filter((r) =>
          ['FULFILLED', 'CANCELLED', 'EXPIRED', 'PARTIALLY_ALLOCATED'].includes(r.status)
        );

        setRequests(historyData[0] !== undefined ? historyData : reqData);
        setBloodGroups(groupMap);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve request history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const columns: Column<BloodRequest>[] = [
    {
      key: 'request_id',
      header: 'REQ ID',
      render: (r) => <span className="font-mono font-medium text-foreground">#{r.request_id}</span>,
    },
    {
      key: 'request_date',
      header: 'REQUEST DATE',
      render: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(r.request_date).toLocaleDateString()}
        </span>
      ),
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
              ? 'bg-accent text-blood-light'
              : r.priority === 'URGENT'
              ? 'bg-accent text-blood-light'
              : 'bg-muted text-foreground'
          }`}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'OUTCOME STATUS',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Requisition History Archive"
      subtitle="Historical audit log of fulfilled, closed, and resolved blood requisitions"
    >
      <div className="bg-card rounded-lg border border-border/90 p-4 shadow-xs flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span>Historical requisition records preserved under immutable audit requirements.</span>
        </div>
        <div className="font-mono font-medium text-foreground">
          Total Archived Records: {requests.length}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          keyField="request_id"
          searchable
          searchPlaceholder="Search history by patient ref or request ID..."
          searchFilter={(r, q) =>
            r.patient_reference.toLowerCase().includes(q.toLowerCase()) ||
            String(r.request_id).includes(q)
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
