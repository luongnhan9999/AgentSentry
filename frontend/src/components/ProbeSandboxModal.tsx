import React, { useState } from 'react';
import { X, Activity, Play, CheckCircle2, AlertTriangle, Shield, ArrowRight, Sparkles, Terminal } from 'lucide-react';

interface ProbeSandboxModalProps {
  onClose: () => void;
  onDeployPreset: (url: string, schema: string) => void;
}

const PRESETS = [
  {
    name: "Binance Public Market API",
    tag: "Healthy (200 OK)",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    url: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    schema: '{"symbol": "BTCUSDT", "price": "<number>"}',
    simulatedLatency: 45,
    simulatedStatus: 200,
  },
  {
    name: "Simulated Cloud Service Outage",
    tag: "Outage (503 Service Unavailable)",
    tagColor: "bg-red-100 text-red-800 border-red-300",
    url: "https://httpstat.us/503",
    schema: '{"status": "ok", "service": "payment-gateway"}',
    simulatedLatency: 1850,
    simulatedStatus: 503,
  },
  {
    name: "Silent Degradation / Schema Drift",
    tag: "Silent Failure (Empty Payload)",
    tagColor: "bg-amber-100 text-amber-800 border-amber-300",
    url: "https://httpstat.us/200",
    schema: '{"data": {"trades": [{"id": "<str>", "amount": "<number>"}]}}',
    simulatedLatency: 120,
    simulatedStatus: 200,
  },
  {
    name: "CoinGecko Network Health",
    tag: "Healthy (200 OK)",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    url: "https://api.coingecko.com/api/v3/ping",
    schema: '{"gecko_says": "(V3) To the Moon!"}',
    simulatedLatency: 80,
    simulatedStatus: 200,
  }
];

const ProbeSandboxModal: React.FC<ProbeSandboxModalProps> = ({ onClose, onDeployPreset }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [url, setUrl] = useState(PRESETS[0].url);
  const [schema, setSchema] = useState(PRESETS[0].schema);
  const [probing, setProbing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setUrl(PRESETS[index].url);
    setSchema(PRESETS[index].schema);
    setResult(null);
  };

  const handleRunProbe = async () => {
    setProbing(true);
    setResult(null);

    // Simulate on-chain GenLayer probe execution
    setTimeout(async () => {
      let isOutage = false;
      let status = 200;
      let latency = Math.floor(Math.random() * 80) + 30;
      let rawResponse = "";

      if (url.includes("503") || url.includes("500") || url.includes("outage")) {
        isOutage = true;
        status = 503;
        latency = 1200;
        rawResponse = "HTTP/1.1 503 Service Unavailable: Back-end server overloaded or network gateway failed.";
      } else if (url.includes("httpstat.us/200") && schema.includes("trades")) {
        // Silent degradation: 200 but schema drift
        isOutage = true;
        status = 200;
        rawResponse = "200 OK (Empty Body)";
      } else {
        isOutage = false;
        status = 200;
        rawResponse = JSON.stringify({ symbol: "BTCUSDT", price: "64520.10", server_time: Date.now() }, null, 2);
      }

      const diagnostic = isOutage
        ? {
            verdict: "INCIDENT_VERIFIED",
            confidence: 98,
            outage_severity: 92,
            reason: status === 503 
              ? "DIAGNOSTIC CRITICAL: Live probe encountered HTTP 503 Service Unavailable. Upstream microservice unresponsive. Core SLA terms breached."
              : "SILENT DEGRADATION DETECTED: Endpoint returned HTTP 200 but payload violated mandatory schema key invariant 'trades'. Corrupt/empty payload confirmed.",
            latency,
            status,
            rawResponse
          }
        : {
            verdict: "ENDPOINT_HEALTHY",
            confidence: 95,
            outage_severity: 5,
            reason: "DIAGNOSTIC HEALTHY: Target endpoint returned valid 200 OK within 65ms. All JSON schema keys and invariants strictly satisfied. Endpoint SLA fully compliant.",
            latency,
            status,
            rawResponse
          };

      setResult(diagnostic);
      setProbing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-slate-900">Live Endpoint Probe Sandbox</h2>
              <p className="text-xs text-slate-500 font-sans">Simulate GenLayer AI Juror on-chain diagnostic probe prior to policy deployment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Preset Telemetry Target:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className={`p-3 text-left rounded-xl border transition-all text-xs font-mono ${
                    selectedPresetIndex === idx
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate mb-1">{preset.name}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] border ${preset.tagColor}`}>
                    {preset.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                Target Endpoint URL:
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setSelectedPresetIndex(-1);
                }}
                className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                Expected Payload Schema / Invariants:
              </label>
              <textarea
                value={schema}
                onChange={(e) => {
                  setSchema(e.target.value);
                  setSelectedPresetIndex(-1);
                }}
                className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none h-[42px] resize-none"
                placeholder='{"status": 200}'
              />
            </div>
          </div>

          {/* Trigger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunProbe}
              disabled={probing}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold rounded-lg transition-all shadow disabled:opacity-50"
            >
              {probing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Simulating On-Chain Consensus Probe...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Diagnostic Probe
                </>
              )}
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Calls <code className="text-slate-600">gl.nondet.web.render</code> + GenLayer Juror LLM
            </span>
          </div>

          {/* Results Box */}
          {result && (
            <div className={`p-5 rounded-xl border animate-in fade-in duration-300 ${
              result.verdict === 'INCIDENT_VERIFIED' 
                ? 'bg-red-50/70 border-red-200' 
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    result.verdict === 'INCIDENT_VERIFIED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {result.verdict}
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    HTTP {result.status} • Latency: {result.latency}ms
                  </span>
                </div>

                <button
                  onClick={() => {
                    onDeployPreset(url, schema);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                >
                  Create Policy With This Endpoint <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Rationale */}
              <div className="bg-white/80 p-3.5 rounded-lg border border-slate-200/80 mb-3">
                <p className="text-xs font-mono text-slate-700 leading-relaxed">
                  <strong>AI Juror Rationale:</strong> {result.reason}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-white/70 p-2.5 rounded border border-slate-200/60">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Validator Confidence</span>
                    <span className="font-bold text-sky-600">{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${result.confidence}%` }}></div>
                  </div>
                </div>
                <div className="bg-white/70 p-2.5 rounded border border-slate-200/60">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Outage Severity Score</span>
                    <span className={`font-bold ${result.outage_severity >= 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {result.outage_severity}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${result.outage_severity >= 70 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${result.outage_severity}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-mono font-bold rounded-lg transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProbeSandboxModal;
