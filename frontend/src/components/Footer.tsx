import React from 'react';
import { Shield, ExternalLink, Github, Terminal, Activity, FileText } from 'lucide-react';
import { contractAddress } from '../config/genlayer';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-sky-600" />
              <span className="font-mono font-bold text-lg text-slate-900">
                Agent<span className="text-sky-600">Sentry</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Autonomous AI Agent Service-Level & API Uptime Insurance Protocol on GenLayer. 
              Decentralized AI jury consensus adjudicating outage incidents directly on-chain.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                studionet Live
              </span>
            </div>
          </div>

          {/* Col 2: Network Parameters */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
              Network Specs
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-600">
              <li>Chain ID: <span className="text-slate-900 font-bold">61999 (0xF1EF)</span></li>
              <li>Network: <span className="text-slate-900 font-bold">studionet</span></li>
              <li>Consensus: <span className="text-slate-900 font-bold">Optimistic Democracy</span></li>
              <li>VM Runtime: <span className="text-slate-900 font-bold">GenVM (Python 3.12)</span></li>
              <li>Anti-Spam Deposit: <span className="text-slate-900 font-bold">5% Coverage</span></li>
            </ul>
          </div>

          {/* Col 3: Smart Contract */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
              Deployed Protocol
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-600">
              <li>
                <a 
                  href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 flex items-center gap-1 truncate"
                >
                  <span className="truncate">{contractAddress}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </li>
              <li>
                <a 
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 flex items-center gap-1"
                >
                  GenLayer Studio IDE <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://portal.genlayer.foundation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 flex items-center gap-1"
                >
                  GenLayer Builder Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Links & Resources */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
              Resources & Repo
            </h4>
            <ul className="space-y-2 text-xs font-sans text-slate-600">
              <li>
                <a 
                  href="https://github.com/luongnhan9999/AgentSentry"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 flex items-center gap-1.5 font-mono text-xs"
                >
                  <Github className="w-3.5 h-3.5" /> luongnhan9999/AgentSentry
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.genlayer.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 flex items-center gap-1"
                >
                  GenLayer Official Docs <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-slate-400">Track: Agentic Economy Infrastructure</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 font-mono gap-4">
          <p>© 2026 AgentSentry Protocol. Built for GenLayer Builder Program.</p>
          <div className="flex items-center gap-4">
            <span>Powered by GenLayer Intelligent Contracts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
