import React from 'react';

interface UptimeHeatmapProps {
  status: number;
  uptimePct?: number;
}

const UptimeHeatmap: React.FC<UptimeHeatmapProps> = ({ status }) => {
  // Generate 20 point-in-time audit status blocks
  const ticks = Array.from({ length: 20 }, (_, i) => {
    if (status === 2 && i >= 18) {
      return { status: 'outage', label: `Audit #${i + 1}: Incident Verified (Outage)` };
    }
    if (status === 1 && i === 19) {
      return { status: 'pending', label: `Audit #${i + 1}: Claim Filed (Triage Pending)` };
    }
    if (status === 5 && i === 19) {
      return { status: 'inconclusive', label: `Audit #${i + 1}: Inconclusive Probe (Retry Available)` };
    }
    return { status: 'healthy', label: `Audit #${i + 1}: Verified Operational` };
  });

  const statusLabel = 
    status === 2 ? 'Outage Verified' : 
    status === 1 ? 'Adjudication Pending' : 
    status === 5 ? 'Inconclusive Triage' :
    status === 4 ? 'Expired Clean' :
    'Healthy (Point-in-Time Audited)';

  return (
    <div className="my-2">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
        <span>HEALTH AUDIT STATUS</span>
        <span className={
          status === 2 ? 'text-red-500 font-bold' : 
          status === 1 ? 'text-amber-500 font-bold' : 
          status === 5 ? 'text-purple-500 font-bold' :
          'text-emerald-600 font-bold'
        }>
          {statusLabel}
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
                : tick.status === 'inconclusive'
                ? 'bg-purple-500 animate-pulse'
                : 'bg-emerald-500/80 hover:bg-emerald-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default UptimeHeatmap;
