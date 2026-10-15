import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  bloodUnitsApi,
  bloodRequestsApi,
  bloodGroupsApi,
  intelligenceApi,
  bloodBanksApi,
} from '../../api';
import type {
  BloodUnit,
  BloodGroup,
  ExpiryPreviewResponse,
  ShortageSurplusResponse,
  BloodBank,
} from '../../types/api';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  BrainCircuit,
  TrendingDown,
  Radar,
  ArrowRight,
  ShieldBan,
  Droplet,
} from 'lucide-react';

export const BloodBankCommandCenter: React.FC = () => {
  const [bloodUnits, setBloodUnits] = useState<BloodUnit[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [activeBank, setActiveBank] = useState<BloodBank | null>(null);

  const [expirySummary, setExpirySummary] = useState<ExpiryPreviewResponse | null>(null);
  const [shortageSummary, setShortageSummary] = useState<ShortageSurplusResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [units, groups, banks, expiry] = await Promise.all([
        bloodUnitsApi.getAll({ limit: 50 }),
        bloodGroupsApi.getAll(),
        bloodBanksApi.getAll({ limit: 1 }),
        intelligenceApi.previewExpiry(7, 2),
      ]);

      const groupMap: Record<number, string> = {};
      groups.forEach((g: BloodGroup) => {
        groupMap[g.blood_group_id] = g.group_name;
      });

      setBloodUnits(units);
      setBloodGroups(groupMap);
      setExpirySummary(expiry);

      if (banks.length > 0) {
        setActiveBank(banks[0]);
        // Also run shortage preview for this bank
        try {
          const shortage = await intelligenceApi.previewShortageSurplus(banks[0].blood_bank_id);
          setShortageSummary(shortage);
        } catch {
          // Tolerated
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve blood bank command telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUnits = bloodUnits.length;
  const availableUnits = bloodUnits.filter((u) => u.status === 'AVAILABLE').length;
  const reservedUnits = bloodUnits.filter((u) => u.status === 'RESERVED').length;

  const unitColumns: Column<BloodUnit>[] = [
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (u) => <span className="font-mono font-bold text-slate-900">#{u.unit_id}</span>,
    },
    {
      key: 'blood_bank_id',
      header: 'BANK ID',
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
      render: (u) => <span className="font-mono text-xs text-slate-500">{u.expiry_date}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Blood Bank Command Center"
      subtitle={
        activeBank
          ? `Operating as ${activeBank.name} (${activeBank.city}) · Live Inventory & Intelligence Radar`
          : 'Operational facility management, expiry surveillance, and AI redistribution'
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/bloodbank/quarantine"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ShieldBan className="w-3.5 h-3.5 text-rose-600" />
            <span>Quarantine Action</span>
          </Link>
          <Link
            to="/bloodbank/redistribution"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Redistribution Intel</span>
          </Link>
        </div>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Blood Units"
          value={totalUnits}
          subtitle="Physical inventory tracked"
          icon={<Package className="w-5 h-5 text-slate-700" />}
          variant="default"
        />
        <MetricCard
          title="Available Stock"
          value={availableUnits}
          subtitle="Unallocated and ready for dispatch"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
          variant="success"
        />
        <MetricCard
          title="Reserved Units"
          value={reservedUnits}
          subtitle="Matched to active requisitions"
          icon={<Droplet className="w-5 h-5 text-blue-700" />}
          variant="default"
        />
        <MetricCard
          title="Flagged Expiring"
          value={expirySummary ? expirySummary.counts.total_flagged : '—'}
          subtitle={expirySummary ? `${expirySummary.counts.critical} critical (${expirySummary.critical_days}d window)` : 'Telemetry loading'}
          icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
          variant="warning"
        />
      </div>

      {/* Intelligence Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expiry Radar Quick Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">Expiry Surveillance Radar</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                ACTIVE
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-rose-700 block">Expired</span>
                <span className="text-xl font-black text-rose-900">
                  {expirySummary ? expirySummary.counts.expired : '0'}
                </span>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Critical</span>
                <span className="text-xl font-black text-amber-900">
                  {expirySummary ? expirySummary.counts.critical : '0'}
                </span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Warning</span>
                <span className="text-xl font-black text-blue-900">
                  {expirySummary ? expirySummary.counts.expiring_soon : '0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Algorithms continuously screen blood unit shelf life to avert wastage and trigger automated quarantine workflows.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/bloodbank/expiry"
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>Inspect Flagged Units</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/bloodbank/quarantine"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Execute Quarantine →
            </Link>
          </div>
        </div>

        {/* Shortage & Surplus Quick Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Stock Balance Classification</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                8 GROUPS
              </span>
            </div>

            {shortageSummary ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Usable Units on Hand:</span>
                  <strong className="text-slate-900">{shortageSummary.summary.total_usable_units} Units</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Groups in Shortage:</span>
                  <strong className="text-rose-700">{shortageSummary.summary.shortage_groups_count} of 8</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Groups in Surplus:</span>
                  <strong className="text-teal-700">{shortageSummary.summary.surplus_groups_count} of 8</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Critical Deficit Detected:</span>
                  <strong className={shortageSummary.summary.has_critical_shortage ? 'text-rose-700' : 'text-emerald-700'}>
                    {shortageSummary.summary.has_critical_shortage ? 'YES (Immediate Transfer Recommended)' : 'NO'}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 text-center text-xs text-slate-400">
                Shortage/Surplus classification loading...
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/bloodbank/shortage-surplus"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View 8-Group Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/bloodbank/redistribution"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Redistribution Solver →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Physical Inventory Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Physical Blood Units Inventory</h3>
            <p className="text-xs text-slate-500">Live units registered in BloodUnit database table with immutable status</p>
          </div>
          <Link
            to="/bloodbank/inventory"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>Full Inventory Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <DataTable
            columns={unitColumns}
            data={bloodUnits}
            keyField="unit_id"
            searchable
            searchPlaceholder="Search by unit ID..."
            searchFilter={(u, q) => String(u.unit_id).includes(q)}
            pageSize={10}
          />
        )}
      </div>
    </AeroShell>
  );
};
