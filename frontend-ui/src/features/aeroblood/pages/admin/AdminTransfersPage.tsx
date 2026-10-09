import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { Link } from '@/features/aeroblood/navigation';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { MetricCard } from '../../components/common/MetricCard';
import { bloodTransfersApi, bloodBanksApi } from '../../api';
import type { BloodTransfer, BloodBank } from '../../types/api';
import {
  Truck,
  Search,
  Filter,
  ArrowRight,
  ArrowRightLeft,
  Building2,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<BloodTransfer[]>([]);
  const [bloodBanks, setBloodBanks] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [transferList, banksList] = await Promise.all([
        bloodTransfersApi.getAll({ limit: 100 }),
        bloodBanksApi.getAll({ limit: 100 }),
      ]);
      setTransfers(transferList);

      const bMap: Record<number, string> = {};
      banksList.forEach((b: BloodBank) => {
        bMap[b.blood_bank_id] = b.name;
      });
      setBloodBanks(bMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load transfer logistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestedCount = transfers.filter((t) => t.status === 'REQUESTED').length;
  const inTransitCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length;
  const completedCount = transfers.filter((t) => t.status === 'COMPLETED').length;

  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const sourceName = (bloodBanks[t.source_blood_bank_id] || '').toLowerCase();
    const destName = (bloodBanks[t.destination_blood_bank_id] || '').toLowerCase();
    const reasonText = (t.reason || '').toLowerCase();

    const matchesSearch =
      !q ||
      t.transfer_id.toString().includes(q) ||
      t.unit_id.toString().includes(q) ||
      sourceName.includes(q) ||
      destName.includes(q) ||
      reasonText.includes(q);

    return matchesStatus && matchesSearch;
  });

  const columns: Column<BloodTransfer>[] = [
    {
      header: 'Transfer ID',
      accessor: (item) => (
        <span className="font-mono text-clinical font-semibold">#{item.transfer_id}</span>
      ),
    },
    {
      header: 'Unit ID',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-foreground">
          <Package className="w-3.5 h-3.5 text-clinical" />
          <span>Unit #{item.unit_id}</span>
        </div>
      ),
    },
    {
      header: 'Source Facility',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[140px]">
            {bloodBanks[item.source_blood_bank_id] || `Hub #${item.source_blood_bank_id}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Corridor',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-muted-foreground">#{item.source_blood_bank_id}</span>
          <ArrowRight className="w-3 h-3 text-clinical" />
          <span className="font-mono text-clinical font-medium">#{item.destination_blood_bank_id}</span>
        </div>
      ),
    },
    {
      header: 'Destination Facility',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5 text-clinical/80 shrink-0" />
          <span className="truncate max-w-[140px]">
            {bloodBanks[item.destination_blood_bank_id] || `Hub #${item.destination_blood_bank_id}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Transfer Date',
      accessor: (item) => (
        <span className="text-[11px] text-muted-foreground font-mono">
          {new Date(item.transfer_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Reason',
      accessor: (item) => (
        <span className="text-xs text-muted-foreground truncate max-w-[150px] block" title={item.reason}>
          {item.reason}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-clinical" />
              <h1 className="text-2xl font-bold text-foreground tracking-normal">
                Global Inter-Bank Transfers Ledger
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Logistics tracking, dispatch oversight, and custody transit records between storage facilities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/redistribution-network"
              className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary text-foreground text-sm font-medium rounded-lg shadow-sm transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Redistribution Solver
            </Link>
            <Button variant="ghost"
              onClick={loadData}
              className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground text-sm font-medium rounded-lg border border-border transition"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Transfers"
            value={transfers.length}
            icon={<Truck className="w-5 h-5 text-clinical" />}
            subtitle="Historical & active movements"
          />
          <MetricCard
            title="Requested"
            value={requestedCount}
            variant="warning"
            icon={<Clock className="w-5 h-5 text-blood-light" />}
            subtitle="Awaiting transfer approval"
          />
          <MetricCard
            title="Active In-Transit"
            value={inTransitCount}
            icon={<ArrowRightLeft className="w-5 h-5 text-foreground" />}
            subtitle="Units physically moving"
          />
          <MetricCard
            title="Completed"
            value={completedCount}
            variant="success"
            icon={<CheckCircle2 className="w-5 h-5 text-clinical" />}
            subtitle="Successfully delivered"
          />
        </div>

        {error && <ErrorState error={error} onRetry={loadData} />}

        {/* Filters */}
        <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transfer ID, unit, facility, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-64"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {filteredTransfers.length} of {transfers.length} transfers
          </div>
        </div>

        {/* Transfers Table */}
        <div className="bg-secondary border border-border rounded-lg p-5">
          {isLoading ? (
            <LoadingState message="Fetching inter-bank logistical records..." />
          ) : (
            <DataTable
              columns={columns}
              data={filteredTransfers}
              keyExtractor={(item) => item.transfer_id}
              emptyMessage="No inter-bank transfers found matching filter criteria."
            />
          )}
        </div>
      </div>
    </AeroShell>
  );
};
