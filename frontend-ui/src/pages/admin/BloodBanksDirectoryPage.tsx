import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodBanksApi } from '../../api';
import type { BloodBank } from '../../types/api';
import { Network, MapPin, Phone } from 'lucide-react';

export const BloodBanksDirectoryPage: React.FC = () => {
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBanks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bloodBanksApi.getAll({ limit: 100 });
        setBanks(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve blood banks directory');
      } finally {
        setIsLoading(false);
      }
    };
    loadBanks();
  }, []);

  const columns: Column<BloodBank>[] = [
    {
      key: 'blood_bank_id',
      header: 'BANK ID',
      render: (b) => <span className="font-mono font-bold text-slate-900">#{b.blood_bank_id}</span>,
    },
    {
      key: 'name',
      header: 'FACILITY NAME',
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 block">{b.name}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {b.address}, {b.city}
          </span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'CITY REGION',
      render: (b) => <span className="font-semibold text-slate-800">{b.city}</span>,
    },
    {
      key: 'phone',
      header: 'PHONE',
      render: (b) => <span className="font-mono text-xs text-slate-600">{b.phone || 'Standard Line'}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (b) => <StatusBadge status={b.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Regional Blood Banks Directory"
      subtitle="Federated network registry of 2,823 blood banks and component storage centers"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          columns={columns}
          data={banks}
          keyField="blood_bank_id"
          searchable
          searchPlaceholder="Search blood banks by name, city..."
          searchFilter={(b, q) =>
            b.name.toLowerCase().includes(q.toLowerCase()) ||
            b.city.toLowerCase().includes(q.toLowerCase())
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
