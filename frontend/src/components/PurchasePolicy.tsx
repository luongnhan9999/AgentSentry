import React, { useState } from 'react';
import { getGenLayerClient, contractAddress } from '../config/genlayer';

interface PurchasePolicyProps {
  onSuccess: () => void;
  onClose: () => void;
}

const PurchasePolicy: React.FC<PurchasePolicyProps> = ({ onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    url: 'https://api.example.com/health',
    schema: '{"status": "ok"}',
    duration: '100',
    coverage: '10'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      const client = getGenLayerClient();
      
      const valWei = BigInt(Math.floor(Number(formData.coverage) * 1e18));
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      
      await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'purchase_policy',
        args: [formData.url, formData.schema, formData.duration],
        value: valWei,
        account: from,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to purchase policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-card w-full max-w-lg rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-border bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold">Purchase Coverage</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-500">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Endpoint URL</label>
              <input 
                type="url" 
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:border-sky-500 focus:outline-none text-sm font-mono"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-1">Expected JSON Schema / Response</label>
              <textarea 
                value={formData.schema}
                onChange={e => setFormData({...formData, schema: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:border-sky-500 focus:outline-none text-sm font-mono h-24"
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Duration (Blocks)</label>
                <input 
                  type="number" 
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:border-sky-500 focus:outline-none"
                  min="1"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Coverage Amount (GEN)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.coverage}
                  onChange={e => setFormData({...formData, coverage: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:border-sky-500 focus:outline-none"
                  min="0.1"
                  required 
                />
              </div>
            </div>
          </div>

          {error && <div className="mt-4 text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
          
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded text-sm font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded text-sm font-bold disabled:opacity-50 flex items-center">
              {loading ? (
                <>
                  <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  Waiting for AI Validator consensus (~15-30s)...
                </>
              ) : "Purchase Coverage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchasePolicy;
