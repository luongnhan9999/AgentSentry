import React, { useState } from 'react';
import { getGenLayerClient, contractAddress } from '../config/genlayer';

interface FileClaimModalProps {
  policyId: string;
  coverageGen: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FileClaimModal: React.FC<FileClaimModalProps> = ({ policyId, coverageGen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDeposit = Number(coverageGen) * 0.05;
  const [deposit, setDeposit] = useState((minDeposit / 1e18).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      const client = getGenLayerClient();
      
      const valStr = deposit;
      const valWei = BigInt(Math.floor(Number(valStr) * 1e18));
      
      // Request MetaMask to sign and send the transaction
      // Assuming writeContract is available on client or we use standard eth_sendTransaction via window.ethereum
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      
      // Data encoding for file_outage_claim(policy_id) would normally be done via genlayer-js
      // Here we simulate the call using writeContract
      await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'file_outage_claim',
        args: [policyId],
        value: valWei,
        account: from,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to file claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold">File Outage Claim</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-500">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-4 text-sm text-gray-600">
            Filing a claim for policy <span className="font-mono text-sky-600">{policyId}</span>.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Anti-Spam Deposit (GEN)</label>
            <input 
              type="number" 
              step="0.0001"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-sky-500 focus:outline-none"
              min={(minDeposit / 1e18).toString()}
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum required: {(minDeposit / 1e18).toFixed(4)} GEN (5% of coverage).
            </p>
          </div>

          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <strong>Warning:</strong> If the AI Validator determines the endpoint is healthy, you will forfeit this deposit.
          </div>

          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
          
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded text-sm font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-crimson-500 text-white rounded text-sm font-bold disabled:opacity-50 flex items-center">
              {loading ? (
                <>
                  <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  Waiting for AI...
                </>
              ) : "Submit Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileClaimModal;
