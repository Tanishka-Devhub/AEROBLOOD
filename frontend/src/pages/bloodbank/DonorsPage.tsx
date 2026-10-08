import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { donorsApi, bloodGroupsApi } from '../../api';
import type { Donor, BloodGroup } from '../../types/api';
import { Users, Filter } from 'lucide-react';

export const DonorsPage: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDonors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [donorList, groupList] = await Promise.all([
        donorsApi.getAll({
          limit: 100,
          ...(selectedGroup !== 'ALL' ? { blood_group_id: selectedGroup } : {}),
        }),
        bloodGroupsApi.getAll(),
      ]);
      setDonors(donorList);
      setBloodGroups(groupList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve donors registry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, [selectedGroup]);

  const columns: Column<Donor>[] = [
    {
      key: 'donor_id',
      header: 'DONOR ID',
      render: (d) => <span className="font-mono font-bold text-slate-900">#{d.donor_id}</span>,
    },
    {
      key: 'full_name',
      header: 'FULL NAME',
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-900 block">{d.full_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">DOB: {d.date_of_birth} ({d.gender})</span>
        </div>
      ),
    },
    {
      key: 'blood_group',
      header: 'BLOOD GROUP',
      render: (d) => <BloodGroupBadge group={d.blood_group?.group_name || `#${d.blood_group_id}`} size="sm" />,
    },
    {
      key: 'phone',
      header: 'CONTACT',
      render: (d) => (
        <div className="text-xs text-slate-600">
          <div>{d.phone}</div>
          {d.email && <div className="text-[10px] text-slate-400">{d.email}</div>}
        </div>
      ),
    },
    {
      key: 'registration_date',
      header: 'REGISTERED ON',
      render: (d) => <span className="font-mono text-xs text-slate-500">{d.registration_date}</span>,
    },
    {
      key: 'status',
      header: 'DONOR STATUS',
      render: (d) => <StatusBadge status={d.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Registered Blood Donors Registry"
      subtitle="Comprehensive donor records loaded from MySQL Donor table"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Blood Group Filter:</span>
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Blood Groups</option>
            {bloodGroups.map((g) => (
              <option key={g.blood_group_id} value={g.blood_group_id}>
                {g.group_name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Donors Displayed: <strong className="text-slate-900">{donors.length}</strong>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDonors} />
      ) : (
        <DataTable
          columns={columns}
          data={donors}
          keyField="donor_id"
          searchable
          searchPlaceholder="Search donors by name..."
          searchFilter={(d, q) =>
            d.full_name.toLowerCase().includes(q.toLowerCase()) ||
            String(d.donor_id).includes(q)
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
