import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { intelligenceApi, bloodBanksApi } from '../../api';
import type { ShortageSurplusResponse, BloodBank, BloodGroupStockReport } from '../../types/api';
import {
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Building2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/features/aeroblood/navigation';

export const ShortageSurplusPage: React.FC = () => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number>(1);

  const [previewData, setPreviewData] = useState<ShortageSurplusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load banks
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banks = await bloodBanksApi.getAll({ limit: 50 });
        setBloodBanks(banks);
        if (banks[0] !== undefined) {
          setSelectedBankId(banks[0].blood_bank_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadBanks();
  }, []);

  const runShortageDetection = async (bankId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await intelligenceApi.previewShortageSurplus(bankId);
      setPreviewData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Shortage & Surplus analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBankId) {
      runShortageDetection(selectedBankId);
    }
  }, [selectedBankId]);

  return (
    <AeroShell
      title="Shortage & Surplus Detection Engine"
      subtitle="Comprehensive 8 blood-group stock classification from ShortageSurplusEngine"
      actions={
        <Link
          to={`/bloodbank/redistribution?destination_blood_bank_id=${selectedBankId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary text-foreground rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Solve Redistribution</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      {/* Target Facility Selector Bar */}
      <div className="bg-card rounded-lg border border-border/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Evaluating Facility:
          </span>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(Number(e.target.value))}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground"
          >
            {bloodBanks.map((b) => (
              <option key={b.blood_bank_id} value={b.blood_bank_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>

        <Button variant="ghost"
          onClick={() => runShortageDetection(selectedBankId)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-clinical hover:text-clinical cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-compute Stock Posture</span>
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Calculating 8 blood-group inventory thresholds..." subtext="Evaluating usable units, minimum floors, and surplus levels" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => runShortageDetection(selectedBankId)} />
      ) : previewData ? (
        <div className="space-y-6">
          <IntelligenceCard
            title={`Stock Classification Summary · ${previewData.blood_bank_name}`}
            disclaimer="DETECTION ANALYSIS ONLY — THRESHOLDS DERIVED FROM REAL BACKEND STOCK AUDIT"
            subtitle="Authoritative classification across all 8 standard ABO/Rh blood groups."
            actions={
              previewData.summary.has_critical_shortage ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-primary text-foreground font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  <AlertOctagon className="w-3 h-3" />
                  CRITICAL DEFICIT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] bg-primary/20 text-clinical border border-primary/30 font-medium px-2 py-0.5 rounded-full uppercase tracking-wide">
                  <CheckCircle2 className="w-3 h-3 text-clinical" />
                  STABLE POSTURE
                </span>
              )
            }
          >
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-card border border-border rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Total Usable Units
                </span>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {previewData.summary.total_usable_units}
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-blood-light block">
                  Groups in Shortage
                </span>
                <div className="mt-1 text-2xl font-semibold text-blood-light">
                  {previewData.summary.shortage_groups_count} <span className="text-xs text-blood-light font-normal">/ 8</span>
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-clinical block">
                  Balanced Groups
                </span>
                <div className="mt-1 text-2xl font-semibold text-clinical">
                  {previewData.summary.balanced_groups_count} <span className="text-xs text-clinical font-normal">/ 8</span>
                </div>
              </div>

              <div className="p-4 bg-accent/70 border border-primary/80 rounded-lg">
                <span className="text-[10px] font-medium uppercase tracking-wide text-clinical block">
                  Groups in Surplus
                </span>
                <div className="mt-1 text-2xl font-semibold text-clinical">
                  {previewData.summary.surplus_groups_count} <span className="text-xs text-clinical font-normal">/ 8</span>
                </div>
              </div>
            </div>

            {/* 8 Blood Groups Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {previewData.stock_by_group.map((item: BloodGroupStockReport) => {
                let cardBg = 'bg-card border-border';
                let statusBadge = 'bg-muted text-foreground border-border';

                if (item.status === 'SHORTAGE') {
                  cardBg = 'bg-accent/30 border-primary/80';
                  statusBadge = 'bg-accent text-blood-light border-primary';
                } else if (item.status === 'SURPLUS') {
                  cardBg = 'bg-accent/30 border-primary/80';
                  statusBadge = 'bg-accent text-clinical border-primary';
                } else if (item.status === 'BALANCED') {
                  cardBg = 'bg-accent/20 border-primary/80';
                  statusBadge = 'bg-accent text-clinical border-primary';
                }

                return (
                  <div
                    key={item.blood_group_id}
                    className={`p-4 rounded-lg border shadow-2xs flex flex-col justify-between ${cardBg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <BloodGroupBadge group={item.group_name} size="md" />
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Usable Units:</span>
                          <strong className="text-foreground font-mono text-sm">{item.usable_units}</strong>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-[11px]">
                          <span>Min Threshold:</span>
                          <span className="font-mono">{item.min_threshold}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-[11px]">
                          <span>Surplus Threshold:</span>
                          <span className="font-mono">{item.surplus_threshold}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/80 text-[11px] font-medium">
                      {item.status === 'SHORTAGE' && (
                        <div className="text-blood-light flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Shortfall: -{item.shortfall} Units</span>
                        </div>
                      )}
                      {item.status === 'SURPLUS' && (
                        <div className="text-clinical flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Excess: +{item.excess} Units</span>
                        </div>
                      )}
                      {item.status === 'BALANCED' && (
                        <div className="text-clinical flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stock within safe limits</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </IntelligenceCard>
        </div>
      ) : null}
    </AeroShell>
  );
};
