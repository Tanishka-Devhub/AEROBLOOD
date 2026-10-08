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
import { Link } from 'react-router-dom';

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
        if (banks.length > 0) {
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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Solve Redistribution</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      {/* Target Facility Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Evaluating Facility:
          </span>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            {bloodBanks.map((b) => (
              <option key={b.blood_bank_id} value={b.blood_bank_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => runShortageDetection(selectedBankId)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-compute Stock Posture</span>
        </button>
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
                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <AlertOctagon className="w-3 h-3" />
                  CRITICAL DEFICIT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  STABLE POSTURE
                </span>
              )
            }
          >
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Usable Units
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {previewData.summary.total_usable_units}
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                  Groups in Shortage
                </span>
                <div className="mt-1 text-2xl font-black text-rose-950">
                  {previewData.summary.shortage_groups_count} <span className="text-xs text-rose-700 font-normal">/ 8</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Balanced Groups
                </span>
                <div className="mt-1 text-2xl font-black text-emerald-950">
                  {previewData.summary.balanced_groups_count} <span className="text-xs text-emerald-700 font-normal">/ 8</span>
                </div>
              </div>

              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                  Groups in Surplus
                </span>
                <div className="mt-1 text-2xl font-black text-teal-950">
                  {previewData.summary.surplus_groups_count} <span className="text-xs text-teal-700 font-normal">/ 8</span>
                </div>
              </div>
            </div>

            {/* 8 Blood Groups Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {previewData.stock_by_group.map((item: BloodGroupStockReport) => {
                let cardBg = 'bg-white border-slate-200';
                let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';

                if (item.status === 'SHORTAGE') {
                  cardBg = 'bg-rose-50/30 border-rose-200/80';
                  statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                } else if (item.status === 'SURPLUS') {
                  cardBg = 'bg-teal-50/30 border-teal-200/80';
                  statusBadge = 'bg-teal-100 text-teal-800 border-teal-300';
                } else if (item.status === 'BALANCED') {
                  cardBg = 'bg-emerald-50/20 border-emerald-200/80';
                  statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                }

                return (
                  <div
                    key={item.blood_group_id}
                    className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between ${cardBg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <BloodGroupBadge group={item.group_name} size="md" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Usable Units:</span>
                          <strong className="text-slate-900 font-mono text-sm">{item.usable_units}</strong>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Min Threshold:</span>
                          <span className="font-mono">{item.min_threshold}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Surplus Threshold:</span>
                          <span className="font-mono">{item.surplus_threshold}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-[11px] font-bold">
                      {item.status === 'SHORTAGE' && (
                        <div className="text-rose-700 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Shortfall: -{item.shortfall} Units</span>
                        </div>
                      )}
                      {item.status === 'SURPLUS' && (
                        <div className="text-teal-700 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Excess: +{item.excess} Units</span>
                        </div>
                      )}
                      {item.status === 'BALANCED' && (
                        <div className="text-emerald-700 flex items-center gap-1">
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
