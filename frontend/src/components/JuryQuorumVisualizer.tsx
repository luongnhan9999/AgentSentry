import React from 'react';
import { Scale, Cpu, CheckCircle2, AlertOctagon, ShieldAlert, Layers } from 'lucide-react';

interface JuryQuorumVisualizerProps {
  pendingCount: number;
}

const JUROR_NODES = [
  { id: "GL-NODE-LEADER", model: "Llama-3.3-70B-Instruct", role: "Consensus Leader", vote: "INCIDENT_VERIFIED", status: "VALIDATED" },
  { id: "GL-NODE-02", model: "DeepSeek-V3", role: "Validator Juror", vote: "INCIDENT_VERIFIED", status: "VALIDATED" },
  { id: "GL-NODE-03", model: "Mistral-Large-2", role: "Validator Juror", vote: "INCIDENT_VERIFIED", status: "VALIDATED" },
  { id: "GL-NODE-04", model: "Qwen-2.5-72B", role: "Validator Juror", vote: "INCIDENT_VERIFIED", status: "VALIDATED" },
  { id: "GL-NODE-05", model: "Phi-4", role: "Validator Juror", vote: "INCIDENT_VERIFIED", status: "VALIDATED" },
];

const JuryQuorumVisualizer: React.FC<JuryQuorumVisualizerProps> = ({ pendingCount }) => {
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
              <span>Optimistic Democracy Chamber</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                5 AI Jurors
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Decentralized multi-LLM jury conducting on-chain diagnostics without oracle trust assumptions
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
        {JUROR_NODES.map((node, idx) => (
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
              {node.model}
            </div>
            <div className="text-[10px] text-slate-400 mb-3">
              {node.role}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
              <span className="text-slate-500">Vote:</span>
              <span className="text-red-400 font-bold text-[10px] bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">
                OUTAGE
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quorum Progress Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Semantic Agreement Consensus (5 / 5 Validators Confirmed)</span>
          </span>
          <span className="text-emerald-400 font-bold">100% UNANIMOUS</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full w-full"></div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-sans">
          Validators reach consensus by checking <code className="text-slate-300">mine["verdict"] == leader["verdict"]</code> on GenLayer studionet.
        </p>
      </div>
    </div>
  );
};

export default JuryQuorumVisualizer;
