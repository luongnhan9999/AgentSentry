import React, { useState } from 'react';
import { getGenLayerClient, contractAddress, ensureStudionetNetwork } from '../config/genlayer';
import { Shield, Sparkles, X, AlertCircle, Clock, Zap, UserCheck } from 'lucide-react';

interface PurchasePolicyProps {
  onSuccess: () => void;
  onClose: () => void;
  initialUrl?: string;
  initialSchema?: string;
  userAddress?: string | null;
}

const TEMPLATES = [
  {
    name: "Binance Ticker API",
    tag: "High-Frequency Data",
    url: "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
    schema: '{"symbol": "ETHUSDT", "price": "<number>"}',
    duration: "5000",
    coverage: "1.0",
  },
  {
    name: "Simulated 503 Outage Test",
    tag: "Testing Outage Claim",
    url: "https://httpstat.us/503",
    schema: '{"status": 200, "alive": true}',
    duration: "5000",
    coverage: "0.5",
  },
  {
    name: "CoinGecko Ping API",
    tag: "Market Health Probe",
    url: "https://api.coingecko.com/api/v3/ping",
    schema: '{"gecko_says": "(V3) To the Moon!"}',
    duration: "5000",
    coverage: "2.0",
  },
  {
    name: "Custom Agent RPC",
    tag: "Custom Bot Endpoint",
    url: "https://api.github.com/zen",
    schema: "Non-empty plain text or JSON payload",
    duration: "2500",
    coverage: "0.2",
  }
];

const PurchasePolicy: React.FC<PurchasePolicyProps> = ({ 
  onSuccess, 
  onClose,
  initialUrl,
  initialSchema,
  userAddress
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    consumerAddr: userAddress || "",
    url: initialUrl || TEMPLATES[0].url,
    schema: initialSchema || TEMPLATES[0].schema,
    duration: TEMPLATES[0].duration,
    coverage: TEMPLATES[0].coverage
  });

  const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setFormData({
      ...formData,
      url: tmpl.url,
      schema: tmpl.schema,
      duration: tmpl.duration,
      coverage: tmpl.coverage
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!(window as any).ethereum) throw new Error("MetaMask not found. Please install MetaMask to interact on-chain.");
      
      const valWei = BigInt(Math.floor(Number(formData.coverage) * 1e18));
      if (valWei <= BigInt(0)) {
        throw new Error("Coverage amount must be greater than 0 GEN.");
      }

      const consumerTarget = formData.consumerAddr.trim();
      if (!consumerTarget.startsWith("0x") || consumerTarget.length !== 42) {
        throw new Error("Invalid beneficiary Consumer address. Must be a valid 0x hex address.");
      }
      
      await ensureStudionetNetwork();
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts?.[0];
      if (!from) throw new Error("No connected account found in MetaMask.");
      
      const client = getGenLayerClient(from);
      // Updated contract signature: purchase_policy(consumer_addr, target_endpoint_url, expected_schema, duration_blocks)
      await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'purchase_policy',
        args: [consumerTarget, formData.url.trim(), formData.schema.trim(), parseInt(formData.duration, 10)],
        value: valWei,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to purchase policy. Check your GEN balance on studionet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-slate-900">Purchase SLA Uptime Policy</h2>
              <p className="text-xs text-slate-500 font-sans">Underwrite and lock insurance coverage escrow for an API endpoint</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Quick Templates */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
              ⚡ Quick 1-Click Templates:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyTemplate(tmpl)}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-xs font-mono group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-sky-700 truncate">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{tmpl.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Insured Consumer / Beneficiary */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-mono font-bold text-slate-700">
                Insured Consumer Address (Beneficiary) *
              </label>
              {userAddress && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, consumerAddr: userAddress })}
                  className="text-[10px] font-mono text-sky-600 hover:underline flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3" /> Use My Address
                </button>
              )}
            </div>
            <input 
              type="text" 
              value={formData.consumerAddr}
              onChange={e => setFormData({...formData, consumerAddr: e.target.value})}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="0x..."
              required 
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              The agent/consumer wallet that receives indemnity payouts upon confirmed outage.
            </p>
          </div>

          {/* Target Endpoint URL */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
              Target API / RPC Endpoint URL *
            </label>
            <input 
              type="url" 
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="https://api.yourbot.com/v1/health"
              required 
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              GenLayer AI validators probe this URL live on-chain using <code className="text-slate-600">gl.nondet.web.render</code>.
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
              Required Schema / Invariant Rules *
            </label>
            <textarea 
              value={formData.schema}
              onChange={e => setFormData({...formData, schema: e.target.value})}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none h-16 resize-none"
              placeholder='{"status": "ok", "latency_ms": "<number>"}'
              required 
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Specify required JSON keys. Missing keys or HTTP errors (500/504) trigger breach verdicts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                Duration (Blocks)
              </label>
              <input 
                type="number" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                min="10"
                required 
              />
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">~5000 blocks ≈ 1 week</span>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                Coverage Escrow (GEN) *
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.coverage}
                onChange={e => setFormData({...formData, coverage: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                min="0.001"
                required 
              />
              <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block font-bold">100% Escrow Pool</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
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
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for GenLayer Consensus (~15-30s)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Lock Escrow & Activate Policy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchasePolicy;
