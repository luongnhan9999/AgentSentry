import React from 'react';
import { Globe, UserCheck, Landmark, Scale, Terminal, CheckCircle2, AlertOctagon } from 'lucide-react';

interface RoleTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  counts: {
    total: number;
    consumer: number;
    underwriter: number;
    pendingAdjudication: number;
  };
}

const RoleTabs: React.FC<RoleTabsProps> = ({ activeTab, onSelectTab, counts }) => {
  const tabs = [
    {
      id: 'all',
      label: 'Global Telemetry',
      icon: Globe,
      badge: counts.total,
      badgeColor: 'bg-slate-100 text-slate-700',
      description: 'All active and settled policies across the protocol'
    },
    {
      id: 'consumer',
      label: 'Consumer Portal',
      icon: UserCheck,
      badge: counts.consumer,
      badgeColor: 'bg-sky-100 text-sky-800',
      description: 'Manage your insured API endpoints & file breach claims'
    },
    {
      id: 'underwriter',
      label: 'Underwriter Vault',
      icon: Landmark,
      badge: counts.underwriter,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Capital escrow pools, premium returns & expired reclaim'
    },
    {
      id: 'jury',
      label: 'AI Jury Chamber',
      icon: Scale,
      badge: counts.pendingAdjudication,
      badgeColor: counts.pendingAdjudication > 0 ? 'bg-red-100 text-red-700 animate-pulse font-bold' : 'bg-slate-100 text-slate-500',
      description: 'Incident triage queue awaiting GenLayer consensus adjudication'
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-between px-4 py-3 rounded-lg text-sm font-mono font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-sky-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleTabs;
