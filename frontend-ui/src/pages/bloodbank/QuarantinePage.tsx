import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { intelligenceApi } from '../../api';
import type { ExpiryPreviewResponse, ExpiringUnit, ExpiryQuarantineResponse } from '../../types/api';
import {
  ShieldBan,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuarantinePage: React.FC = () => {
  const [expiryPreview, setExpiryPreview] = useState<ExpiryPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quarantine selection state
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [quarantineResult, setQuarantineResult] = useState<ExpiryQuarantineResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const loadExpiredUnits = async () => {
    setIsLoading(true);
    setError(null);
    setQuarantineResult(null);
    try {
      const data = await intelligenceApi.previewExpiry(7, 2);
      setExpiryPreview(data);
      // Auto-select units that are strictly EXPIRED
      const expiredOnly = data.flagged_units
        .filter((u) => u.expiry_status === 'EXPIRED')
        .map((u) => u.unit_id);
      setSelectedUnitIds(expiredOnly);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve expired units for quarantine');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpiredUnits();
  }, []);

  const handleToggleSelect = (unitId: number) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSelectAllExpired = () => {
    if (!expiryPreview) return;
    const expiredOnly = expiryPreview.flagged_units
      .filter((u) => u.expiry_status === 'EXPIRED')
      .map((u) => u.unit_id);
    setSelectedUnitIds(expiredOnly);
  };

  const handleExecuteQuarantine = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const payload = selectedUnitIds.length > 0 ? selectedUnitIds : undefined;
      const res = await intelligenceApi.quarantineExpired(payload);
      setQuarantineResult(res);
      setIsConfirmModalOpen(false);
      // Refresh list
      await loadExpiredUnits();
    } catch (err: unknown) {
      setExecutionError(err instanceof Error ? err.message : 'Quarantine execution failed');
      setIsConfirmModalOpen(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const columns: Column<ExpiringUnit>[] = [
    {
      key: 'select',
      header: 'SELECT',
      render: (u) => (
        <input
          type="checkbox"
          checked={selectedUnitIds.includes(u.unit_id)}
          onChange={() => handleToggleSelect(u.unit_id)}
          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (u) => <span className="font-mono font-bold text-slate-900">#{u.unit_id}</span>,
    },
    {
      key: 'expiry_date',
      header: 'EXPIRY DATE',
      render: (u) => <span className="font-mono text-xs font-bold text-rose-700">{u.expiry_date}</span>,
    },
    {
      key: 'days_left',
      header: 'DAYS PAST EXPIRY',
      render: (u) => (
        <span className="font-mono text-xs font-bold text-rose-600">
          {u.days_left < 0 ? `${Math.abs(u.days_left)} days overdue` : `${u.days_left}d remaining`}
        </span>
      ),
    },
    {
      key: 'current_status',
      header: 'CURRENT STATUS',
      render: (u) => (
        <span className="font-mono text-[10px] uppercase font-bold text-slate-700">
          {u.current_status}
        </span>
      ),
    },
    {
      key: 'expiry_status',
      header: 'CLASSIFICATION',
      render: (u) => (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            u.expiry_status === 'EXPIRED'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {u.expiry_status}
        </span>
      ),
    },
  ];

  return (
    <AeroShell
      title="Authoritative Unit Quarantine Action"
      subtitle="Safely transition past-expiry blood units to EXPIRED status in the MySQL database"
    >
      {/* Top Banner */}
      <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-400">
            <ShieldBan className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white uppercase">
              EXPIRY QUARANTINE PROTOCOL
            </h3>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Executing quarantine permanently updates physical unit records in the live MySQL database to prevent hazardous transfusion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAllExpired}
            className="px-3 py-1.5 bg-slate-900 border border-rose-700 rounded-lg text-xs font-semibold text-rose-200 hover:bg-slate-800 cursor-pointer"
          >
            Select All Expired ({expiryPreview?.counts.expired || 0})
          </button>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={selectedUnitIds.length === 0 || isExecuting}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            Quarantine Selected ({selectedUnitIds.length})
          </button>
        </div>
      </div>

      {/* Execution Outcome Strip */}
      {quarantineResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 text-emerald-950 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              Quarantine Successfully Executed in MySQL Database
            </h4>
            <p className="text-xs text-emerald-800 mt-1">
              {quarantineResult.units_changed} physical blood unit(s) were mutated to <strong className="font-mono">EXPIRED</strong> status.
            </p>
            {quarantineResult.changed_unit_ids.length > 0 && (
              <div className="mt-2 text-[11px] font-mono bg-emerald-100/60 p-2 rounded-lg border border-emerald-200 text-emerald-900">
                Mutated Unit IDs: {quarantineResult.changed_unit_ids.map((id) => `#${id}`).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {executionError && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 text-rose-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Quarantine Execution Failed</h4>
            <p className="text-xs text-rose-800 mt-1">{executionError}</p>
          </div>
        </div>
      )}

      {/* Units Table */}
      {isLoading ? (
        <LoadingState message="Loading quarantined units queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadExpiredUnits} />
      ) : expiryPreview ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div>
              Units eligible for quarantine based on <strong className="text-slate-900">collection_date + 42d standard shelf-life</strong>.
            </div>
            <button
              onClick={loadExpiredUnits}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          <DataTable
            columns={columns}
            data={expiryPreview.flagged_units}
            keyField="unit_id"
            searchable
            searchPlaceholder="Search by unit ID..."
            searchFilter={(u, q) => String(u.unit_id).includes(q)}
            pageSize={10}
          />
        </div>
      ) : null}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Authoritative Quarantine Execution"
        description={`You are about to permanently quarantine ${selectedUnitIds.length} blood unit(s). This will execute POST /expiry-engine/quarantine against the FastAPI backend, updating their status to EXPIRED in the MySQL database.`}
        confirmLabel={isExecuting ? 'Executing...' : `Quarantine ${selectedUnitIds.length} Units`}
        confirmVariant="danger"
        isLoading={isExecuting}
        onConfirm={handleExecuteQuarantine}
        onClose={() => setIsConfirmModalOpen(false)}
      />
    </AeroShell>
  );
};
