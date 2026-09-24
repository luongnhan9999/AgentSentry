import React from 'react';
import { X, Search, ExternalLink, Shield, Activity, AlertTriangle } from 'lucide-react';
import { getStatusLabel, getStatusColor, formatGen, truncateAddress } from '../utils/helpers';
import { contractAddress } from '../config/genlayer';

interface DiagnosticInspectorModalProps {
  policy: any;
  onClose: () => void;
}

const DiagnosticInspectorModal: React.FC<DiagnosticInspectorModalProps> = ({ policy, onClose }) => {
  if (!policy) return null;
  
  const verdict = policy.verdict || 'PENDING';
  const confidence = policy.confidence || 0;
  const severity = policy.outage_severity || 0;
  const reason = policy.reason || "No diagnostic info available.";

  const verdictBadge = verdict === 'INCIDENT_VERIFIED'
    ? 'bg-red-100 text-red-700 border-red-300'
    : verdict === 'ENDPOINT_HEALTHY'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
    : 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-card w-full max-w-3xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-gray-50">
          <h2 className="text-xl font-mono font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-600" /> AI Diagnostic Inspector
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Policy Identity */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono font-bold text-lg text-sky-600">{policy.policy_id}</h3>
              <a href={policy.target_endpoint_url} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-sky-500 flex items-center gap-1">
                {policy.target_endpoint_url} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className={`px-3 py-1.5 text-sm font-bold rounded-full border ${verdictBadge}`}>
              {verdict}
            </span>
          </div>

          {/* Verdict & Reason */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 font-bold uppercase tracking-wide">
              <Activity className="w-3 h-3" /> AI Diagnostic Rationale
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{reason}</p>
          </div>
          
          {/* Confidence & Severity Bars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500 font-bold">Confidence Score</p>
                <span className="font-mono font-bold text-sky-600">{confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-sky-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(confidence, 100)}%` }}></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500 font-bold">Outage Severity</p>
                <span className={`font-mono font-bold ${severity >= 70 ? 'text-red-600' : severity >= 30 ? 'text-yellow-600' : 'text-emerald-600'}`}>{severity}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${severity >= 70 ? 'bg-red-500' : severity >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(severity, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Policy Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(policy.status)}`}>
                {getStatusLabel(policy.status)}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Coverage</p>
              <p className="font-mono font-bold">{formatGen(policy.coverage_payout)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Consumer</p>
              <p className="font-mono text-xs">{truncateAddress(policy.insured_consumer)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Underwriter</p>
              <p className="font-mono text-xs">{truncateAddress(policy.underwriter_pool)}</p>
            </div>
          </div>

          {/* Schema Requirements */}
          <div className="border-t border-border pt-4">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
              <Shield className="w-4 h-4 text-sky-600" /> Schema / Invariant Requirements
            </h4>
            <pre className="text-xs font-mono bg-gray-100 p-3 rounded border border-gray-200 whitespace-pre-wrap">{policy.expected_schema}</pre>
          </div>

          {/* Block Info */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">Created Block</p>
              <p className="font-mono">{policy.created_at_block}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Expires Block</p>
              <p className="font-mono">{policy.expires_at_block}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Premium Paid</p>
              <p className="font-mono">{formatGen(policy.premium_paid)}</p>
            </div>
          </div>

          {/* Explorer Link */}
          <a 
            href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-sky-600 hover:underline bg-sky-50 p-3 rounded-lg border border-sky-200"
          >
            <ExternalLink className="w-4 h-4" /> View Contract on Explorer
          </a>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gray-50 flex justify-end">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded text-sm font-bold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticInspectorModal;
