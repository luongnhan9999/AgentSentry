import React from 'react';
import { Activity, Wallet, Shield } from 'lucide-react';
import { formatGen } from '../utils/helpers';

interface NavbarProps {
  address: string | null;
  balance: string | null;
  onConnect: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ address, balance, onConnect }) => {
  const isZeroBalance = balance === '0' || balance === '0.0000 GEN';

  return (
    <>
      <nav className="bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-sky-600" />
          <span className="font-mono font-bold text-xl tracking-tight text-gray-800">Agent<span className="text-sky-600">Sentry</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-mono text-gray-600">studionet (61999)</span>
          </div>

          {!address ? (
            <button onClick={onConnect} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-gray-700">{balance && formatGen(balance)}</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded font-mono text-sm border border-gray-200">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </nav>
      
      {address && isZeroBalance && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 flex justify-center items-center gap-2">
          <span>Your balance is 0 GEN. Please fund your wallet using the GenLayer Studio Accounts panel to interact with the contract.</span>
          <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer" className="underline font-bold">Go to Studio</a>
        </div>
      )}
    </>
  );
};

export default Navbar;
