import React from 'react';
import { getStatusLabel, getStatusColor, formatGen, truncateAddress } from '../utils/helpers';
import { ExternalLink, Search, ShieldAlert, CheckCircle, Clock, Activity } from 'lucide-react';
import { getGenLayerClient, contractAddress } from '../config/genlayer';

interface PolicyCardProps {
  policy: any;
  onInspect: (policy: any) => void;
  onFileClaim: (policyId: string, coverage: string) => void;
  onRefresh: () => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onInspect, onFileClaim, onRefresh }) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  
  const handleAction = async (action: 'adjudicate' | 'reclaim') => {
    try {
      setLoadingAction(action);
      if (!window.ethereum) throw new Error("MetaMask not found");
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

  const verdictColor = policy.verdict === 'INCIDENT_VERIFIED' 
    ? 'text-red-600' 
    : policy.verdict === 'ENDPOINT_HEALTHY' 
    ? 'text-emerald-600' 
    : 'text-gray-500';

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-mono font-bold text-lg text-sky-600 truncate" title={policy.policy_id}>{policy.policy_id}</h3>
          <a href={policy.target_endpoint_url} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-sky-500 flex items-center mt-1 truncate">
            <span className="truncate">{policy.target_endpoint_url}</span>
            <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
          </a>
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded-full flex-shrink-0 ml-2 ${getStatusColor(policy.status)}`}>
          {getStatusLabel(policy.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Coverage</p>
          <p className="font-mono font-bold">{formatGen(policy.coverage_payout)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Consumer</p>
          <p className="font-mono text-xs">{truncateAddress(policy.insured_consumer)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Expires</p>
          <p className="font-mono text-xs">Block {policy.expires_at_block}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Verdict</p>
          <p className={`font-mono font-bold text-xs ${verdictColor}`}>{policy.verdict || 'N/A'}</p>
        </div>
      </div>

      {/* Severity + Confidence bars */}
      {policy.confidence > 0 && (
        <div className="mb-4 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Confidence</span><span>{policy.confidence}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${policy.confidence}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Severity</span><span>{policy.outage_severity}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${policy.outage_severity >= 70 ? 'bg-red-500' : policy.outage_severity >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${policy.outage_severity}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* AI Reason preview */}
      {policy.reason && policy.reason !== "Policy active. Continuous SLA protection in effect." && (
        <div className="mb-4 bg-gray-50 border border-gray-100 rounded p-3">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> AI Diagnostic</p>
          <p className="text-xs text-gray-700 line-clamp-3">{policy.reason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        <button onClick={() => onInspect(policy)} className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-bold transition-colors">
          <Search className="w-4 h-4 mr-1" /> Inspect
        </button>
        
        {policy.status === 0 && (
          <button onClick={() => onFileClaim(policy.policy_id, policy.coverage_payout)} className="flex-1 flex items-center justify-center py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-bold transition-colors">
            <ShieldAlert className="w-4 h-4 mr-1" /> File Claim
          </button>
        )}

        {policy.status === 1 && (
          <button onClick={() => handleAction('adjudicate')} disabled={!!loadingAction} className="flex-1 flex items-center justify-center py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-bold transition-colors disabled:opacity-50">
            {loadingAction === 'adjudicate' ? (
              <><span className="animate-spin mr-1 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>AI Probing...</>
            ) : (
              <><ShieldAlert className="w-4 h-4 mr-1" /> Adjudicate</>
            )}
          </button>
        )}

        {(policy.status === 0 || policy.status === 4) && (
          <button onClick={() => handleAction('reclaim')} disabled={!!loadingAction} className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-bold transition-colors disabled:opacity-50">
            {loadingAction === 'reclaim' ? <Clock className="animate-spin w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            Reclaim
          </button>
        )}
      </div>
      
      <a 
        href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
        target="_blank" rel="noreferrer"
        className="w-full text-center text-xs text-sky-500 mt-3 hover:underline flex justify-center items-center"
      >
        View in Explorer <ExternalLink className="w-3 h-3 ml-1" />
      </a>
    </div>
  );
};

export default PolicyCard;
