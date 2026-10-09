import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { donationsApi, bloodGroupsApi } from '../../api';
import type { Donation, BloodGroup } from '../../types/api';
import { HeartHandshake } from 'lucide-react';

export const DonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [donList, groupList] = await Promise.all([
        donationsApi.getAll({ limit: 100 }),
        bloodGroupsApi.getAll(),
      ]);

      const groupMap: Record<number, string> = {};
      groupList.forEach((g: BloodGroup) => {
        groupMap[g.blood_group_id] = g.group_name;
      });

      setDonations(donList);
      setBloodGroups(groupMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve donations history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const columns: Column<Donation>[] = [
    {
      key: 'donation_id',
      header: 'DONATION ID',
      render: (d) => <span className="font-mono font-bold text-foreground">#{d.donation_id}</span>,
    },
    {
      key: 'donor_id',
      header: 'DONOR ID',
      render: (d) => <span className="font-mono text-foreground">Donor #{d.donor_id}</span>,
    },
    {
      key: 'blood_group_id',
      header: 'BLOOD GROUP',
      render: (d) => <BloodGroupBadge group={bloodGroups[d.blood_group_id] || `#${d.blood_group_id}`} size="sm" />,
    },
    {
      key: 'donation_date',
      header: 'DONATION DATE',
      render: (d) => <span className="font-mono text-xs text-muted-foreground">{d.donation_date}</span>,
    },
    {
      key: 'eligibility_status',
      header: 'CLINICAL ELIGIBILITY',
      render: (d) => <StatusBadge status={d.eligibility_status} size="sm" />,
    },
    {
      key: 'screening_status',
      header: 'LAB SCREENING',
      render: (d) => <StatusBadge status={d.screening_status} size="sm" />,
    },
    {
      key: 'blood_bank_id',
      header: 'COLLECTING FACILITY',
      render: (d) => <span className="font-mono text-muted-foreground text-xs">Bank #{d.blood_bank_id}</span>,
    },
    {
      key: 'remarks',
      header: 'REMARKS',
      render: (d) => <span className="text-xs text-muted-foreground italic">{d.remarks || '—'}</span>,
    },
  ];

  return (
    <AeroShell
      title="Blood Donation Intake Records"
      subtitle="Authoritative audit trail of collection events, lab screenings, and clinical eligibility"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDonations} />
      ) : (
        <DataTable
          columns={columns}
          data={donations}
          keyField="donation_id"
          searchable
          searchPlaceholder="Search by donation ID or donor ID..."
          searchFilter={(d, q) =>
            String(d.donation_id).includes(q) || String(d.donor_id).includes(q)
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
