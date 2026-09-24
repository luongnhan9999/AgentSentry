import React, { useState } from 'react';
import { Activity, Wallet, Shield, HelpCircle, ExternalLink, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import { formatGen } from '../utils/helpers';
import { contractAddress } from '../config/genlayer';

interface NavbarProps {
  address: string | null;
  balance: string | null;
  onConnect: () => void;
  showDemoData: boolean;
  onToggleDemoData: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  address, 
  balance, 
  onConnect, 
  showDemoData, 
  onToggleDemoData 
}) => {
  const [showFaucetHelp, setShowFaucetHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const isZeroBalance = balance === '0' || balance === '0.0000 GEN';

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-xl tracking-tight text-slate-900">
                  Agent<span className="text-sky-600">Sentry</span>
                </span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-mono font-bold rounded-full border border-sky-200">
                  SLA COURT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
                Autonomous API Uptime & Silent Degradation Insurance
              </p>
            </div>
          </div>
          
          {/* Controls & Wallet */}
          <div className="flex items-center gap-3">
            {/* Showcase Toggle */}
            <button
              onClick={onToggleDemoData}
              title="Toggle realistic simulated telemetry policies when no on-chain policies exist yet"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                showDemoData 
                  ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/30' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${showDemoData ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Showcase Data:</span>
              <span>{showDemoData ? 'ON' : 'OFF'}</span>
            </button>

            {/* Network Badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700 font-bold">studionet</span>
              <span className="text-slate-400">#61999</span>
            </div>

            {/* Faucet Helper Button */}
            <button 
              onClick={() => setShowFaucetHelp(true)}
              className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-mono flex items-center gap-1"
              title="How to get free GEN tokens on studionet"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Faucet Guide</span>
            </button>

            {/* Wallet Button */}
            {!address ? (
              <button 
                onClick={onConnect} 
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all shadow-sm hover:scale-[1.02]"
              >
                <Wallet className="w-4 h-4" /> Connect MetaMask
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {balance && (
                  <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Balance</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{formatGen(balance)}</span>
                  </div>
                )}
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-mono text-xs border border-slate-200 transition-colors"
                  title="Click to copy address"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Zero balance banner */}
      {address && isZeroBalance && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex justify-center items-center gap-2 text-center">
          <span>⚠️ <strong>Your wallet has 0 GEN on studionet.</strong> Need test tokens to purchase SLA coverage or stake claims?</span>
          <button 
            onClick={() => setShowFaucetHelp(true)} 
            className="underline font-bold text-amber-950 hover:text-black ml-1"
          >
            How to fund your account →
          </button>
        </div>
      )}

      {/* Faucet Modal */}
      {showFaucetHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-base text-slate-900">How to Fund Wallet on studionet</h3>
                  <p className="text-xs text-slate-500">GenLayer studionet operates as an isolated execution environment</p>
                </div>
              </div>
              <button onClick={() => setShowFaucetHelp(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 font-sans">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-mono font-bold text-slate-900 mb-1">1. Open GenLayer Studio</p>
                <p>Navigate to <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer" className="text-sky-600 underline font-mono">https://studio.genlayer.com</a> and look at the bottom-left <strong>Accounts</strong> panel.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-mono font-bold text-slate-900 mb-1">2. Transfer Pre-Funded GEN</p>
                <p>GenLayer Studio provides pre-funded developer accounts with millions of GEN. Click on an account with funds, select <strong>Transfer</strong>, paste your MetaMask address, and send 10-50 GEN.</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-mono font-bold mb-1">⚠️ Important: Do NOT use Testnet Faucet</p>
                <p>The public faucet at testnet-faucet is for Asimov/Bradbury testnets only and does NOT fund studionet.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowFaucetHelp(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-mono text-xs font-bold transition-colors"
              >
                Got It
              </button>
              <a
                href="https://studio.genlayer.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-mono text-xs font-bold transition-colors shadow-sm"
              >
                Open Studio <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
