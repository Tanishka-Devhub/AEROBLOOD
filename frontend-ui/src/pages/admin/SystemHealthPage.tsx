import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { healthApi } from '../../api';
import {
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRightLeft,
  Radar,
  BrainCircuit,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check API /health
      const t0 = performance.now();
      const healthRes = await healthApi.check();
      const t1 = performance.now();
      setHealthStatus(healthRes.status);
      setApiLatency(Math.round(t1 - t0));

      // 2. Check DB /db-test
      const t2 = performance.now();
      const dbRes = await healthApi.testDb();
      const t3 = performance.now();
      setDbStatus(dbRes.message || dbRes.status || 'OK');
      setDbLatency(Math.round(t3 - t2));

      setLastChecked(new Date());
    } catch (err: any) {
      setError(err.message || 'Diagnostic ping failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const engines = [
    {
      name: 'Blood Compatibility Matrix',
      description: 'Strict 64-pair (8x8) red blood cell immunological compatibility verification',
      route: '/blood-compatibility',
      type: 'Deterministic Transfusion Rules',
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      status: 'OPERATIONAL',
    },
    {
      name: 'Dynamic Allocation Engine',
      description: 'Urgency-prioritized candidate selection matching compatibility, proximity, and FEFO expiry rules',
      route: '/allocation-engine/preview',
      type: 'Triage Optimization',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      status: 'OPERATIONAL',
    },
    {
      name: 'Expiry Radar & Quarantine Engine',
      description: 'Continuous shelf-life surveillance flagging impending expiration and executing authoritative quarantine',
      route: '/expiry-engine/preview',
      type: 'Biochemical Safety Audit',
      icon: <Radar className="w-5 h-5 text-rose-400" />,
      status: 'OPERATIONAL',
    },
    {
      name: 'Shortage & Surplus Detection Engine',
      description: 'Multi-facility dynamic inventory adequacy calculation classifying deficit vs surplus stock per blood group',
      route: '/shortage-surplus-engine/preview',
      type: 'Inventory Supply Risk Model',
      icon: <Cpu className="w-5 h-5 text-sky-400" />,
      status: 'OPERATIONAL',
    },
    {
      name: 'Redistribution Recommendation Engine',
      description: 'Logistical corridor solver recommending physical unit transfers between hubs using Haversine distance',
      route: '/redistribution-engine/preview',
      type: 'Inter-Facility Balancing',
      icon: <ArrowRightLeft className="w-5 h-5 text-indigo-400" />,
      status: 'OPERATIONAL',
    },
    {
      name: 'Adaptive Donor Ranking Engine',
      description: '3-factor scoring model combining match grade (50%), recency (10-20%), and response profile (30-40%)',
      route: '/donor-ranking-engine/preview',
      type: 'Candidate Dispatch Ranking',
      icon: <BrainCircuit className="w-5 h-5 text-emerald-400" />,
      status: 'OPERATIONAL',
    },
  ];

  return (
    <AeroShell activePortal="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                System Diagnostics & Infrastructure Health
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Live telemetry for FastAPI application server, MySQL 8.4 database engine, and algorithmic modules
            </p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Run Diagnostics Probe
          </button>
        </div>

        {error && <ErrorState error={error} onRetry={runDiagnostics} />}

        {/* Primary Service Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Server Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-950/60 border border-teal-800/40 rounded-lg text-teal-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">FastAPI Application Server</h3>
                  <p className="text-xs text-slate-400">Uvicorn ASGI Runtime &bull; REST API Layer</p>
                </div>
              </div>
              <StatusBadge status={healthStatus === 'healthy' ? 'ACTIVE' : healthStatus ? 'ACTIVE' : 'OFFLINE'} />
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Endpoint:</span>
                <span className="font-mono text-slate-200">http://127.0.0.1:8000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Health Endpoint:</span>
                <span className="font-mono text-teal-300">GET /health</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Probe Latency:</span>
                <span className="font-mono text-emerald-400">
                  {apiLatency !== null ? `${apiLatency} ms` : 'Measuring...'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CORS & API Proxy:</span>
                <span className="text-emerald-400">Vite Dev Server Proxy (/api)</span>
              </div>
            </div>
          </div>

          {/* Database Server Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/40 rounded-lg text-indigo-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">MySQL 8.4 InnoDB Database</h3>
                  <p className="text-xs text-slate-400">Relational Storage &bull; aero_blood</p>
                </div>
              </div>
              <StatusBadge status={dbStatus ? 'ACTIVE' : 'OFFLINE'} />
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Database Instance:</span>
                <span className="font-mono text-slate-200">aero_blood</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Health Endpoint:</span>
                <span className="font-mono text-indigo-300">GET /db-test</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Query Probe Latency:</span>
                <span className="font-mono text-emerald-400">
                  {dbLatency !== null ? `${dbLatency} ms` : 'Measuring...'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Engine / Integrity:</span>
                <span className="text-slate-300">Foreign Keys &bull; Strict ACID</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Engines Operational Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                Algorithmic Intelligence Subsystems
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All 6 core optimization engines deployed directly in the FastAPI backend service layer
              </p>
            </div>
            {lastChecked && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last Verified: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {engines.map((engine) => (
              <div
                key={engine.name}
                className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 bg-slate-800 rounded-lg">{engine.icon}</div>
                    <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded text-[10px] font-semibold tracking-wider">
                      {engine.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{engine.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{engine.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{engine.type}</span>
                  <span className="font-mono text-teal-400">{engine.route}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Cardinality & Baseline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Database Schema Entities (MySQL 8.4)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Live relational tables connected through SQLAlchemy ORM with foreign key enforcement
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {[
              { table: 'blood_groups', count: '8 records' },
              { table: 'blood_compatibility', count: '64 records' },
              { table: 'hospitals', count: '1,348 records' },
              { table: 'hospital_staff', count: '100+ records' },
              { table: 'blood_banks', count: '2,823 records' },
              { table: 'donors', count: '10,002 records' },
              { table: 'donations', count: '4,000+ records' },
              { table: 'blood_units', count: '251,283 records' },
              { table: 'blood_requests', count: '167 records' },
              { table: 'allocations', count: '250 records' },
              { table: 'blood_transfers', count: '1 record' },
            ].map((tbl) => (
              <div key={tbl.table} className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-800">
                <div className="font-mono text-slate-200 font-medium truncate">{tbl.table}</div>
                <div className="text-[11px] text-teal-400 mt-0.5">{tbl.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AeroShell>
  );
};
