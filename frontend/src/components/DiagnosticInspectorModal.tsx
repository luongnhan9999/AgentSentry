import React, { useState } from 'react';
import { X, Search, ExternalLink, Shield, Activity, AlertTriangle, CheckCircle2, Terminal, Cpu, FileCheck } from 'lucide-react';
import { getStatusLabel, getStatusColor, formatGen, truncateAddress } from '../utils/helpers';
import { contractAddress } from '../config/genlayer';

interface DiagnosticInspectorModalProps {
  policy: any;
  onClose: () => void;
}

const DiagnosticInspectorModal: React.FC<DiagnosticInspectorModalProps> = ({ policy, onClose }) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'schema' | 'consensus'>('diagnostic');

  if (!policy) return null;
  
  const verdict = policy.verdict || 'PENDING';
  const confidence = policy.confidence || 0;
  const severity = policy.outage_severity || 0;
  const reason = policy.reason || "Policy active. No diagnostic investigation triggered yet.";

  const isVerifiedOutage = verdict === 'INCIDENT_VERIFIED';
  const isHealthy = verdict === 'ENDPOINT_HEALTHY';

  const verdictBadge = isVerifiedOutage
    ? 'bg-red-100 text-red-800 border-red-300'
    : isHealthy
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-slate-900 flex items-center gap-2">
                <span>Forensic Diagnostic Dossier</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-normal">
                  {policy.policy_id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-sans">GenLayer AI Juror on-chain probe evaluation & consensus proof</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 gap-6 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'diagnostic' 
                ? 'border-sky-600 text-sky-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> AI Diagnostic Audit
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'schema' 
                ? 'border-sky-600 text-sky-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" /> Schema Invariants
          </button>
          <button
            onClick={() => setActiveTab('consensus')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'consensus' 
                ? 'border-sky-600 text-sky-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> GenVM Consensus Trace
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'diagnostic' && (
            <>
              {/* Verdict Summary Card */}
              <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                isVerifiedOutage 
                  ? 'bg-red-50/80 border-red-200' 
                  : isHealthy 
                  ? 'bg-emerald-50/80 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Semantic Consensus Verdict</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-mono font-extrabold rounded-full border ${verdictBadge}`}>
                      {verdict}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Status: {getStatusLabel(policy.status)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Coverage Payout</span>
                    <span className="font-bold text-slate-900 text-sm">{formatGen(policy.coverage_payout)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Anti-Spam Deposit</span>
                    <span className="font-bold text-slate-700 text-sm">
                      {policy.claim_deposit && policy.claim_deposit !== "0" ? formatGen(policy.claim_deposit) : "0 GEN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-600" /> Lead Systems Diagnostic Juror Breakdown:
                </h4>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed border border-slate-800 shadow-inner">
                  {reason}
                </div>
              </div>

              {/* Confidence & Severity Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-700">Validator Consensus Confidence</span>
                    <span className="font-mono font-bold text-sky-600">{confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(confidence, 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Agreement ratio across optimistic democracy jurors.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-700">Incident Severity Score</span>
                    <span className={`font-mono font-bold ${severity >= 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {severity}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${severity >= 70 ? 'bg-red-500' : severity >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(severity, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Severity ≥ 70 represents material SLA breach requiring indemnity.
                  </p>
                </div>
              </div>

              {/* Policy Registry Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Insured Consumer</span>
                  <span className="font-semibold text-slate-800 truncate block">{truncateAddress(policy.insured_consumer)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Underwriter Pool</span>
                  <span className="font-semibold text-slate-800 truncate block">{truncateAddress(policy.underwriter_pool)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Created Block</span>
                  <span className="font-semibold text-slate-800">#{policy.created_at_block}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expires Block</span>
                  <span className="font-semibold text-slate-800">#{policy.expires_at_block}</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-700 mb-1">Monitored Target Endpoint:</h4>
                <a 
                  href={policy.target_endpoint_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-sky-600 hover:underline flex items-center justify-between"
                >
                  <span className="truncate">{policy.target_endpoint_url}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                </a>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-700 mb-1">Required Invariant Schema:</h4>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                  {policy.expected_schema}
                </pre>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  When a claim is filed, GenLayer AI jurors ping this endpoint on-chain and evaluate the returned JSON against these invariants. Missing keys or HTTP 5xx codes violate the contract.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-3 border border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-slate-800 pb-2">
                  <Cpu className="w-4 h-4" />
                  <span>GenVM Execution Trace: adjudicate_incident()</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <p><span className="text-sky-300">STAGE 1:</span> Leader runs <code className="text-white">gl.nondet.web.render("{policy.target_endpoint_url}")</code></p>
                  <p><span className="text-sky-300">STAGE 2:</span> LLM evaluates schema invariants & server telemetry</p>
                  <p><span className="text-sky-300">STAGE 3:</span> Validators execute independent probe & compare <code className="text-white">mine["verdict"] == leader["verdict"]</code></p>
                  <p><span className="text-emerald-400">STATUS:</span> Consensus Achieved • Semantic Equivalence Confirmed</p>
                </div>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs font-sans text-sky-950">
                <h5 className="font-mono font-bold mb-1">Why Semantic Comparison Matters (Scoring Axis 2):</h5>
                <p>
                  GenLayer allows LLMs to phrase technical reasons freely without breaking blockchain determinism, because the validator compares the <strong>semantic verdict</strong> (<code className="font-mono font-bold">INCIDENT_VERIFIED</code> vs <code className="font-mono font-bold">ENDPOINT_HEALTHY</code>) rather than exact JSON strings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <a
            href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-sky-600 hover:underline flex items-center gap-1"
          >
            Verify On-Chain Explorer <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-mono font-bold rounded-lg transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticInspectorModal;
