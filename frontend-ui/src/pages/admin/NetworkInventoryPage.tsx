import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodUnitsApi } from '../../api';
import type { BloodUnit } from '../../types/api';
import { Package } from 'lucide-react';

export const NetworkInventoryPage: React.FC = () => {
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUnits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bloodUnitsApi.getAll({ limit: 100 });
        setUnits(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve network inventory');
      } finally {
        setIsLoading(false);
      }
    };
    loadUnits();
  }, []);

  const columns: Column<BloodUnit>[] = [
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (u) => <span className="font-mono font-bold text-slate-900">#{u.unit_id}</span>,
    },
    {
      key: 'donation_id',
      header: 'DONATION REF',
      render: (u) => <span className="font-mono text-slate-600">Donation #{u.donation_id}</span>,
    },
    {
      key: 'blood_bank_id',
      header: 'STORAGE FACILITY',
      render: (u) => <span className="font-mono text-slate-600">Bank #{u.blood_bank_id}</span>,
    },
    {
      key: 'collection_date',
      header: 'COLLECTION DATE',
      render: (u) => <span className="font-mono text-xs text-slate-500">{u.collection_date}</span>,
    },
    {
      key: 'expiry_date',
      header: 'EXPIRY DATE',
      render: (u) => <span className="font-mono text-xs font-bold text-slate-700">{u.expiry_date}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="National Blood Inventory Telemetry"
      subtitle="Federated inventory across all registered storage facilities in BloodUnit database"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          columns={columns}
          data={units}
          keyField="unit_id"
          searchable
          searchPlaceholder="Search by unit ID, donation ID..."
          searchFilter={(u, q) =>
            String(u.unit_id).includes(q) || String(u.donation_id).includes(q)
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
