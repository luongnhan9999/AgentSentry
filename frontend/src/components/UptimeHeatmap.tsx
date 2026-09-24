import React from 'react';

interface UptimeHeatmapProps {
  uptimePct?: number;
  status: number;
}

const UptimeHeatmap: React.FC<UptimeHeatmapProps> = ({ uptimePct = 99.98, status }) => {
  // Generate 28 tick bars representing historical 28-day SLA monitoring
  const ticks = Array.from({ length: 28 }, (_, i) => {
    // If currently breached (status === 1 or 2) show recent red ticks
    if ((status === 1 || status === 2) && i >= 25) {
      return { status: 'outage', latency: 2400, label: `Day -${28 - i}: Outage (HTTP 503)` };
    }
    if (i === 12 && uptimePct < 98) {
      return { status: 'degraded', latency: 450, label: `Day -${28 - i}: Degraded (450ms)` };
    }
    return { status: 'healthy', latency: Math.floor(Math.random() * 20) + 25, label: `Day -${28 - i}: 100% OK` };
  });

  return (
    <div className="my-2">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
        <span>SLA MONITOR (28D)</span>
        <span className={status === 2 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
          {status === 2 ? '88.40%' : `${uptimePct}%`} UP
        </span>
      </div>
      <div className="flex items-center gap-[3px] h-3">
        {ticks.map((tick, idx) => (
          <div
            key={idx}
            title={tick.label}
            className={`flex-1 h-full rounded-[2px] transition-all hover:scale-125 cursor-help ${
              tick.status === 'outage'
                ? 'bg-red-500 shadow-sm shadow-red-500/50'
                : tick.status === 'degraded'
                ? 'bg-amber-400'
                : 'bg-emerald-500/80 hover:bg-emerald-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default UptimeHeatmap;
