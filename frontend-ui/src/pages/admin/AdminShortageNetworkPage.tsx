import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { bloodBanksApi, intelligenceApi } from '../../api';
import type { BloodBank, ShortageSurplusResponse } from '../../types/api';
import {
  TrendingDown,
  Building2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
  Users,
  Search,
} from 'lucide-react';

export const AdminShortageNetworkPage: React.FC = () => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ShortageSurplusResponse | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch available blood banks
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const data = await bloodBanksApi.getAll({ limit: 50 });
        setBloodBanks(data);
        if (data.length > 0) {
          setSelectedBankId(data[0].blood_bank_id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load blood banks');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // 2. Run analysis when selectedBankId changes
  useEffect(() => {
    if (!selectedBankId) return;

    const runAnalysis = async () => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const res = await intelligenceApi.previewShortageSurplus(selectedBankId);
        setAnalysis(res);
      } catch (err: any) {
        setError(err.message || 'Failed to run shortage & surplus analysis');
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [selectedBankId]);

  const selectedBank = bloodBanks.find((b) => b.blood_bank_id === selectedBankId);

  const filteredBanks = bloodBanks.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Federated Shortage & Surplus Surveillance
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Network-wide blood bank inventory adequacy analysis, deficit detection, and supply-risk classification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedBankId) {
                  setIsAnalyzing(true);
                  intelligenceApi
                    .previewShortageSurplus(selectedBankId)
                    .then(setAnalysis)
                    .catch((e) => setError(e.message))
                    .finally(() => setIsAnalyzing(false));
                }
              }}
              disabled={isAnalyzing || !selectedBankId}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-scan Facility
            </button>
            <Link
              to="/admin/redistribution-network"
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg shadow-sm transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Inter-Bank Redistribution
            </Link>
          </div>
        </div>

        {error && <ErrorState error={error} onRetry={() => setSelectedBankId(selectedBankId)} />}

        {/* Facility Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                Select Storage Facility
              </h2>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter blood banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {isLoadingBanks ? (
                <div className="py-8 text-center text-slate-500 text-xs">Loading facilities...</div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.blood_bank_id}
                      onClick={() => setSelectedBankId(bank.blood_bank_id)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                        selectedBankId === bank.blood_bank_id
                          ? 'bg-teal-950/40 border-teal-500/50 text-teal-200 font-medium'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-medium truncate">{bank.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                        <span>ID #{bank.blood_bank_id}</span>
                        <span>{bank.city || 'National Network'}</span>
                      </div>
                    </button>
                  ))}
                  {filteredBanks.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">No blood banks found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analysis View */}
          <div className="lg:col-span-3 space-y-6">
            {isAnalyzing ? (
              <LoadingState message={`Computing inventory dynamics for ${selectedBank?.name || 'facility'}...`} />
            ) : analysis ? (
              <>
                {/* Executive Summary Card */}
                {(() => {
                  const overallStatus = analysis.summary.has_critical_shortage
                    ? 'SHORTAGE'
                    : analysis.summary.shortage_groups_count > 0
                    ? 'SHORTAGE'
                    : analysis.summary.surplus_groups_count > 0
                    ? 'SURPLUS'
                    : 'BALANCED';

                  return (
                    <IntelligenceCard
                      title={`Adequacy Assessment: ${analysis.blood_bank_name || selectedBank?.name || `Bank #${selectedBankId}`}`}
                      engine="SHORTAGE & SURPLUS DETECTION ENGINE"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Overall Classification</span>
                          <div className="mt-1">
                            <StatusBadge status={overallStatus} />
                          </div>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Deficit Groups</span>
                          <span className="text-lg font-bold text-rose-400 mt-1 block">
                            {analysis.summary.shortage_groups_count}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Surplus Groups</span>
                          <span className="text-lg font-bold text-emerald-400 mt-1 block">
                            {analysis.summary.surplus_groups_count}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Usable Units</span>
                          <span className="text-lg font-bold text-slate-200 mt-1 block">
                            {analysis.summary.total_usable_units}
                          </span>
                        </div>
                      </div>

                      {analysis.summary.shortage_groups_count > 0 ? (
                        <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-lg flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-rose-300">Active Supply Deficit Alert</div>
                            <p className="text-xs text-rose-400/90 mt-0.5">
                              This facility has {analysis.summary.shortage_groups_count} blood group(s) below mandatory safety stock.
                              Initiate inter-bank transfers or trigger targeted donor mobilization.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-emerald-300">Adequate Stock Posture</div>
                            <p className="text-xs text-emerald-400/90 mt-0.5">
                              Inventory across major groups meets or exceeds clinical minimum thresholds.
                            </p>
                          </div>
                        </div>
                      )}
                    </IntelligenceCard>
                  );
                })()}

                {/* 8 Blood Groups Status Matrix */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Blood Group Breakdown (8 Groups)</span>
                    <span className="text-xs text-slate-500 font-normal">Real physical unit counts</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {analysis.stock_by_group.map((group) => {
                      const isShortage = group.status === 'SHORTAGE';
                      const isSurplus = group.status === 'SURPLUS';

                      return (
                        <div
                          key={group.group_name}
                          className={`p-4 rounded-xl border transition ${
                            isShortage
                              ? 'bg-rose-950/15 border-rose-800/40'
                              : isSurplus
                              ? 'bg-emerald-950/15 border-emerald-800/40'
                              : 'bg-slate-850 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <BloodGroupBadge group={group.group_name} size="md" />
                            <StatusBadge status={group.status} />
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Available Stock:</span>
                              <span className="font-semibold text-slate-200">{group.usable_units} units</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Min Safety Threshold:</span>
                              <span className="text-slate-300">{group.min_threshold} units</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Surplus Threshold:</span>
                              <span className="text-slate-300">{group.surplus_threshold} units</span>
                            </div>

                            {group.shortfall > 0 && (
                              <div className="flex justify-between text-rose-400 font-medium pt-1 border-t border-rose-900/40">
                                <span>Deficit Shortfall:</span>
                                <span>-{group.shortfall} units</span>
                              </div>
                            )}

                            {group.excess > 0 && (
                              <div className="flex justify-between text-emerald-400 font-medium pt-1 border-t border-emerald-900/40">
                                <span>Redistributable Excess:</span>
                                <span>+{group.excess} units</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coordinated Action Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Rebalance via Inter-Bank Transfer</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Run inter-bank routing engine to source deficit groups from surplus network nodes.
                      </p>
                    </div>
                    <Link
                      to="/admin/redistribution-network"
                      className="ml-4 shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Plan Transfer
                    </Link>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Mobilize Local Donors</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Rank and contact compatible active donors based on urgency and response profiles.
                      </p>
                    </div>
                    <Link
                      to="/admin/donor-intelligence"
                      className="ml-4 shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <Users className="w-4 h-4" />
                      Donor Engine
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                Select a blood bank on the left to inspect its live shortage and surplus dynamics.
              </div>
            )}
          </div>
        </div>
      </div>
    </AeroShell>
  );
};
