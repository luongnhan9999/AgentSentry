import React from 'react';

interface UptimeHeatmapProps {
  status: number;
  uptimePct?: number;
}

const UptimeHeatmap: React.FC<UptimeHeatmapProps> = ({ status }) => {
  // Generate 28 tick bars representing on-chain SLA telemetry
  const ticks = Array.from({ length: 28 }, (_, i) => {
    if (status === 2 && i >= 26) {
      return { status: 'outage', label: `Day -${28 - i}: Incident Verified (Outage)` };
    }
    if (status === 1 && i === 27) {
      return { status: 'pending', label: `Day 0: Claim Filed (Triage Pending)` };
    }
    return { status: 'healthy', label: `Day -${28 - i}: 100% SLA Compliant` };
  });

  const uptimeLabel = status === 2 ? 'Outage Verified' : status === 1 ? 'Incident Claim Pending' : '100% SLA';

  return (
    <div className="my-2">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
        <span>SLA COMPLIANCE</span>
        <span className={status === 2 ? 'text-red-500 font-bold' : status === 1 ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}>
          {uptimeLabel}
        </span>
      </div>
      <div className="flex items-center gap-[3px] h-2.5">
        {ticks.map((tick, idx) => (
          <div
            key={idx}
            title={tick.label}
            className={`flex-1 h-full rounded-[2px] transition-all hover:scale-125 cursor-help ${
              tick.status === 'outage'
                ? 'bg-red-500 shadow-sm shadow-red-500/50'
                : tick.status === 'pending'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-500/80 hover:bg-emerald-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default UptimeHeatmap;
