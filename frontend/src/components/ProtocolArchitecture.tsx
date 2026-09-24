import React from 'react';
import { Cpu, ShieldCheck, Zap, Scale, Terminal, ArrowRight, Layers, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { contractAddress } from '../config/genlayer';

const ProtocolArchitecture: React.FC = () => {
  return (
    <div className="mt-16 pt-10 border-t border-slate-200">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-mono font-bold mb-3">
          <Layers className="w-3.5 h-3.5" /> ARCHITECTURAL DIFFERENTIATION
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900">
          Why AgentSentry Is Impossible on Solidity
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-sans">
          Decentralized API uptime insurance requires subjective judgment and direct internet access at the consensus layer.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Solidity Box */}
        <div className="bg-red-50/40 border border-red-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-700 font-mono font-bold text-sm mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>TRADITIONAL SOLIDITY / EVM LIMITATIONS</span>
          </div>
          <ul className="space-y-3.5 text-xs text-slate-700 font-sans">
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Cannot ping endpoints:</strong> EVM has zero native internet connectivity and cannot check if an API is alive.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Centralized Oracle Vulnerability:</strong> Oracles like Chainlink only relay numeric price feeds; they cannot evaluate arbitrary payload JSON schemas or microservice health.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Blind to Silent Degradation:</strong> If a server returns 200 OK with empty arrays or garbage tokens, EVM cannot parse or judge semantic correctness.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Manual Settlement Delay:</strong> Traditional insurer claims take 3-6 weeks with endless manual paperwork and disputes.</span>
            </li>
          </ul>
        </div>

        {/* GenLayer Box */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-mono font-bold text-sm mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>GENLAYER INTELLIGENT CONTRACT ADVANTAGE</span>
          </div>
          <ul className="space-y-3.5 text-xs text-slate-700 font-sans">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Native On-Chain Web Probe:</strong> <code className="bg-emerald-100/60 px-1 py-0.5 rounded text-emerald-900 font-mono">gl.nondet.web.render</code> directly fetches target API responses during consensus without third-party oracles.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>LLM Juror Quality Assessment:</strong> <code className="bg-emerald-100/60 px-1 py-0.5 rounded text-emerald-900 font-mono">gl.nondet.exec_prompt</code> evaluates response payload invariants, schema drift, and error codes.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Optimistic Democracy Consensus:</strong> <code className="bg-emerald-100/60 px-1 py-0.5 rounded text-emerald-900 font-mono">gl.vm.run_nondet</code> compares semantic verdicts (<code className="text-emerald-900 font-mono">mine["verdict"] == leader["verdict"]</code>) ignoring natural LLM wording variance.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Instant Automated Indemnity:</strong> Validated incidents trigger immediate escrow disbursement to the consumer in the exact same transaction block.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Protocol Architecture Code Snippet Showcase */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 md:p-8 font-mono text-xs shadow-xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-white text-sm">Semantic Consensus Pipeline (contracts/contract.py)</span>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-800 text-sky-400 rounded text-[11px] border border-slate-700">
            GenVM Optimistic Democracy
          </span>
        </div>

        <pre className="overflow-x-auto text-[11px] md:text-xs text-slate-300 leading-relaxed">
{`# 1. On-Chain Leader Probe & Diagnostic Inference
def leader_fn():
    # Direct live HTTP fetch via GenLayer consensus layer (Zero Oracle)
    raw_probe = gl.nondet.web.render(endpoint_url, mode="text")
    
    # LLM Juror diagnostic audit on live payload vs schema invariants
    diagnostic_json = gl.nondet.exec_prompt(prompt, response_format="json")
    return {"verdict": diagnostic_json["verdict"], "confidence": ..., "reason": ...}

# 2. Semantic Validator Consensus (Comparing VERDICT only, tolerating LLM phrasing differences)
def validator_fn(leader_res) -> bool:
    if not isinstance(leader_res, gl.vm.Return):
        return False
    # ✅ SEMANTIC EQUIVALENCE: Check if independent probe reached same verdict
    return leader_fn()["verdict"] == leader_res.calldata["verdict"]

# 3. Finalize on GenLayer studionet
result = gl.vm.run_nondet(leader_fn, validator_fn)
if result["verdict"] == "INCIDENT_VERIFIED":
    gl.get_contract_at(insured_consumer).emit_transfer(value=u256(coverage + deposit))`}
        </pre>
      </div>
    </div>
  );
};

export default ProtocolArchitecture;
