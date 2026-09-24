import React, { useState } from 'react';
import { getGenLayerClient, contractAddress, ensureStudionetNetwork } from '../config/genlayer';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, Zap } from 'lucide-react';
import { formatGen } from '../utils/helpers';

interface FileClaimModalProps {
  policyId: string;
  coverageGen: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FileClaimModal: React.FC<FileClaimModalProps> = ({ 
  policyId, 
  coverageGen, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Minimum anti-spam deposit: 5% of coverage payout (coverage // 20)
  const coverageNum = Number(coverageGen);
  const minDepositWei = BigInt(Math.max(1, Math.floor(coverageNum / 20)));
  const minDepositGen = Number(minDepositWei) / 1e18;

  const [depositGen, setDepositGen] = useState(
    minDepositGen > 0 ? minDepositGen.toFixed(4) : "0.05"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!(window as any).ethereum) throw new Error("MetaMask not found. Please connect your wallet.");
      const valWei = BigInt(Math.floor(Number(depositGen) * 1e18));
      if (valWei < minDepositWei) {
        throw new Error(`Deposit must be at least ${minDepositGen.toFixed(4)} GEN (5% of coverage).`);
      }

      await ensureStudionetNetwork();
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts?.[0];
      if (!from) throw new Error("No connected account found in MetaMask.");

      const client = getGenLayerClient(from);
      await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'file_outage_claim',
        args: [policyId],
        value: valWei,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to file outage claim. Verify your wallet balance and active policy state.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-red-50/60 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-slate-900">File Incident Outage Claim</h2>
              <p className="text-xs text-slate-500 font-sans">Trigger AI Jury diagnostic probe for policy <span className="font-mono font-bold text-slate-800">{policyId}</span></p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Insured Coverage:</span>
              <span className="font-bold text-slate-900">{formatGen(coverageGen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Required Anti-Spam Stake (5%):</span>
              <span className="font-bold text-red-600">{minDepositGen.toFixed(4)} GEN</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
              Anti-Spam Staked Deposit (GEN) *
            </label>
            <input 
              type="number" 
              step="0.0001"
              value={depositGen}
              onChange={(e) => setDepositGen(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              min={minDepositGen.toString()}
              required 
            />
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Minimum 5% deposit prevents malicious griefing attacks on GenLayer AI validators.
            </p>
          </div>

          {/* Outcome Rules Box */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-900">
            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Consensus Settlement Rules:</span>
            </div>
            <ul className="space-y-1 text-[11px] font-sans pl-5 list-disc text-amber-800">
              <li><strong>If INCIDENT_VERIFIED:</strong> You receive 100% of the coverage escrow payout + full refund of this deposit.</li>
              <li><strong>If ENDPOINT_HEALTHY:</strong> Frivolous claim rejected. Your deposit is forfeited into the underwriter liquidity reserve.</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-mono">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for GenLayer Consensus (~15-30s)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Stake Deposit & File Claim</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileClaimModal;
