import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { MetricCard } from '../../components/common/MetricCard';
import { allocationsApi } from '../../api';
import type { Allocation, AllocationStatus } from '../../types/api';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  Building2,
  Package,
  Layers,
} from 'lucide-react';

export const AdminAllocationsPage: React.FC = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAllocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationsApi.getAll({ limit: 150 });
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system allocations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const reservedCount = allocations.filter((a) => a.status === 'RESERVED').length;
  const allocatedCount = allocations.filter((a) => a.status === 'ALLOCATED').length;
  const issuedCount = allocations.filter((a) => a.status === 'ISSUED').length;

  const filteredAllocations = allocations.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.allocation_id.toString().includes(query) ||
      item.request_id.toString().includes(query) ||
      item.unit_id.toString().includes(query) ||
      item.source_blood_bank_id.toString().includes(query);

    return matchesStatus && matchesSearch;
  });

  const columns: Column<Allocation>[] = [
    {
      header: 'Allocation ID',
      accessor: (item) => (
        <span className="font-mono text-teal-400 font-semibold">#{item.allocation_id}</span>
      ),
    },
    {
      header: 'Linked Request',
      accessor: (item) => (
        <Link
          to={`/hospital/requests?request_id=${item.request_id}`}
          className="font-mono text-slate-200 hover:text-teal-300 font-semibold flex items-center gap-1 transition"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Req #{item.request_id}</span>
        </Link>
      ),
    },
    {
      header: 'Unit Assigned',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-slate-300">
          <Package className="w-3.5 h-3.5 text-teal-400" />
          <span>Unit #{item.unit_id}</span>
        </div>
      ),
    },
    {
      header: 'Source Hub',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Hub #{item.source_blood_bank_id}</span>
        </div>
      ),
    },
    {
      header: 'Staff Authorizer',
      accessor: (item) => (
        <span className="font-mono text-[11px] text-slate-400">
          Staff #{item.allocated_by_staff_id}
        </span>
      ),
    },
    {
      header: 'Allocated At',
      accessor: (item) => (
        <span className="text-[11px] text-slate-400 font-mono">
          {new Date(item.allocated_at).toLocaleString()}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Global Allocations Ledger
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Authoritative audit trail of blood units reserved, released, and dispatched to hospital requisitions
            </p>
          </div>
          <button
            onClick={loadAllocations}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            Refresh Ledger
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Allocations"
            value={allocations.length}
            icon={<FileText className="w-5 h-5 text-teal-400" />}
            subtitle="Historical & active ledger entries"
          />
          <MetricCard
            title="Reserved Units"
            value={reservedCount}
            variant="warning"
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            subtitle="Earmarked for hospital delivery"
          />
          <MetricCard
            title="Allocated Units"
            value={allocatedCount}
            icon={<Truck className="w-5 h-5 text-sky-400" />}
            subtitle="Units assigned to requests"
          />
          <MetricCard
            title="Issued Units"
            value={issuedCount}
            variant="success"
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            subtitle="Dispatched and delivered"
          />
        </div>

        {error && <ErrorState error={error} onRetry={loadAllocations} />}

        {/* Filter bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search allocation, request, unit, hub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-64"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="RESERVED">RESERVED</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="ISSUED">ISSUED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {filteredAllocations.length} of {allocations.length} allocations
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {isLoading ? (
            <LoadingState message="Loading allocation audit records..." />
          ) : (
            <DataTable
              columns={columns}
              data={filteredAllocations}
              keyExtractor={(item) => item.allocation_id}
              emptyMessage="No allocations found matching criteria."
            />
          )}
        </div>
      </div>
    </AeroShell>
  );
};
