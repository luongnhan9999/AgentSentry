import React from 'react';
import { ShieldCheck, Cpu, Activity, Zap, ExternalLink, ArrowRight, Layers, Radio, Terminal } from 'lucide-react';
import { contractAddress } from '../config/genlayer';

interface HeroSectionProps {
  onNewPolicy: () => void;
  onOpenSandbox: () => void;
  onSelectRole: (role: string) => void;
  activeRole: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNewPolicy, onOpenSandbox, onSelectRole, activeRole }) => {
  return (
    <div className="mb-10 bg-[#090D16] text-white rounded-2xl p-8 md:p-10 shadow-2xl border border-slate-800 relative overflow-hidden dark-telemetry-grid">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Engineering Coordinate Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-white font-bold tracking-wider">GENLAYER SYNTHETIC JURISDICTION</span>
          <span className="text-slate-600">//</span>
          <span className="text-sky-400">STUDIONET-01 [0xF1EF]</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>CONSENSUS: <strong className="text-slate-200">OPTIMISTIC DEMOCRACY</strong></span>
          <span className="text-slate-700">•</span>
          <span>ORACLE DEPENDENCY: <strong className="text-emerald-400">0% (NATIVE GENVM)</strong></span>
        </div>
      </div>

      <div className="relative z-10">
        {/* Main Title & Subtitle */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/15 border border-sky-400/30 rounded-full text-xs font-mono text-sky-300 mb-4">
            <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
            <span>AUTONOMOUS API SLA & DEGRADATION COURT</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-mono text-white leading-tight">
            Decentralized Uptime & <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Degradation Insurance
            </span>
          </h1>
          <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed font-sans max-w-2xl">
            Thousands of autonomous trading agents, data pipelines, and bots depend on 24/7 APIs.
            When an endpoint crashes or silently degrades, GenLayer's AI Jury conducts direct on-chain probes via <code className="text-sky-300 font-mono">gl.nondet.web.render</code> and adjudicates instant financial indemnity payouts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button 
            onClick={onNewPolicy}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 hover:scale-[1.02] text-xs sm:text-sm"
          >
            <Zap className="w-4 h-4 fill-current" /> Lock Coverage Escrow
          </button>
          <button 
            onClick={onOpenSandbox}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800/90 hover:bg-slate-700 text-white font-mono font-medium rounded-xl border border-slate-700 transition-all text-xs sm:text-sm hover:scale-[1.02]"
          >
            <Terminal className="w-4 h-4 text-sky-400" /> Interactive Probe Sandbox
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
        <div className="mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-mono">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-bold mb-1">
              <span>01</span> • UNDERWRITE ESCROW
            </div>
            <p className="text-xs text-slate-400 font-sans">Underwriters lock coverage capital with payload schema invariants.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-mono">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-1">
              <span>02</span> • INCIDENT CLAIM
            </div>
            <p className="text-xs text-slate-400 font-sans">Consumer stakes 5% anti-spam deposit to flag downtime or schema violation.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-mono">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-1">
              <span>03</span> • ON-CHAIN PROBE
            </div>
            <p className="text-xs text-slate-400 font-sans">Validators probe live URL on-chain via <code className="text-emerald-300">gl.nondet.web.render</code>.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-mono">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
              <span>04</span> • CONSENSUS SETTLEMENT
            </div>
            <p className="text-xs text-slate-400 font-sans">AI Jury compares semantic verdicts. Outage triggers instant indemnity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
