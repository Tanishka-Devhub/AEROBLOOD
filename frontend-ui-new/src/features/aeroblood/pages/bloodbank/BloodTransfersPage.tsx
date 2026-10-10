import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodTransfersApi } from '../../api';
import type { BloodTransfer } from '../../types/api';
import { Truck } from 'lucide-react';

export const BloodTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<BloodTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransfers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bloodTransfersApi.getAll({ limit: 50 });
      setTransfers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const columns: Column<BloodTransfer>[] = [
    {
      key: 'transfer_id',
      header: 'TRANSFER ID',
      render: (t) => <span className="font-mono font-medium text-foreground">#{t.transfer_id}</span>,
    },
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (t) => <span className="font-mono text-foreground font-medium">#{t.unit_id}</span>,
    },
    {
      key: 'source_blood_bank_id',
      header: 'SOURCE FACILITY',
      render: (t) => <span className="font-mono text-xs text-muted-foreground">Bank #{t.source_blood_bank_id}</span>,
    },
    {
      key: 'destination_blood_bank_id',
      header: 'DESTINATION FACILITY',
      render: (t) => <span className="font-mono text-xs text-muted-foreground">Bank #{t.destination_blood_bank_id}</span>,
    },
    {
      key: 'transfer_date',
      header: 'TRANSFER DATE',
      render: (t) => <span className="font-mono text-xs text-muted-foreground">{new Date(t.transfer_date).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      header: 'TRANSFER STATUS',
      render: (t) => <StatusBadge status={t.status} size="sm" />,
    },
    {
      key: 'reason',
      header: 'REASON / MOTIVATION',
      render: (t) => <span className="text-xs text-muted-foreground leading-tight">{t.reason}</span>,
    },
  ];

  return (
    <AeroShell
      title="Inter-Facility Blood Transfers"
      subtitle="Chain of custody tracking for inter-bank redistribution dispatches"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTransfers} />
      ) : (
        <DataTable
          columns={columns}
          data={transfers}
          keyField="transfer_id"
          searchable
          searchPlaceholder="Search by transfer ID or unit ID..."
          searchFilter={(t, q) =>
            String(t.transfer_id).includes(q) || String(t.unit_id).includes(q)
          }
          pageSize={10}
        />
      )}
    </AeroShell>
  );
};
