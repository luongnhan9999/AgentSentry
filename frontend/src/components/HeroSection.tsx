import React from 'react';
import { ShieldCheck, Cpu, Activity, Zap, ExternalLink, ArrowRight, Layers, FileCode } from 'lucide-react';
import { contractAddress } from '../config/genlayer';

interface HeroSectionProps {
  onNewPolicy: () => void;
  onOpenSandbox: () => void;
  onSelectRole: (role: string) => void;
  activeRole: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNewPolicy, onOpenSandbox, onSelectRole, activeRole }) => {
  return (
    <div className="mb-10 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-700/60 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 border border-sky-400/30 rounded-full text-xs font-mono text-sky-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GENLAYER STUDIONET PROTOCOL • CHAIN 61999
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-600/50 rounded-full text-xs font-mono text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            AI Consensus Adjudication
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-600/50 rounded-full text-xs font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Oracle On-Chain Probing
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-mono text-white leading-tight">
            Autonomous AI Agent SLA & <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              API Uptime Insurance Court
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-300 leading-relaxed font-sans">
            Autonomous AI trading bots, customer pipelines, and agents rely on mission-critical APIs. 
            When endpoints suffer outages or silent degradation, <strong>AgentSentry</strong> triggers decentralized AI jury probes on GenLayer to verify downtime directly on-chain and disburse instant indemnity payouts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button 
            onClick={onNewPolicy}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 hover:scale-[1.02] text-sm md:text-base"
          >
            <Zap className="w-4 h-4" /> Purchase SLA Policy
          </button>
          <button 
            onClick={onOpenSandbox}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-medium rounded-xl border border-slate-600 transition-all text-sm hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-sky-400" /> Test Probe Sandbox
          </button>
          <a 
            href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-3 text-slate-400 hover:text-white font-mono text-xs transition-colors"
          >
            Contract on Explorer <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Step-by-Step Telemetry Flow Ribbon */}
        <div className="mt-10 pt-6 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold mb-1">
              <span>01</span> • UNDERWRITE ESCROW
            </div>
            <p className="text-xs text-slate-300">Lock coverage escrow pool with required schema invariants and endpoint target.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 font-bold mb-1">
              <span>02</span> • INCIDENT CLAIM
            </div>
            <p className="text-xs text-slate-300">Consumer stakes 5% anti-spam deposit to flag downtime or schema violation.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-1">
              <span>03</span> • ON-CHAIN PROBE
            </div>
            <p className="text-xs text-slate-300">GenLayer validators fetch live response via <code className="text-emerald-300">gl.nondet.web.render</code> without oracles.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold mb-1">
              <span>04</span> • CONSENSUS SETTLEMENT
            </div>
            <p className="text-xs text-slate-300">AI Jury reaches optimistic democratic consensus. Verified outage triggers immediate compensation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
