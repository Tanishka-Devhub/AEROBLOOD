import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { intelligenceApi, bloodBanksApi } from '../../api';
import type {
  RedistributionPreviewResponse,
  ProposedTransfer,
  UnmetShortage,
  BloodBank,
} from '../../types/api';
import {
  ArrowRightLeft,
  Truck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const RedistributionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const destParam = searchParams.get('destination_blood_bank_id');

  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [destinationBankId, setDestinationBankId] = useState<number>(destParam ? Number(destParam) : 1);
  const [sourceBankId, setSourceBankId] = useState<number | ''>('');
  const [maxTransfers, setMaxTransfers] = useState<number>(10);
  const [speedKmph, setSpeedKmph] = useState<number>(40);
  const [expiryMarginDays, setExpiryMarginDays] = useState<number>(3);

  const [previewData, setPreviewData] = useState<RedistributionPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banks = await bloodBanksApi.getAll({ limit: 50 });
        setBloodBanks(banks);
        if (!destParam && banks.length > 0) {
          setDestinationBankId(banks[0].blood_bank_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadBanks();
  }, [destParam]);

  const runRedistribution = async () => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);
    try {
      const res = await intelligenceApi.previewRedistribution({
        destination_blood_bank_id: Number(destinationBankId),
        source_blood_bank_id: sourceBankId ? Number(sourceBankId) : null,
        max_transfers: Number(maxTransfers),
        speed_kmph: Number(speedKmph),
        expiry_margin_days: Number(expiryMarginDays),
      });
      setPreviewData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Redistribution optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (destinationBankId) {
      runRedistribution();
    }
  }, [destinationBankId]);

  const destBankObj = bloodBanks.find((b) => b.blood_bank_id === destinationBankId);

  const transferColumns: Column<ProposedTransfer>[] = [
    {
      key: 'unit_id',
      header: 'UNIT ID',
      render: (t) => <span className="font-mono font-bold text-slate-900">#{t.unit_id}</span>,
    },
    {
      key: 'donor_blood_group',
      header: 'DONOR GROUP',
      render: (t) => <BloodGroupBadge group={t.donor_blood_group} size="sm" />,
    },
    {
      key: 'source_blood_bank',
      header: 'SOURCE FACILITY (SURPLUS)',
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-800 block">{t.source_blood_bank_name}</span>
          <span className="font-mono text-[10px] text-slate-400">Bank #{t.source_blood_bank_id}</span>
        </div>
      ),
    },
    {
      key: 'destination_blood_bank',
      header: 'DESTINATION (SHORTAGE)',
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-800 block">{t.destination_blood_bank_name}</span>
          <span className="font-mono text-[10px] text-slate-400">Bank #{t.destination_blood_bank_id}</span>
        </div>
      ),
    },
    {
      key: 'distance_km',
      header: 'DISTANCE & TRANSIT',
      render: (t) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{t.distance_km.toFixed(1)} km</span>
          <span className="text-[10px] text-slate-400 block font-mono">
            Arrival: {t.estimated_arrival_date}
          </span>
        </div>
      ),
    },
    {
      key: 'expiry_date',
      header: 'SHELF LIFE BUFFER',
      render: (t) => (
        <div className="text-xs">
          <span className="font-mono text-slate-700 block">{t.expiry_date}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {t.days_until_expiry}d shelf buffer
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'CLINICAL RATIONALE',
      render: (t) => (
        <span className="text-[11px] text-slate-600 font-medium leading-tight max-w-xs block">
          {t.reason}
        </span>
      ),
    },
  ];

  return (
    <AeroShell
      title="Inter-Bank Redistribution Engine"
      subtitle="HERO ALGORITHM · Autonomous cross-facility inventory balancing from RedistributionEngine"
    >
      {/* Parameter Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Redistribution Decision Parameters
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            HERO FEATURE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination Bank (In Shortage) *
            </label>
            <select
              value={destinationBankId}
              onChange={(e) => setDestinationBankId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              {bloodBanks.map((b) => (
                <option key={b.blood_bank_id} value={b.blood_bank_id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Filter Specific Source Bank (Optional)
            </label>
            <select
              value={sourceBankId}
              onChange={(e) => setSourceBankId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="">All Available Network Banks</option>
              {bloodBanks
                .filter((b) => b.blood_bank_id !== destinationBankId)
                .map((b) => (
                  <option key={b.blood_bank_id} value={b.blood_bank_id}>
                    {b.name} ({b.city})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Max Recommended Units
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxTransfers}
              onChange={(e) => setMaxTransfers(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runRedistribution}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Solving...' : 'Solve Redistribution'}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Executing Redistribution Engine network solver..." subtext="Analyzing inter-bank shortage/surplus topology, Haversine travel corridors, and shelf life constraints" />
      ) : error ? (
        <ErrorState message={error} onRetry={runRedistribution} />
      ) : previewData ? (
        <div className="space-y-6">
          <IntelligenceCard
            title={`Redistribution Analysis · Destination: ${destBankObj?.name || `Bank #${destinationBankId}`}`}
            disclaimer="RECOMMENDATION ONLY — NO TRANSFER HAS BEEN CREATED"
            subtitle="Automated decision support proposing optimal unit transfers from surplus facilities to alleviate deficits."
            actions={
              <span className="text-xs font-bold text-white bg-teal-500/30 px-3 py-1 rounded-full border border-teal-400/40">
                {previewData.total_transfers_recommended} Transfers Proposed
              </span>
            }
          >
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recommended Transfers
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {previewData.total_transfers_recommended}
                </div>
              </div>

              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                  Physical Units to Transfer
                </span>
                <div className="mt-1 text-2xl font-black text-teal-950">
                  {previewData.total_units_transferred}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Remaining Unmet Shortages
                </span>
                <div className="mt-1 text-2xl font-black text-amber-950">
                  {previewData.unmet_shortages_count}
                </div>
              </div>
            </div>

            {/* Logical Network Corridors Visualization */}
            <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  LOGICAL REDISTRIBUTION NETWORK TOPOLOGY
                </span>
                <span className="text-[10px] font-mono text-teal-400">
                  {previewData.transfers.length} ACTIVE TRANSFER CORRIDORS
                </span>
              </div>

              {previewData.transfers.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No inter-bank transfers recommended. Destination bank has sufficient stock or no matching surplus facilities found within safe transit windows.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewData.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <BloodGroupBadge group={t.donor_blood_group} size="sm" />
                        <div>
                          <div className="font-bold text-white text-xs truncate max-w-[140px]">
                            {t.source_blood_bank_name}
                          </div>
                          <div className="text-[10px] text-teal-400 font-mono">
                            Unit #{t.unit_id} (Surplus)
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-3">
                        <span className="text-[9px] font-mono text-slate-400">{t.distance_km.toFixed(1)} km</span>
                        <ArrowRight className="w-4 h-4 text-teal-400" />
                        <span className="text-[9px] font-mono text-slate-400">{t.days_until_expiry}d left</span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white text-xs truncate max-w-[140px]">
                          {t.destination_blood_bank_name}
                        </div>
                        <div className="text-[10px] text-rose-400 font-mono">
                          Recipient Shortage
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposed Physical Unit Transfers Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recommended Physical Unit Allocations ({previewData.transfers.length})
                </h4>
              </div>

              <DataTable
                columns={transferColumns}
                data={previewData.transfers}
                keyField="unit_id"
                searchable
                searchPlaceholder="Search by unit ID, facility name..."
                searchFilter={(t, q) =>
                  String(t.unit_id).includes(q) ||
                  t.source_blood_bank_name.toLowerCase().includes(q.toLowerCase()) ||
                  t.destination_blood_bank_name.toLowerCase().includes(q.toLowerCase())
                }
                pageSize={10}
              />
            </div>

            {/* Unmet Shortages Section */}
            {previewData.unmet_shortages.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Unmet Shortages Requiring Donor Mobilization ({previewData.unmet_shortages.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {previewData.unmet_shortages.map((unmet: UnmetShortage, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <BloodGroupBadge group={unmet.blood_group_name} size="sm" />
                        <span className="font-bold text-rose-800 font-mono">
                          Shortfall: {unmet.remaining_shortfall} Units
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {unmet.destination_blood_bank_name} cannot be fulfilled via inter-bank transfer. Recommend immediate Adaptive Donor Intelligence dispatch.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </IntelligenceCard>
        </div>
      ) : null}
    </AeroShell>
  );
};
