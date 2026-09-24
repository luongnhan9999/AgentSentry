import React from 'react';
import { getStatusLabel, getStatusColor, formatGen, truncateAddress } from '../utils/helpers';
import { ExternalLink, Search, ShieldAlert, CheckCircle, Clock, Activity, AlertTriangle, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { getGenLayerClient, contractAddress } from '../config/genlayer';

interface PolicyCardProps {
  policy: any;
  onInspect: (policy: any) => void;
  onFileClaim: (policyId: string, coverage: string) => void;
  onRefresh: () => void;
  userAddress?: string | null;
  activeRole?: string;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ 
  policy, 
  onInspect, 
  onFileClaim, 
  onRefresh,
  userAddress,
  activeRole = 'all'
}) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  
  const handleAction = async (action: 'adjudicate' | 'reclaim') => {
    try {
      setLoadingAction(action);
      if (!window.ethereum) throw new Error("MetaMask not found. Please install MetaMask.");
      const client = getGenLayerClient();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: action === 'adjudicate' ? 'adjudicate_incident' : 'reclaim_expired_coverage',
        args: [policy.policy_id],
        account: from,
        value: BigInt(0),
      });

      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Action failed. Check console.");
    } finally {
      setLoadingAction(null);
    }
  };

  const isInsuredConsumer = userAddress && policy.insured_consumer && 
    userAddress.toLowerCase() === policy.insured_consumer.toLowerCase();

  const isUnderwriter = userAddress && policy.underwriter_pool && 
    userAddress.toLowerCase() === policy.underwriter_pool.toLowerCase();

  const isVerifiedOutage = policy.verdict === 'INCIDENT_VERIFIED';
  const isHealthyVerdict = policy.verdict === 'ENDPOINT_HEALTHY';

  return (
    <div className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between ${
      policy.status === 1 
        ? 'border-amber-300 ring-2 ring-amber-400/20' 
        : policy.status === 2 
        ? 'border-red-200' 
        : 'border-slate-200/90'
    }`}>
      <div>
        {/* Top Bar */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-extrabold text-base text-sky-700 tracking-tight">
                {policy.policy_id}
              </span>
              {policy.status === 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  JURY TRIBUNAL ACTIVE
                </span>
              )}
            </div>
            
            <a 
              href={policy.target_endpoint_url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-mono text-slate-500 hover:text-sky-600 flex items-center gap-1 truncate"
              title={policy.target_endpoint_url}
            >
              <span className="truncate">{policy.target_endpoint_url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          <span className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-full flex-shrink-0 ${getStatusColor(policy.status)}`}>
            {getStatusLabel(policy.status)}
          </span>
        </div>

        {/* Telemetry Gauge / Metrics */}
        <div className="grid grid-cols-2 gap-2.5 my-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Coverage Payout</span>
            <p className="font-bold text-slate-900 text-sm">{formatGen(policy.coverage_payout)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Anti-Spam Deposit</span>
            <p className="font-bold text-slate-700 text-sm">
              {policy.claim_deposit && policy.claim_deposit !== "0" ? formatGen(policy.claim_deposit) : "0 GEN"}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Consumer</span>
            <p className="font-medium text-slate-600 truncate">{truncateAddress(policy.insured_consumer)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Verdict</span>
            <p className={`font-bold ${isVerifiedOutage ? 'text-red-600' : isHealthyVerdict ? 'text-emerald-600' : 'text-slate-500'}`}>
              {policy.verdict || 'PENDING'}
            </p>
          </div>
        </div>

        {/* Confidence & Severity Meters */}
        {(policy.confidence > 0 || policy.outage_severity > 0) && (
          <div className="mb-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                <span>Validator Confidence</span>
                <span className="font-bold text-sky-600">{policy.confidence}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${policy.confidence}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                <span>Incident Severity</span>
                <span className={`font-bold ${policy.outage_severity >= 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {policy.outage_severity}/100
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${policy.outage_severity >= 70 ? 'bg-red-500' : policy.outage_severity >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${policy.outage_severity}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* AI Diagnostic preview */}
        {policy.reason && policy.reason !== "Policy active. Continuous SLA protection in effect." && (
          <div className="mb-3 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
              <Activity className="w-3 h-3 text-sky-500" />
              <span>Diagnostic Rationale:</span>
            </div>
            <p className="text-[11px] font-mono text-slate-700 line-clamp-2 leading-relaxed">
              {policy.reason}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Inspect Button */}
          <button 
            onClick={() => onInspect(policy)} 
            className="flex-1 flex items-center justify-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-1" /> Dossier
          </button>
          
          {/* File Claim (Consumer Portal or Active Policy) */}
          {policy.status === 0 && (
            <button 
              onClick={() => onFileClaim(policy.policy_id, policy.coverage_payout)} 
              className="flex-1 flex items-center justify-center py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
              title="Stake 5% anti-spam deposit and trigger an AI Jury outage probe"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> File Claim
            </button>
          )}

          {/* Adjudicate (AI Jury Chamber) */}
          {policy.status === 1 && (
            <button 
              onClick={() => handleAction('adjudicate')} 
              disabled={!!loadingAction} 
              className="flex-1 flex items-center justify-center py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50"
              title="Trigger on-chain gl.nondet.web.render probe and semantic consensus"
            >
              {loadingAction === 'adjudicate' ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  Probing...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 mr-1 text-slate-950" /> Trigger Jury Probe
                </>
              )}
            </button>
          )}

          {/* Reclaim Expired (Underwriter Vault) */}
          {(policy.status === 0 || policy.status === 4) && (
            <button 
              onClick={() => handleAction('reclaim')} 
              disabled={!!loadingAction} 
              className="flex items-center justify-center py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
              title="Underwriter reclaims escrow after policy expiration"
            >
              {loadingAction === 'reclaim' ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              )}
              Reclaim
            </button>
          )}
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
          <span>Expires: Block #{policy.expires_at_block}</span>
          <a 
            href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
            target="_blank" 
            rel="noreferrer"
            className="text-sky-500 hover:text-sky-700 flex items-center gap-0.5 hover:underline"
          >
            Explorer <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
