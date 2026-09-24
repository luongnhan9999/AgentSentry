import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import PolicyCard from './components/PolicyCard';
import PurchasePolicy from './components/PurchasePolicy';
import FileClaimModal from './components/FileClaimModal';
import DiagnosticInspectorModal from './components/DiagnosticInspectorModal';
import { getGenLayerClient, contractAddress } from './config/genlayer';
import { parseContractResponse } from './utils/helpers';
import { Plus } from 'lucide-react';

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPurchase, setShowPurchase] = useState(false);
  const [claimPolicy, setClaimPolicy] = useState<{id: string, coverage: string} | null>(null);
  const [inspectPolicy, setInspectPolicy] = useState<any>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const chainIdHex = '0xF1EF'; // 61999 in hex is 0xF1EF
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902 || switchError.code === -32603) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chainIdHex,
                  chainName: 'Genlayer Studio Network',
                  rpcUrls: ['https://studio.genlayer.com/api'],
                  nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
                  blockExplorerUrls: ['https://genlayer-explorer.vercel.app'],
                },
              ],
            });
          }
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      } catch (err) {
        console.error("Connection failed", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchBalance = async (acc: string) => {
    if (window.ethereum) {
      const bal = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [acc, 'latest']
      });
      setBalance(BigInt(bal).toString());
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const client = getGenLayerClient();
      const statsRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_stats',
        args: []
      });
      setStats(parseContractResponse(statsRes));

      const policiesRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_policies_paginated',
        args: [0, 50] // First 50 for simplicity
      });
      const parsedPolicies = parseContractResponse(policiesRes);
      if (Array.isArray(parsedPolicies)) {
        setPolicies(parsedPolicies.reverse()); // Show newest first
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAddress(null);
          setBalance(null);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar address={address} balance={balance} onConnect={connectWallet} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-mono tracking-tight">Network Telemetry</h1>
            <p className="text-gray-500 mt-1">Real-time endpoint monitoring and outage insurance</p>
          </div>
          <button 
            onClick={() => setShowPurchase(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Policy
          </button>
        </div>

        <StatsBar stats={stats} />

        <h2 className="text-xl font-bold mb-4 font-mono">Active Policies</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-lg">
            <p className="text-gray-500">No policies found on the network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((p: any) => (
              <PolicyCard 
                key={p.policy_id} 
                policy={p} 
                onInspect={setInspectPolicy}
                onFileClaim={(id, cov) => setClaimPolicy({id, coverage: cov})}
                onRefresh={fetchData}
              />
            ))}
          </div>
        )}
      </main>

      {showPurchase && <PurchasePolicy onClose={() => setShowPurchase(false)} onSuccess={fetchData} />}
      {claimPolicy && <FileClaimModal policyId={claimPolicy.id} coverageGen={claimPolicy.coverage} onClose={() => setClaimPolicy(null)} onSuccess={fetchData} />}
      {inspectPolicy && <DiagnosticInspectorModal policy={inspectPolicy} onClose={() => setInspectPolicy(null)} />}
    </div>
  );
}

export default App;
