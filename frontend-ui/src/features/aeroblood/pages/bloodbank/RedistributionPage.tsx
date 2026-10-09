import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from '@/features/aeroblood/navigation';
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
        if (!destParam && banks[0] !== undefined) {
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
      render: (t) => <span className="font-mono font-bold text-foreground">#{t.unit_id}</span>,
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
          <span className="font-semibold text-foreground block">{t.source_blood_bank_name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">Bank #{t.source_blood_bank_id}</span>
        </div>
      ),
    },
    {
      key: 'destination_blood_bank',
      header: 'DESTINATION (SHORTAGE)',
      render: (t) => (
        <div>
          <span className="font-semibold text-foreground block">{t.destination_blood_bank_name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">Bank #{t.destination_blood_bank_id}</span>
        </div>
      ),
    },
    {
      key: 'distance_km',
      header: 'DISTANCE & TRANSIT',
      render: (t) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{t.distance_km.toFixed(1)} km</span>
          <span className="text-[10px] text-muted-foreground block font-mono">
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
          <span className="font-mono text-foreground block">{t.expiry_date}</span>
          <span className="text-[10px] text-clinical font-semibold">
            {t.days_until_expiry}d shelf buffer
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'CLINICAL RATIONALE',
      render: (t) => (
        <span className="text-[11px] text-muted-foreground font-medium leading-tight max-w-xs block">
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
      <div className="bg-card rounded-lg border border-border/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-clinical" />
            <h3 className="font-bold text-sm text-foreground">
              Redistribution Decision Parameters
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-normalr px-2 py-0.5 rounded bg-accent text-clinical border border-primary">
            HERO FEATURE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-normalr text-muted-foreground mb-1">
              Destination Bank (In Shortage) *
            </label>
            <select
              value={destinationBankId}
              onChange={(e) => setDestinationBankId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
            >
              {bloodBanks.map((b) => (
                <option key={b.blood_bank_id} value={b.blood_bank_id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-normalr text-muted-foreground mb-1">
              Filter Specific Source Bank (Optional)
            </label>
            <select
              value={sourceBankId}
              onChange={(e) => setSourceBankId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
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
            <label className="block text-[10px] font-bold uppercase tracking-normalr text-muted-foreground mb-1">
              Max Recommended Units
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxTransfers}
              onChange={(e) => setMaxTransfers(Number(e.target.value))}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono font-semibold text-foreground"
            />
          </div>

          <div className="flex items-end">
            <Button variant="ghost"
              onClick={runRedistribution}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-primary hover:bg-primary text-foreground rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Solving...' : 'Solve Redistribution'}
            </Button>
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
              <span className="text-xs font-bold text-foreground bg-primary/30 px-3 py-1 rounded-full border border-primary/40">
                {previewData.total_transfers_recommended} Transfers Proposed
              </span>
            }
          >
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-card border border-border rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-normalr text-muted-foreground block">
                  Recommended Transfers
                </span>
                <div className="mt-1 text-2xl font-black text-foreground">
                  {previewData.total_transfers_recommended}
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-normalr text-clinical block">
                  Physical Units to Transfer
                </span>
                <div className="mt-1 text-2xl font-black text-clinical">
                  {previewData.total_units_transferred}
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-normalr text-blood-light block">
                  Remaining Unmet Shortages
                </span>
                <div className="mt-1 text-2xl font-black text-blood-light">
                  {previewData.unmet_shortages_count}
                </div>
              </div>
            </div>

            {/* Logical Network Corridors Visualization */}
            <div className="mb-6 p-4 rounded-lg bg-secondary text-foreground border border-border">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-normalr text-muted-foreground">
                  LOGICAL REDISTRIBUTION NETWORK TOPOLOGY
                </span>
                <span className="text-[10px] font-mono text-clinical">
                  {previewData.transfers.length} ACTIVE TRANSFER CORRIDORS
                </span>
              </div>

              {previewData.transfers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  No inter-bank transfers recommended. Destination bank has sufficient stock or no matching surplus facilities found within safe transit windows.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewData.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-secondary/80 border border-border/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <BloodGroupBadge group={t.donor_blood_group} size="sm" />
                        <div>
                          <div className="font-bold text-foreground text-xs truncate max-w-[140px]">
                            {t.source_blood_bank_name}
                          </div>
                          <div className="text-[10px] text-clinical font-mono">
                            Unit #{t.unit_id} (Surplus)
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-3">
                        <span className="text-[9px] font-mono text-muted-foreground">{t.distance_km.toFixed(1)} km</span>
                        <ArrowRight className="w-4 h-4 text-clinical" />
                        <span className="text-[9px] font-mono text-muted-foreground">{t.days_until_expiry}d left</span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-foreground text-xs truncate max-w-[140px]">
                          {t.destination_blood_bank_name}
                        </div>
                        <div className="text-[10px] text-blood-light font-mono">
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
                <h4 className="text-xs font-bold uppercase tracking-normalr text-foreground">
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
            {previewData.unmet_shortages[0] !== undefined && (
              <div className="mt-6 pt-5 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-normalr text-blood-light mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-blood-light" />
                  <span>Unmet Shortages Requiring Donor Mobilization ({previewData.unmet_shortages.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {previewData.unmet_shortages.map((unmet: UnmetShortage, idx: number) => (
                    <div key={idx} className="p-3 bg-accent/60 rounded-lg border border-primary text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <BloodGroupBadge group={unmet.blood_group_name} size="sm" />
                        <span className="font-bold text-blood-light font-mono">
                          Shortfall: {unmet.remaining_shortfall} Units
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
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
