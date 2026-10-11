import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { Link } from '@/features/aeroblood/navigation';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { intelligenceApi } from '../../api';
import type { ExpiryPreviewResponse, ExpiringUnit } from '../../types/api';
import {
  Radar,
  AlertTriangle,
  Clock,
  ShieldBan,
  ArrowRight,
} from 'lucide-react';

export const ExpiryRadarPage: React.FC = () => {
  const [warningDays, setWarningDays] = useState<number>(7);
  const [criticalDays, setCriticalDays] = useState<number>(2);

  const [previewData, setPreviewData] = useState<ExpiryPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const runExpiryPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await intelligenceApi.previewExpiry(warningDays, criticalDays);
      setPreviewData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute Expiry Radar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runExpiryPreview();
  }, [warningDays, criticalDays]);

  const filteredUnits = (previewData?.flagged_units || []).filter((u) => {
    if (statusFilter !== 'ALL' && u.expiry_status !== statusFilter) return false;
    return true;
  });

  const columns: Column<ExpiringUnit>[] = [
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (u) => <span className="font-mono font-medium text-foreground">#{u.unit_id}</span>,
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
      render: (u) => <span className="font-mono text-xs font-medium text-foreground">{u.expiry_date}</span>,
    },
    {
      key: 'days_left',
      header: 'DAYS LEFT',
      render: (u) => {
        return (
          <span
            className={`font-mono font-medium ${
              u.days_left < 0
                ? 'text-blood-light'
                : u.days_left <= criticalDays
                ? 'text-blood-light'
                : 'text-blood-light'
            }`}
          >
            {u.days_left < 0 ? `${Math.abs(u.days_left)}d overdue` : `${u.days_left}d`}
          </span>
        );
      },
    },
    {
      key: 'expiry_status',
      header: 'RADAR CLASSIFICATION',
      render: (u) => (
        <span
          className={`text-[10px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border ${
            u.expiry_status === 'EXPIRED'
              ? 'bg-accent text-blood-light border-primary'
              : u.expiry_status === 'CRITICAL'
              ? 'bg-accent text-blood-light border-primary animate-pulse'
              : 'bg-accent text-blood-light border-primary'
          }`}
        >
          {u.expiry_status}
        </span>
      ),
    },
    {
      key: 'current_status',
      header: 'CURRENT STATUS',
      render: (u) => <StatusBadge status={u.current_status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Expiry Radar Surveillance"
      subtitle="Proactive multi-tier shelf life surveillance from ExpiryEngine decision solver"
      actions={
        <Link
          to="/bloodbank/quarantine"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary text-foreground rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <ShieldBan className="w-3.5 h-3.5" />
          <span>Execute Quarantine</span>
        </Link>
      }
    >
      {/* Parameter Adjustment Bar */}
      <div className="bg-card rounded-lg border border-border/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase font-medium text-[10px]">Warning Window:</span>
            <input
              type="number"
              min="1"
              max="30"
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-card border border-border rounded-lg text-xs font-mono font-medium"
            />
            <span className="text-muted-foreground">days</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase font-medium text-[10px]">Critical Window:</span>
            <input
              type="number"
              min="1"
              max="10"
              value={criticalDays}
              onChange={(e) => setCriticalDays(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-card border border-border rounded-lg text-xs font-mono font-medium"
            />
            <span className="text-muted-foreground">days</span>
          </div>

          <div className="flex items-center gap-2 border-l border-border pl-4">
            <span className="text-muted-foreground uppercase font-medium text-[10px]">Filter Tier:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
            >
              <option value="ALL">All Tiers</option>
              <option value="EXPIRED">EXPIRED Only</option>
              <option value="CRITICAL">CRITICAL Only</option>
              <option value="EXPIRING_SOON">EXPIRING SOON Only</option>
            </select>
          </div>
        </div>

        <Button variant="ghost"
          onClick={runExpiryPreview}
          className="px-3.5 py-1.5 bg-secondary hover:bg-secondary text-foreground rounded-lg text-xs font-semibold cursor-pointer"
        >
          Re-evaluate Radar
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Scanning physical units for shelf-life degradation..." subtext="Querying ExpiryEngine preview endpoint" />
      ) : error ? (
        <ErrorState message={error} onRetry={runExpiryPreview} />
      ) : previewData ? (
        <div className="space-y-6">
          <IntelligenceCard
            title="Expiry Surveillance Radar Analysis"
            disclaimer="RADAR PREVIEW ONLY — UNITS ARE FLAGGED FOR REVIEW AND HAVE NOT BEEN QUARANTINED YET"
            subtitle={`Surveillance scan with warning threshold at ${previewData.warning_days} days and critical window at ${previewData.critical_days} days.`}
          >
            {/* 4 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-blood-light block">
                  Past Expiry (Quarantinable)
                </span>
                <div className="mt-1 text-2xl font-semibold text-blood-light">
                  {previewData.counts.expired}
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-blood-light block">
                  Critical Shelf Life (&le; {previewData.critical_days}d)
                </span>
                <div className="mt-1 text-2xl font-semibold text-blood-light">
                  {previewData.counts.critical}
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-foreground block">
                  Expiring Soon (&le; {previewData.warning_days}d)
                </span>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {previewData.counts.expiring_soon}
                </div>
              </div>

              <div className="p-4 bg-card border border-border/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Total Flagged Units
                </span>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {previewData.counts.total_flagged}
                </div>
              </div>
            </div>

            {/* Flagged Units Data Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-foreground">
                  Flagged Physical Blood Units ({filteredUnits.length})
                </h4>
              </div>

              <DataTable
                columns={columns}
                data={filteredUnits}
                keyField="unit_id"
                searchable
                searchPlaceholder="Search by unit ID..."
                searchFilter={(u, q) => String(u.unit_id).includes(q)}
                pageSize={10}
              />
            </div>
          </IntelligenceCard>
        </div>
      ) : null}
    </AeroShell>
  );
};
