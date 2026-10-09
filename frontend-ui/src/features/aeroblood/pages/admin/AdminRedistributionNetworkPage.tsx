import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
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

export const AdminRedistributionNetworkPage: React.FC = () => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [destinationBankId, setDestinationBankId] = useState<number>(1);
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
        const banks = await bloodBanksApi.getAll({ limit: 100 });
        setBloodBanks(banks);
        if (banks[0] !== undefined) {
          setDestinationBankId(banks[0].blood_bank_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadBanks();
  }, []);

  const runRedistribution = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = {
        destination_blood_bank_id: Number(destinationBankId),
        max_transfers: Number(maxTransfers),
        speed_kmph: Number(speedKmph),
        expiry_margin_days: Number(expiryMarginDays),
      };

      if (sourceBankId !== '') {
        payload.source_blood_bank_id = Number(sourceBankId);
      }

      const res = await intelligenceApi.previewRedistribution(payload);
      setPreviewData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compute redistribution paths');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<ProposedTransfer>[] = [
    {
      header: 'Unit ID',
      accessor: (item) => (
        <span className="font-mono text-clinical font-semibold">#{item.unit_id}</span>
      ),
    },
    {
      header: 'Blood Group',
      accessor: (item) => (
        <div className="flex items-center gap-1.5">
          <BloodGroupBadge group={item.donor_blood_group} size="sm" />
          {item.donor_blood_group !== item.recipient_blood_group && (
            <span className="text-[10px] text-muted-foreground">→ {item.recipient_blood_group}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Source Bank',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{item.source_blood_bank_name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">#{item.source_blood_bank_id}</span>
        </div>
      ),
    },
    {
      header: 'Corridor Route',
      accessor: (item) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-mono">#{item.source_blood_bank_id}</span>
          <ArrowRight className="w-3.5 h-3.5 text-clinical" />
          <span className="text-clinical font-semibold font-mono">#{item.destination_blood_bank_id}</span>
        </div>
      ),
    },
    {
      header: 'Distance / Transit',
      accessor: (item) => (
        <div className="text-xs">
          <div className="text-muted-foreground font-mono">{item.distance_km.toFixed(1)} km</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>ETA: {new Date(item.arrival_date || item.estimated_arrival_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Remaining Viability',
      accessor: (item) => (
        <div className="text-xs">
          <div className="text-clinical font-medium">{item.days_until_expiry} days</div>
          <div className="text-[10px] text-muted-foreground font-mono">exp: {item.expiry_date}</div>
        </div>
      ),
    },
  ];

  const unmetColumns: Column<UnmetShortage>[] = [
    {
      header: 'Blood Group',
      accessor: (item) => <BloodGroupBadge group={item.blood_group_name} size="sm" />,
    },
    {
      header: 'Destination Hub',
      accessor: (item) => (
        <span className="text-muted-foreground text-xs">
          {item.destination_blood_bank_name} (#{item.destination_blood_bank_id})
        </span>
      ),
    },
    {
      header: 'Remaining Shortfall',
      accessor: (item) => (
        <span className="font-mono text-blood-light font-bold">-{item.remaining_shortfall} units</span>
      ),
    },
  ];

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-clinical" />
              <h1 className="text-2xl font-bold text-foreground tracking-normal">
                National Inter-Bank Redistribution Corridors
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Cross-facility supply balancing engine simulating logistical transfers to satisfy localized shortages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-accent/60 border border-primary/40 text-clinical text-xs font-mono rounded-lg flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Transit Speed: {speedKmph} km/h
            </span>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-secondary border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-normalr mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-clinical" />
            Redistribution Routing Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Destination Hub (Needs Blood) <span className="text-blood-light">*</span>
              </label>
              <select
                value={destinationBankId}
                onChange={(e) => setDestinationBankId(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {bloodBanks.map((bank) => (
                  <option key={bank.blood_bank_id} value={bank.blood_bank_id}>
                    #{bank.blood_bank_id} - {bank.name} ({bank.city || 'National'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Source Hub (Optional)
              </label>
              <select
                value={sourceBankId}
                onChange={(e) => setSourceBankId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Any Surplus Hub in Network</option>
                {bloodBanks
                  .filter((b) => b.blood_bank_id !== destinationBankId)
                  .map((bank) => (
                    <option key={bank.blood_bank_id} value={bank.blood_bank_id}>
                      #{bank.blood_bank_id} - {bank.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Max Units to Transfer
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxTransfers}
                onChange={(e) => setMaxTransfers(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Estimated Transit Speed (km/h)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={speedKmph}
                onChange={(e) => setSpeedKmph(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Expiry Safety Buffer (days)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={expiryMarginDays}
                onChange={(e) => setExpiryMarginDays(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button variant="ghost"
              onClick={runRedistribution}
              disabled={isLoading || !destinationBankId}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary disabled:opacity-50 text-foreground text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Computing Optimal Corridors...' : 'Execute Redistribution Solver'}
            </Button>
          </div>
        </div>

        {error && <ErrorState error={error} onRetry={runRedistribution} />}

        {/* Results */}
        {isLoading ? (
          <LoadingState message="Analyzing federated surplus levels and shortest logistical corridors..." />
        ) : previewData ? (
          <div className="space-y-6">
            <IntelligenceCard
              title={`Redistribution Corridor Plan for Destination Hub #${destinationBankId}`}
              engine="REDISTRIBUTION RECOMMENDATION ENGINE"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-secondary/80 p-3 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-normalr block">Proposed Units</span>
                  <span className="text-xl font-bold text-clinical mt-1 block">
                    {previewData.total_transfers_recommended}
                  </span>
                </div>
                <div className="bg-secondary/80 p-3 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-normalr block">Total Transferred Units</span>
                  <span className="text-xl font-bold text-clinical mt-1 block">
                    {previewData.total_units_transferred}
                  </span>
                </div>
                <div className="bg-secondary/80 p-3 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-normalr block">Unmet Shortages</span>
                  <span className="text-xl font-bold text-blood-light mt-1 block">
                    {previewData.unmet_shortages_count}
                  </span>
                </div>
                <div className="bg-secondary/80 p-3 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-normalr block">Corridors Found</span>
                  <span className="text-xl font-bold text-muted-foreground mt-1 block">
                    {previewData.transfers.length}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-accent/20 border border-primary/40 rounded-lg flex items-start gap-2.5 text-xs text-blood-light">
                <ShieldAlert className="w-4 h-4 text-blood-light shrink-0 mt-0.5" />
                <span>
                  <strong>PREVIEW / RECOMMENDATION ONLY:</strong> These proposed transfers are algorithmic recommendations
                  based on real-time inventory and shortest Haversine distance corridors. Physical transfers must be confirmed via
                  authorized dispatch protocols.
                </span>
              </div>
            </IntelligenceCard>

            {/* Proposed Transfers Table */}
            <div className="bg-secondary border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-normalr mb-4 flex items-center justify-between">
                <span>Proposed Physical Units for Transfer ({previewData.transfers.length})</span>
                <span className="text-xs text-muted-foreground font-normal">Sorted by transit urgency & proximity</span>
              </h3>

              <DataTable
                columns={columns}
                data={previewData.transfers}
                keyExtractor={(item) => item.unit_id}
                emptyMessage="No inter-bank transfers proposed for this facility. Surplus may be balanced or depleted across connected hubs."
              />
            </div>

            {/* Unmet Shortages Table */}
            {previewData.unmet_shortages[0] !== undefined && (
              <div className="bg-secondary border border-primary/30 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-blood-light uppercase tracking-normalr mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blood-light" />
                  Remaining Unmet Shortages in Target Facility
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  These blood groups remain in deficit because no connected blood banks have surplus units exceeding their own safety threshold.
                </p>

                <DataTable
                  columns={unmetColumns}
                  data={previewData.unmet_shortages}
                  keyExtractor={(item) => item.blood_group_name}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-secondary border border-border rounded-lg p-12 text-center text-muted-foreground">
            Configure the destination hub and routing constraints above, then click <strong>Execute Redistribution Solver</strong> to calculate optimal transport corridors.
          </div>
        )}
      </div>
    </AeroShell>
  );
};
