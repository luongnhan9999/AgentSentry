import React from 'react';
import { getStatusLabel, getStatusColor, formatGen, truncateAddress } from '../utils/helpers';
import { ExternalLink, Search, ShieldAlert, CheckCircle, Clock, Activity, AlertTriangle, ShieldCheck, Zap, ArrowUpRight, Wifi, Shield, RefreshCw } from 'lucide-react';
import { getGenLayerClient, contractAddress, ensureStudionetNetwork } from '../config/genlayer';
import UptimeHeatmap from './UptimeHeatmap';

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
  
  const handleAction = async (action: 'adjudicate' | 'reclaim' | 'withdraw_deposit' | 'audit_health') => {
    try {
      setLoadingAction(action);
      if (!(window as any).ethereum) throw new Error("MetaMask not found. Please install MetaMask.");
      await ensureStudionetNetwork();
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts?.[0];
      if (!from) throw new Error("No connected account found in MetaMask.");

      const client = getGenLayerClient(from);
      let fnName = 'adjudicate_incident';
      if (action === 'reclaim') fnName = 'reclaim_expired_coverage';
      if (action === 'withdraw_deposit') fnName = 'withdraw_inconclusive_deposit';
      if (action === 'audit_health') fnName = 'record_health_check';

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: fnName,
        args: [policy.policy_id],
        value: BigInt(0),
      });

      try {
        await client.waitForTransactionReceipt({
          hash: txHash,
          status: 'ACCEPTED' as any,
          interval: 2000,
          retries: 45,
        });
      } catch (receiptErr) {
        console.warn("Receipt wait warning:", receiptErr);
      }

      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Action failed. Check console.");
    } finally {
      setLoadingAction(null);
    }
  };

  const isVerifiedOutage = policy.verdict === 'INCIDENT_VERIFIED';
  const isHealthyVerdict = policy.verdict === 'ENDPOINT_HEALTHY';
  const isInconclusive = policy.status === 5 || policy.verdict?.startsWith('INCONCLUSIVE');

  // Format expiration timestamp
  const formatExpiry = (val: any) => {
    const num = Number(val);
    if (!num) return 'N/A';
    if (num > 1000000000) {
      return new Date(num * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return `#${num}`;
  };

  return (
    <div className={`hud-card rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all ${
      policy.status === 1 
        ? 'border-amber-400 bg-amber-50/10' 
        : policy.status === 2 
        ? 'border-red-300 bg-red-50/10' 
        : policy.status === 5
        ? 'border-purple-300 bg-purple-50/10'
        : 'border-slate-200'
    }`}>
      <div>
        {/* Top Header with Hardware Tag */}
        <div className="flex justify-between items-start gap-2 mb-2 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-sky-700 tracking-tight">
                [{policy.policy_id}]
              </span>
              {policy.status === 1 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 animate-pulse border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  JURY PROBE PENDING
                </span>
              )}
              {policy.status === 5 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  INCONCLUSIVE TRIAGE
                </span>
              )}
            </div>
            
            <a 
              href={policy.target_endpoint_url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-mono text-slate-500 hover:text-sky-600 flex items-center gap-1 mt-1 truncate max-w-[220px]"
              title={policy.target_endpoint_url}
            >
              <span className="truncate">{policy.target_endpoint_url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          
          <div className="flex flex-col items-end">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${getStatusColor(policy.status)}`}>
              {getStatusLabel(policy.status)}
            </span>
          </div>
        </div>

        {/* Coverage Escrow Metrics */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Insured Escrow</span>
            <span className="font-mono font-extrabold text-sm text-slate-900">
              {formatGen(policy.coverage_payout)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Anti-Spam Stake</span>
            <span className="font-mono font-bold text-sm text-slate-600">
              {formatGen(policy.claim_deposit)}
            </span>
          </div>
        </div>

        {/* Contract-Recorded Observation Summary */}
        {Number(policy.last_observation_timestamp) > 0 && (
          <div className="mb-2 p-2 bg-slate-900 text-slate-300 rounded-lg text-[10px] font-mono flex items-center justify-between">
            <span className="text-slate-400">LAST OBSERVATION:</span>
            <span className="text-emerald-400 font-bold">
              HTTP {policy.last_observation_status_code || 200} • {policy.last_observation_verdict}
            </span>
          </div>
        )}

        {/* Real-time Verdict Diagnosis */}
        {policy.status !== 0 && (
          <div className={`p-2.5 rounded-xl text-xs font-mono mb-3 ${
            isVerifiedOutage 
              ? 'bg-red-950 text-red-100 border border-red-800' 
              : isHealthyVerdict 
              ? 'bg-emerald-950 text-emerald-100 border border-emerald-800' 
              : isInconclusive
              ? 'bg-purple-950 text-purple-100 border border-purple-800'
              : 'bg-slate-900 text-slate-200 border border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 border-b border-white/10 pb-1">
              <span>VERDICT: <strong className="text-white">{policy.verdict}</strong></span>
              <span>SEVERITY: <strong className={isVerifiedOutage ? 'text-red-400' : 'text-slate-300'}>{policy.outage_severity}%</strong></span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {policy.reason}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons Scoped to Role */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Inspect Button */}
          <button 
            onClick={() => onInspect(policy)} 
            className="flex-1 flex items-center justify-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-mono font-bold transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-1 text-slate-500" /> Dossier
          </button>
          
          {/* File Claim (Consumer Portal or Active Policy) */}
          {(policy.status === 0 || policy.status === 5) && (
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

          {/* Inconclusive Deposit Refund */}
          {policy.status === 5 && (
            <button 
              onClick={() => handleAction('withdraw_deposit')} 
              disabled={!!loadingAction} 
              className="flex items-center justify-center py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
              title="Claimant withdraws anti-spam deposit from inconclusive triage"
            >
              {loadingAction === 'withdraw_deposit' ? (
                <Clock className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
              )}
              Refund Deposit
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
          <span>Expires: {formatExpiry(policy.expires_at || policy.expires_at_block)}</span>
          <a 
            href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
            target="_blank" 
            rel="noreferrer"
            className="text-sky-600 hover:text-sky-800 flex items-center gap-0.5 hover:underline"
          >
            Explorer <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
