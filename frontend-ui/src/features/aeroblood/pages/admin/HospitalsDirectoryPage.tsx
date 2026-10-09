import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { hospitalsApi } from '../../api';
import type { Hospital } from '../../types/api';
import { Building2, MapPin, Phone } from 'lucide-react';

export const HospitalsDirectoryPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHospitals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await hospitalsApi.getAll({ limit: 100 });
        setHospitals(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve hospitals directory');
      } finally {
        setIsLoading(false);
      }
    };
    loadHospitals();
  }, []);

  const columns: Column<Hospital>[] = [
    {
      key: 'hospital_id',
      header: 'HOSPITAL ID',
      render: (h) => <span className="font-mono font-bold text-foreground">#{h.hospital_id}</span>,
    },
    {
      key: 'name',
      header: 'INSTITUTION NAME',
      render: (h) => (
        <div>
          <span className="font-bold text-foreground block">{h.name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            {h.address}, {h.city}
          </span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'CITY REGION',
      render: (h) => <span className="font-semibold text-foreground">{h.city}</span>,
    },
    {
      key: 'phone',
      header: 'PHONE',
      render: (h) => <span className="font-mono text-xs text-muted-foreground">{h.phone || 'Standard Line'}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (h) => <StatusBadge status={h.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Connected Hospitals Directory"
      subtitle="Federated network registry of 1,348 accredited healthcare institutions"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          columns={columns}
          data={hospitals}
          keyField="hospital_id"
          searchable
          searchPlaceholder="Search hospitals by name, city..."
          searchFilter={(h, q) =>
            h.name.toLowerCase().includes(q.toLowerCase()) ||
            h.city.toLowerCase().includes(q.toLowerCase())
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
