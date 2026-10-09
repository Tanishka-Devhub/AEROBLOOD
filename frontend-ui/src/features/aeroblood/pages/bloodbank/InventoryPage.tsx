import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { bloodUnitsApi } from '../../api';
import type { BloodUnit, BloodUnitStatus } from '../../types/api';
import { Package, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Mutation: Status Change Modal
  const [unitToUpdate, setUnitToUpdate] = useState<BloodUnit | null>(null);
  const [newStatus, setNewStatus] = useState<BloodUnitStatus>('AVAILABLE');
  const [isUpdating, setIsUpdating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadUnits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bloodUnitsApi.getAll({
        limit: 100,
        ...(selectedStatus !== 'ALL' ? { status: selectedStatus as BloodUnitStatus } : {}),
      });
      setUnits(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve blood inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [selectedStatus]);

  const handleStatusUpdate = async () => {
    if (!unitToUpdate) return;
    setIsUpdating(true);
    setMutationError(null);
    try {
      await bloodUnitsApi.updateStatus(unitToUpdate.unit_id, newStatus);
      setUnitToUpdate(null);
      // Refresh inventory
      await loadUnits();
    } catch (err: unknown) {
      setMutationError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<BloodUnit>[] = [
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (u) => <span className="font-mono font-bold text-foreground">#{u.unit_id}</span>,
    },
    {
      key: 'donation_id',
      header: 'DONATION ID',
      render: (u) => <span className="font-mono text-muted-foreground">Donation #{u.donation_id}</span>,
    },
    {
      key: 'blood_bank_id',
      header: 'STORAGE FACILITY',
      render: (u) => <span className="font-mono text-muted-foreground">Bank #{u.blood_bank_id}</span>,
    },
    {
      key: 'collection_date',
      header: 'COLLECTION DATE',
      render: (u) => <span className="font-mono text-xs text-muted-foreground">{u.collection_date}</span>,
    },
    {
      key: 'expiry_date',
      header: 'EXPIRY DATE',
      render: (u) => {
        const isExpired = new Date(u.expiry_date) < new Date();
        return (
          <span className={`font-mono text-xs ${isExpired ? 'text-blood-light font-bold' : 'text-muted-foreground'}`}>
            {u.expiry_date}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (u) => (
        <Button variant="ghost"
          onClick={() => {
            setUnitToUpdate(u);
            setNewStatus(u.status);
          }}
          className="text-xs font-semibold text-foreground hover:text-foreground bg-muted hover:bg-muted px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <AeroShell
      title="Physical Blood Inventory"
      subtitle="Complete inventory management across all storage bags registered in MySQL BloodUnit table"
    >
      {/* Top Filter Bar */}
      <div className="bg-card rounded-lg border border-border/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Status Filter:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RESERVED">RESERVED</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="USED">USED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="DISCARDED">DISCARDED</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Loaded <strong className="text-foreground">{units.length}</strong> physical units
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUnits} />
      ) : (
        <DataTable
          columns={columns}
          data={units}
          keyField="unit_id"
          searchable
          searchPlaceholder="Search by unit ID or donation ID..."
          searchFilter={(u, q) =>
            String(u.unit_id).includes(q) || String(u.donation_id).includes(q)
          }
          pageSize={10}
        />
      )}

      {/* Status Update Confirmation Modal */}
      {unitToUpdate && (
        <ConfirmationModal
          isOpen={true}
          title={`Update Status for Unit #${unitToUpdate.unit_id}`}
          description={`Select the new status for this physical blood unit. This will execute an authoritative PATCH request against the FastAPI backend.`}
          confirmLabel={isUpdating ? 'Updating...' : 'Save New Status'}
          isLoading={isUpdating}
          confirmVariant="primary"
          onConfirm={handleStatusUpdate}
          onClose={() => setUnitToUpdate(null)}
        />
      )}
    </AeroShell>
  );
};
