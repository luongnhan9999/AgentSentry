import React from 'react';
import { ShieldCheck, Activity, CheckCircle2, Clock } from 'lucide-react';

interface TelemetryHeartbeatProps {
  activeCount: number;
  totalObservations?: number;
  latestObservation?: {
    statusCode?: number;
    verdict?: string;
    timestamp?: string | number;
  };
}

const TelemetryHeartbeat: React.FC<TelemetryHeartbeatProps> = ({
  activeCount,
  totalObservations = 0,
  latestObservation,
}) => {
  return (
    <div className="bg-[#090D16] border border-slate-800 rounded-xl p-3 px-4 mb-6 shadow-inner text-slate-300 font-mono text-xs flex flex-wrap items-center justify-between gap-4">
      {/* Point-in-time SLA status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-white font-bold tracking-tight">POINT-IN-TIME SLA VERIFICATION</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>INSURED ENDPOINTS:</span>
          <span className="text-sky-400 font-bold">{activeCount}</span>
        </div>
      </div>

      {/* Contract-recorded audit metrics */}
      <div className="flex items-center gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>ON-CHAIN AUDITS: </span>
          <span className="text-white font-bold">{totalObservations > 0 ? totalObservations : activeCount}</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>VERIFICATION: </span>
          <span className="text-emerald-400 font-bold">NATIVE WEB PROBE</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
          <span>CONSENSUS: </span>
          <span className="text-sky-400 font-bold">LLM SUBJECTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHeartbeat;
