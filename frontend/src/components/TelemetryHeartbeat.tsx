import React, { useEffect, useState } from 'react';
import { Activity, Wifi, Radio, Cpu, Layers } from 'lucide-react';

interface TelemetryHeartbeatProps {
  activeCount: number;
}

const TelemetryHeartbeat: React.FC<TelemetryHeartbeatProps> = ({ activeCount }) => {
  const [blockHeight, setBlockHeight] = useState(14892);
  const [liveLatency, setLiveLatency] = useState(38);
  const [pulseCount, setPulseCount] = useState(1420);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlockHeight((b) => b + 1);
      setLiveLatency(Math.floor(Math.random() * 18) + 28);
      setPulseCount((p) => p + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#090D16] border border-slate-800 rounded-xl p-3 px-4 mb-6 shadow-inner text-slate-300 font-mono text-xs flex flex-wrap items-center justify-between gap-4">
      {/* Live Pulse & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-white font-bold tracking-tight">TELEMETRY STREAM</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>PROBING:</span>
          <span className="text-sky-400 font-bold">{activeCount} ENDPOINTS</span>
        </div>
      </div>

      {/* SVG Oscilloscope / Heartbeat Line */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xs px-4">
        <svg className="w-full h-5 text-emerald-400/80 overflow-visible" viewBox="0 0 100 20">
          <path
            d="M0,10 L20,10 L25,4 L30,16 L35,2 L40,18 L45,10 L70,10 L75,6 L80,14 L85,10 L100,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Real-time Hardware Metrics */}
      <div className="flex items-center gap-4 text-[11px] text-slate-400">
        <div>
          <span>BLOCK: </span>
          <span className="text-white font-bold">#{blockHeight}</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div>
          <span>MEDIAN RTT: </span>
          <span className="text-emerald-400 font-bold">{liveLatency}ms</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="hidden sm:block">
          <span>CONSENSUS: </span>
          <span className="text-sky-400 font-bold">OPTIMISTIC DEMOCRACY</span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHeartbeat;
