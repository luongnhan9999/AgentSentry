import React from 'react';
import { Shield, Activity, ShieldAlert, CircleSlash, Percent, Lock, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatGen } from '../utils/helpers';

interface StatsBarProps {
  stats: any;
  activeCount: number;
  breachCount: number;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats, activeCount, breachCount }) => {
  const totalPolicies = stats?.total_policies || 0;
  const totalCoverage = stats?.total_coverage_locked || "0";
  const totalClaims = stats?.total_claims_settled || 0;

  // Calculate simulated protocol health ratio
  const healthRate = totalPolicies > 0 
    ? Math.max(85, Math.round(((totalPolicies - breachCount) / totalPolicies) * 100))
    : 99.8;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Total Policies */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Monitored Policies
          </span>
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-extrabold text-slate-900">{totalPolicies}</span>
          <span className="text-xs font-mono text-emerald-600 font-semibold">{activeCount} active SLA</span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(totalPolicies * 25, 100)}%` }}></div>
        </div>
      </div>

      {/* Coverage Locked */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Coverage Escrow Locked
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-extrabold text-emerald-600">{formatGen(totalCoverage)}</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-mono">100% On-Chain Collateralized Escrow</p>
      </div>

      {/* Claims Settled */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Incidents Adjudicated
          </span>
          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-extrabold text-red-600">{totalClaims}</span>
          <span className="text-xs font-mono text-slate-500">claims settled</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-mono">Zero-Oracle AI Jury Consensus</p>
      </div>

      {/* Protocol Health / Uptime Index */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Network SLA Health
          </span>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-extrabold text-slate-900">{healthRate}%</span>
          <span className="text-xs font-mono text-emerald-600 font-semibold">Compliance</span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${healthRate}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
