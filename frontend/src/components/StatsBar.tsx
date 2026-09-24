import React from 'react';
import { Shield, Activity, ShieldAlert, CircleSlash } from 'lucide-react';
import { formatGen } from '../utils/helpers';

interface StatsBarProps {
  stats: any;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const totalPolicies = stats?.total_policies || 0;
  const totalCoverage = stats?.total_coverage_locked || "0";
  const totalClaims = stats?.total_claims_settled || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Total Policies</p>
          <p className="text-3xl font-mono mt-2 text-sky-600">{totalPolicies}</p>
        </div>
        <Shield className="w-10 h-10 text-sky-600 opacity-80" />
      </div>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Coverage Locked</p>
          <p className="text-3xl font-mono mt-2 text-emerald-500">{formatGen(totalCoverage)}</p>
        </div>
        <Activity className="w-10 h-10 text-emerald-500 opacity-80" />
      </div>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Claims Settled</p>
          <p className="text-3xl font-mono mt-2 text-crimson-500">{totalClaims}</p>
        </div>
        <ShieldAlert className="w-10 h-10 text-crimson-500 opacity-80" />
      </div>
    </div>
  );
};

export default StatsBar;
