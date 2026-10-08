import React from 'react';
import { Link } from 'react-router-dom';
import { APIStatusIndicator } from '../components/common/APIStatusIndicator';
import {
  Building,
  Shield,
  Network,
  ArrowRight,
  Activity,
  Radar,
  BrainCircuit,
  HeartPulse,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col justify-between selection:bg-rose-500/30 selection:text-white">
      {/* Top Brand Bar */}
      <header className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white font-black text-base shadow-md">
            A
          </div>
          <div>
            <div className="text-white font-extrabold tracking-tight text-lg leading-none">
              AERO<span className="text-rose-500">-BLOOD</span>
            </div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mt-0.5">
              Clinical Emergency Network
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <APIStatusIndicator />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-8 backdrop-blur-xs">
          <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>AUTONOMOUS CLINICAL DECISION SUPPORT</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
          AERO<span className="text-rose-500">-BLOOD</span>
        </h1>

        {/* Exact Tagline */}
        <p className="mt-4 text-xs md:text-sm font-bold uppercase tracking-widest text-teal-400 max-w-2xl">
          ADAPTIVE EMERGENCY REDISTRIBUTION & OPTIMIZATION FOR BLOOD SYSTEMS
        </p>

        {/* Philosophy */}
        <div className="mt-8 flex items-center justify-center gap-3 md:gap-6 text-xs md:text-sm font-mono tracking-wider text-slate-300 bg-slate-900/60 border border-slate-800/80 px-6 py-2.5 rounded-full">
          <span className="flex items-center gap-1.5 text-teal-400 font-bold">
            <Radar className="w-4 h-4" />
            DETECT
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1.5 text-blue-400 font-bold">
            <BrainCircuit className="w-4 h-4" />
            DECIDE
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Activity className="w-4 h-4" />
            RESPOND
          </span>
        </div>

        {/* Primary CTA Button */}
        <div className="mt-10">
          <a
            href="#portals"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-rose-950/50 transition-all hover:scale-102 cursor-pointer"
          >
            <span>ENTER AERO-BLOOD</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Subtle Visual Network Graph */}
        <div className="mt-14 w-full max-w-3xl border border-slate-800/80 rounded-2xl p-6 bg-slate-900/30 backdrop-blur-xs flex items-center justify-around text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-200">1,348 Hospitals Connected</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-200">2,823 Regional Blood Banks</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="font-semibold text-slate-200">Multi-Facility AI Redistribution</span>
          </div>
        </div>

        {/* 3 Portal Selectors */}
        <div id="portals" className="mt-16 w-full pt-10 border-t border-slate-800/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            SELECT DEMO OPERATIONAL PORTAL
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Hospital Portal */}
            <Link
              to="/hospital"
              className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/90 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  HOSPITAL
                </h3>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mt-0.5">
                  Request & Receive
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Manage patient blood requisitions, trigger rapid emergency workflows, and inspect allocation candidate availability in real time.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Hospital Desk</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Blood Bank Portal */}
            <Link
              to="/bloodbank"
              className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-rose-500/60 hover:bg-slate-900/90 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                  BLOOD BANK
                </h3>
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mt-0.5">
                  Manage & Respond
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Operational command center for physical blood unit inventory, expiry radar, quarantine execution, shortage/surplus, and donor intelligence.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Admin Portal */}
            <Link
              to="/admin"
              className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-900/90 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                  NETWORK ADMIN
                </h3>
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mt-0.5">
                  Monitor & Optimize
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Strategic oversight across all 2,823 blood banks, emergency demand patterns, inter-bank transfers, and live system health diagnostics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Network Admin</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          AERO-BLOOD Emergency Platform · FastAPI Backend Authority · MySQL 8.4
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          DETECT → DECIDE → RESPOND
        </div>
      </footer>
    </div>
  );
};
