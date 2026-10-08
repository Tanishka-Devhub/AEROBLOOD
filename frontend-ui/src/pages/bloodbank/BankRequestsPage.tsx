import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodRequestsApi, bloodGroupsApi } from '../../api';
import type { BloodRequest, BloodGroup } from '../../types/api';
import { Layers, ArrowRight, BrainCircuit } from 'lucide-react';

export const BankRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const columns: Column<BloodRequest>[] = [
    {
      key: 'request_id',
      header: 'REQ ID',
      render: (r) => <span className="font-mono font-bold text-slate-900">#{r.request_id}</span>,
    },
    {
      key: 'hospital_id',
      header: 'HOSPITAL',
      render: (r) => <span className="font-mono text-xs text-slate-700">Hospital #{r.hospital_id}</span>,
    },
    {
      key: 'patient_reference',
      header: 'PATIENT REF',
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.patient_reference}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'GROUP',
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
              ? 'bg-rose-100 text-rose-800'
              : r.priority === 'URGENT'
              ? 'bg-amber-100 text-amber-800'
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
      key: 'actions',
      header: 'ALLOCATION SOLVER',
      render: (r) => (
        <Link
          to={`/bloodbank/allocation-preview?request_id=${r.request_id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-teal-700" />
          <span>Solve Allocation</span>
        </Link>
      ),
    },
  ];

  return (
    <AeroShell
      title="Incoming Blood Requests Queue"
      subtitle="Fulfill clinical hospital requisitions with inventory matching and donor intelligence"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRequests} />
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          keyField="request_id"
          searchable
          searchPlaceholder="Search by request ID, patient ref..."
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
