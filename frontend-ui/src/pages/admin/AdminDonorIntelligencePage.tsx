import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { IntelligenceCard } from '../../components/common/IntelligenceCard';
import { RecommendationCard } from '../../components/common/RecommendationCard';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { intelligenceApi, bloodRequestsApi, bloodGroupsApi, donorsApi } from '../../api';
import type { DonorRankingPreviewResponse, BloodRequest, BloodGroup, Donor } from '../../types/api';
import {
  BrainCircuit,
  Search,
  Sparkles,
  Users,
  Award,
  ShieldAlert,
  Info,
  Filter,
} from 'lucide-react';

export const AdminDonorIntelligencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reqParam = searchParams.get('request_id');

  const [activeTab, setActiveTab] = useState<'RANKING' | 'REGISTRY'>('RANKING');
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [bloodGroups, setBloodGroups] = useState<Record<number, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<number>(reqParam ? Number(reqParam) : 1);
  const [topN, setTopN] = useState<number>(10);

  // Ranking Results
  const [previewData, setPreviewData] = useState<DonorRankingPreviewResponse | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  // Registry Browser
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoadingDonors, setIsLoadingDonors] = useState(false);
  const [donorSearch, setDonorSearch] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [reqs, groups] = await Promise.all([
          bloodRequestsApi.getAll({ limit: 50 }),
          bloodGroupsApi.getAll(),
        ]);
        setBloodRequests(reqs);

        const groupMap: Record<number, string> = {};
        groups.forEach((g: BloodGroup) => {
          groupMap[g.blood_group_id] = g.group_name;
        });
        setBloodGroups(groupMap);

        if (!reqParam && reqs.length > 0) {
          setSelectedRequestId(reqs[0].request_id);
        }
      } catch {
        // Tolerated
      }
    };
    loadInitData();
  }, [reqParam]);

  const runDonorRanking = async () => {
    setIsLoadingRanking(true);
    setRankingError(null);
    setPreviewData(null);
    try {
      const data = await intelligenceApi.previewDonorRanking({
        request_id: Number(selectedRequestId),
        top_n: Number(topN),
      });
      setPreviewData(data);
    } catch (err: any) {
      setRankingError(err.message || 'Adaptive donor ranking failed');
    } finally {
      setIsLoadingRanking(false);
    }
  };

  const loadDonors = async () => {
    setIsLoadingDonors(true);
    try {
      const list = await donorsApi.getAll({ limit: 100 });
      setDonors(list);
    } catch (err: any) {
      // Ignored
    } finally {
      setIsLoadingDonors(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REGISTRY' && donors.length === 0) {
      loadDonors();
    }
  }, [activeTab]);

  const selectedReq = bloodRequests.find((r) => r.request_id === selectedRequestId);

  const donorColumns: Column<Donor>[] = [
    {
      header: 'Donor ID',
      accessor: (item) => <span className="font-mono text-teal-400 font-semibold">#{item.donor_id}</span>,
    },
    {
      header: 'Full Name',
      accessor: (item) => (
        <div>
          <div className="font-medium text-slate-200">{item.full_name}</div>
          <div className="text-[11px] text-slate-400 font-mono">{item.phone}</div>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessor: (item) => (
        <BloodGroupBadge group={bloodGroups[item.blood_group_id] || `Group #${item.blood_group_id}`} size="sm" />
      ),
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Address / Location',
      accessor: (item) => <span className="text-slate-300 text-xs">{item.address || 'Registered Profile'}</span>,
    },
    {
      header: 'Action',
      accessor: (item) => (
        <button
          onClick={() => {
            setActiveTab('RANKING');
          }}
          className="text-xs text-teal-400 hover:text-teal-300 font-medium"
        >
          View Ranking
        </button>
      ),
    },
  ];

  const filteredDonors = donors.filter((d) => {
    const fullName = (d.full_name || '').toLowerCase();
    const matchesSearch = fullName.includes(donorSearch.toLowerCase()) || d.phone.includes(donorSearch);
    const groupName = bloodGroups[d.blood_group_id];
    const matchesGroup = selectedGroupFilter === 'ALL' || groupName === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                National Donor Intelligence & Dispatch
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Multi-factor adaptive ranking model evaluating clinical match, eligibility recency, and response likelihood
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('RANKING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'RANKING'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Adaptive Ranking
            </button>
            <button
              onClick={() => setActiveTab('REGISTRY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'REGISTRY'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Donor Registry ({donors.length > 0 ? donors.length : '10,000+'})
            </button>
          </div>
        </div>

        {activeTab === 'RANKING' ? (
          <>
            {/* Parameters Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-400" />
                Target Hospital Requisition
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Select Requisition <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {bloodRequests.map((r) => (
                      <option key={r.request_id} value={r.request_id}>
                        Req #{r.request_id} - {bloodGroups[r.blood_group_id] || `Group #${r.blood_group_id}`} - {r.quantity_required} units ({r.priority})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Manual Request ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Top Candidates (N)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {selectedReq && (
                <div className="mt-4 p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Target Group:</span>
                    <BloodGroupBadge group={bloodGroups[selectedReq.blood_group_id] || `ID ${selectedReq.blood_group_id}`} size="sm" />
                    <span className="text-slate-400 ml-2">Units:</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedReq.quantity_required}</span>
                    <span className="text-slate-400 ml-2">Urgency:</span>
                    <StatusBadge status={selectedReq.priority} />
                  </div>
                  <div className="text-slate-400">
                    Hospital #{selectedReq.hospital_id} &bull; Ref: <span className="font-mono text-slate-300">{selectedReq.patient_reference || 'N/A'}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={runDonorRanking}
                  disabled={isLoadingRanking || !selectedRequestId}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingRanking ? 'Evaluating Donor Pool...' : 'Run Adaptive Donor Ranking'}
                </button>
              </div>
            </div>

            {rankingError && <ErrorState error={rankingError} onRetry={runDonorRanking} />}

            {/* Results */}
            {isLoadingRanking ? (
              <LoadingState message="Ranking compatible donors across network based on availability, recency, and response profile..." />
            ) : previewData ? (
              <div className="space-y-6">
                <IntelligenceCard
                  title={`Donor Ranking Intelligence for Requisition #${previewData.request_id}`}
                  engine="ADAPTIVE DONOR RANKING ENGINE"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Ranked Donors</span>
                      <span className="text-xl font-bold text-teal-400 mt-1 block">
                        {previewData.recommendations.length}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Target Blood Group</span>
                      <div className="mt-1">
                        <BloodGroupBadge group={previewData.required_blood_group} size="sm" />
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Urgency Weight</span>
                      <span className="text-xl font-bold text-amber-400 mt-1 block">
                        {previewData.priority}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Evaluation Pool</span>
                      <span className="text-xl font-bold text-slate-300 mt-1 block">
                        {previewData.donors_found}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>PREVIEW MODE — DECISION SUPPORT ONLY:</strong> Scores are computed purely in memory using the
                      multi-factor clinical model. Contacting donors requires active clinician mobilization protocols.
                    </span>
                  </div>
                </IntelligenceCard>

                {/* Ranked Donors Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Ranked Candidates ({previewData.recommendations.length})</span>
                    <span className="text-xs text-slate-500 font-normal">Ranked by Composite Score</span>
                  </h3>

                  {previewData.recommendations.map((candidate) => (
                    <RecommendationCard
                      key={candidate.donor_id}
                      item={candidate}
                      priority={previewData.priority}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                Select a target requisition above and click <strong>Run Adaptive Donor Ranking</strong> to identify and score the most suitable candidate donors.
              </div>
            )}
          </>
        ) : (
          /* REGISTRY TAB */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Network Donor Registry Directory
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name or phone..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-56"
                  />
                </div>

                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Blood Groups</option>
                  {Object.values(bloodGroups).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingDonors ? (
              <LoadingState message="Loading registered donors from national database..." />
            ) : (
              <DataTable
                columns={donorColumns}
                data={filteredDonors}
                keyExtractor={(item) => item.donor_id}
                emptyMessage="No registered donors matching filters."
              />
            )}
          </div>
        )}
      </div>
    </AeroShell>
  );
};
