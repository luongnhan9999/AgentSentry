import React from 'react';
import { Scale, Cpu, CheckCircle2, AlertOctagon, ShieldAlert, Layers, Clock } from 'lucide-react';

interface JuryQuorumVisualizerProps {
  pendingCount: number;
}

const VALIDATOR_ROLES = [
  { id: "VALIDATOR-LEADER", role: "Consensus Leader", desc: "Executes gl.nondet.web.render & initial inference" },
  { id: "VALIDATOR-02", role: "Independent Juror", desc: "Runs parallel probe & semantic comparison" },
  { id: "VALIDATOR-03", role: "Independent Juror", desc: "Runs parallel probe & semantic comparison" },
  { id: "VALIDATOR-04", role: "Independent Juror", desc: "Runs parallel probe & semantic comparison" },
  { id: "VALIDATOR-05", role: "Independent Juror", desc: "Runs parallel probe & semantic comparison" },
];

const JuryQuorumVisualizer: React.FC<JuryQuorumVisualizerProps> = ({ pendingCount }) => {
  const isTriageActive = pendingCount > 0;

  return (
    <div className="bg-[#090D16] border border-slate-800 rounded-2xl p-6 mb-8 text-white font-mono shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Optimistic Democracy Adjudication Architecture</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                isTriageActive 
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {isTriageActive ? `${pendingCount} Claim(s) Awaiting Probe` : 'Standing By'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Decentralized GenLayer AI jury conducting on-chain diagnostics without oracle trust assumptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">QUORUM THRESHOLD:</span>
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg font-bold">
            66.7% SUPERMAJORITY
          </span>
        </div>
      </div>

      {/* 5 Juror Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {VALIDATOR_ROLES.map((node, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded-xl border transition-all ${
              idx === 0 
                ? 'bg-sky-950/40 border-sky-500/40 shadow-sm shadow-sky-500/10' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
              <span className="font-bold text-slate-300">{node.id}</span>
              {idx === 0 && <span className="text-sky-400 font-bold uppercase">PROBE LEADER</span>}
            </div>

            <div className="text-xs font-bold text-white truncate mb-1">
              {node.role}
            </div>
            <div className="text-[10px] text-slate-400 mb-3 leading-tight">
              {node.desc}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
              <span className="text-slate-500">Status:</span>
              <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded border ${
                isTriageActive 
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isTriageActive ? 'EVALUATING' : 'READY'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Consensus Verification Explanation */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Semantic Equivalence Rule (contracts/contract.py)</span>
          </span>
          <span className="text-sky-400 font-mono text-[11px]">gl.vm.run_nondet()</span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          When an incident claim is triggered via <code className="text-slate-200">adjudicate_incident()</code>, GenLayer validators independently probe the live endpoint on-chain and compare <code className="text-slate-200">mine["verdict"] == leader["verdict"]</code>. If verdicts match, consensus finalizes and funds settle on studionet.
        </p>
      </div>
    </div>
  );
};

export default JuryQuorumVisualizer;
