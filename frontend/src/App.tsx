import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import RoleTabs from './components/RoleTabs';
import PolicyCard from './components/PolicyCard';
import PurchasePolicy from './components/PurchasePolicy';
import FileClaimModal from './components/FileClaimModal';
import DiagnosticInspectorModal from './components/DiagnosticInspectorModal';
import ProbeSandboxModal from './components/ProbeSandboxModal';
import ProtocolArchitecture from './components/ProtocolArchitecture';
import TelemetryHeartbeat from './components/TelemetryHeartbeat';
import JuryQuorumVisualizer from './components/JuryQuorumVisualizer';
import Footer from './components/Footer';
import { getGenLayerClient, contractAddress } from './config/genlayer';
import { parseContractResponse } from './utils/helpers';
import { Plus, Search, Filter, RefreshCw, Scale, ShieldAlert, CheckCircle2, AlertCircle, Shield, ArrowRight } from 'lucide-react';

const getEthereumProvider = () => {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  if (anyWindow.ethereum?.providers?.length) {
    const metaMask = anyWindow.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMask) return metaMask;
  }
  return anyWindow.ethereum || null;
};

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [onchainStats, setOnchainStats] = useState<any>({
    total_policies: 0,
    total_coverage_locked: "0",
    total_claims_settled: 0,
  });
  const [onchainPolicies, setOnchainPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Tab navigation: 'all' | 'consumer' | 'underwriter' | 'jury'
  const [activeTab, setActiveTab] = useState<string>('all');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseInitial, setPurchaseInitial] = useState<{ url?: string; schema?: string }>({});
  const [claimPolicy, setClaimPolicy] = useState<{ id: string; coverage: string } | null>(null);
  const [inspectPolicy, setInspectPolicy] = useState<any>(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // Read Balance
  const fetchBalance = async (acc: string) => {
    const provider = getEthereumProvider();
    if (provider) {
      try {
        const bal = await provider.request({
          method: 'eth_getBalance',
          params: [acc, 'latest']
        });
        setBalance(BigInt(bal).toString());
      } catch (e) {
        console.error("Failed to read balance", e);
      }
    }
  };

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    const provider = getEthereumProvider();
    
    if (!provider) {
      alert("MetaMask not found! Please install the MetaMask browser extension to connect.");
      setIsConnecting(false);
      return;
    }

    try {
      // Step 1: Request account authorization FIRST
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const acc = accounts[0];
        setAddress(acc);
        fetchBalance(acc);
      }

      // Step 2: Switch / Add studionet chain smoothly
      const chainIdHex = '0xF1EF'; // 61999 in hex
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        if (
          switchError?.code === 4902 || 
          switchError?.code === -32603 ||
          switchError?.data?.originalError?.code === 4902
        ) {
          try {
            await provider.request({
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
          } catch (addErr) {
            console.warn("Could not add Genlayer Studio Network", addErr);
          }
        }
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      if (err?.code === 4001) {
        alert("Wallet connection request was rejected in MetaMask.");
      } else {
        alert(err?.message || "Failed to connect to MetaMask.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
  };

  // Fetch 100% Real On-Chain Contract Data
  const fetchData = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    setLoading(true);
    try {
      const client = getGenLayerClient();

      // Read protocol stats from contract
      const statsRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_stats',
        args: []
      });
      const parsedStats = parseContractResponse(statsRes);
      if (parsedStats && typeof parsedStats === 'object') {
        setOnchainStats(parsedStats);
      }

      // Read real paginated policies from contract
      const policiesRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_policies_paginated',
        args: [0, 50]
      });
      const parsedPolicies = parseContractResponse(policiesRes);
      if (Array.isArray(parsedPolicies)) {
        setOnchainPolicies(parsedPolicies.reverse());
      } else {
        setOnchainPolicies([]);
      }
    } catch (err: any) {
      console.warn("Notice: on-chain data fetch (auto-retrying):", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  // Check already authorized account on initial load
  useEffect(() => {
    fetchData();

    const provider = getEthereumProvider();
    if (provider) {
      provider.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            fetchBalance(accounts[0]);
          }
        })
        .catch(console.error);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAddress(null);
          setBalance(null);
        }
      };

      provider.on?.('accountsChanged', handleAccountsChanged);
      const pollTimer = setInterval(() => {
        if (!document.hidden) fetchData();
      }, 25000);

      return () => {
        clearInterval(pollTimer);
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    } else {
      const pollTimer = setInterval(() => {
        if (!document.hidden) fetchData();
      }, 25000);
      return () => clearInterval(pollTimer);
    }
  }, []);

  // Filter 100% real onchain policies
  const displayedPolicies = useMemo(() => {
    let list: any[] = [...onchainPolicies];

    // Filter by Role Tab
    if (activeTab === 'consumer') {
      if (address) {
        list = list.filter((p) => 
          p.insured_consumer && p.insured_consumer.toLowerCase() === address.toLowerCase()
        );
      }
    } else if (activeTab === 'underwriter') {
      if (address) {
        list = list.filter((p) => 
          p.underwriter_pool && p.underwriter_pool.toLowerCase() === address.toLowerCase()
        );
      }
    } else if (activeTab === 'jury') {
      // AI Jury Chamber: filter claims awaiting adjudication
      list = list.filter((p) => p.status === 1);
    }

    // Filter by Status Dropdown
    if (statusFilter !== 'ALL') {
      const statusNum = parseInt(statusFilter, 10);
      list = list.filter((p) => p.status === statusNum);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => 
        (p.policy_id && p.policy_id.toLowerCase().includes(q)) ||
        (p.target_endpoint_url && p.target_endpoint_url.toLowerCase().includes(q)) ||
        (p.verdict && p.verdict.toLowerCase().includes(q))
      );
    }

    return list;
  }, [onchainPolicies, activeTab, statusFilter, searchQuery, address]);

  // Tab counts based on real onchain data
  const tabCounts = useMemo(() => {
    const pending = onchainPolicies.filter((p) => p.status === 1).length;
    const consumerCount = address 
      ? onchainPolicies.filter((p) => p.insured_consumer?.toLowerCase() === address.toLowerCase()).length 
      : 0;
    const underwriterCount = address 
      ? onchainPolicies.filter((p) => p.underwriter_pool?.toLowerCase() === address.toLowerCase()).length 
      : 0;

    return {
      total: onchainPolicies.length,
      consumer: consumerCount,
      underwriter: underwriterCount,
      pendingAdjudication: pending,
    };
  }, [onchainPolicies, address]);

  const activeCount = useMemo(() => {
    return onchainPolicies.filter((p) => p.status === 0).length;
  }, [onchainPolicies]);

  const breachCount = useMemo(() => {
    return onchainPolicies.filter((p) => p.status === 2 || p.verdict === 'INCIDENT_VERIFIED').length;
  }, [onchainPolicies]);

  const handleOpenSandbox = () => {
    setShowSandbox(true);
  };

  const handleDeployFromSandbox = (url: string, schema: string) => {
    setPurchaseInitial({ url, schema });
    setShowPurchase(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans telemetry-grid">
      {/* Top Navbar with Disconnect */}
      <Navbar 
        address={address} 
        balance={balance} 
        onConnect={connectWallet} 
        onDisconnect={disconnectWallet}
        isConnecting={isConnecting}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Live Hardware Telemetry Oscilloscope */}
        <TelemetryHeartbeat activeCount={activeCount} />

        {/* Hero Section */}
        <HeroSection 
          onNewPolicy={() => {
            setPurchaseInitial({});
            setShowPurchase(true);
          }}
          onOpenSandbox={handleOpenSandbox}
          onSelectRole={(r) => setActiveTab(r)}
          activeRole={activeTab}
        />

        {/* Aggregated On-Chain Stats */}
        <StatsBar 
          stats={onchainStats} 
          activeCount={activeCount}
          breachCount={breachCount}
        />

        {/* If in AI Jury Chamber, render JuryQuorumVisualizer */}
        {activeTab === 'jury' && (
          <JuryQuorumVisualizer pendingCount={tabCounts.pendingAdjudication} />
        )}

        {/* Role Tabs */}
        <RoleTabs 
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={tabCounts}
        />

        {/* Action & Filter Bar */}
        <div className="hud-card rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, endpoint URL, verdict..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 text-xs font-mono border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="0">Active (0)</option>
                <option value="1">Claim Filed (1)</option>
                <option value="2">Indemnified (2)</option>
                <option value="4">Expired (4)</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              title="Refresh on-chain state"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-mono transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            <button
              onClick={() => {
                setPurchaseInitial({});
                setShowPurchase(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Policy
            </button>
          </div>
        </div>

        {/* 100% Real On-Chain Policies Grid */}
        {loading && onchainPolicies.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono text-slate-500">Querying GenLayer studionet contract at {contractAddress}...</p>
          </div>
        ) : onchainPolicies.length === 0 ? (
          <div className="hud-card text-center py-16 rounded-2xl shadow-sm p-8 bg-white border border-slate-200">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1">
              0 Policies Registered on studionet
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 font-sans leading-relaxed">
              The AgentSentry contract (<code className="font-mono text-slate-800">{contractAddress}</code>) is fully deployed and active on GenLayer studionet. Connect your wallet and create your first SLA insurance policy to initiate continuous on-chain AI telemetry monitoring.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setPurchaseInitial({});
                  setShowPurchase(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Underwrite First Policy
              </button>
              <button
                onClick={handleOpenSandbox}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold rounded-xl transition-colors border border-slate-200"
              >
                Test Probe in Sandbox
              </button>
            </div>
          </div>
        ) : displayedPolicies.length === 0 ? (
          <div className="hud-card text-center py-12 rounded-2xl shadow-sm p-8">
            <h3 className="font-mono font-bold text-sm text-slate-800 mb-1">No Policies Match Selected Role Filter</h3>
            <p className="text-xs text-slate-500 mb-4 font-sans">
              {activeTab === 'consumer' 
                ? "You haven't purchased any SLA policies under your connected wallet yet."
                : activeTab === 'underwriter'
                ? "You haven't funded any underwriter escrow pools yet."
                : "No active incident claims are currently awaiting AI jury deliberation."}
            </p>
            <button
              onClick={() => {
                setActiveTab('all');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-lg transition-colors"
            >
              View All Network Policies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPolicies.map((policy: any) => (
              <PolicyCard 
                key={policy.policy_id} 
                policy={policy} 
                onInspect={setInspectPolicy}
                onFileClaim={(id, cov) => setClaimPolicy({ id, coverage: cov })}
                onRefresh={fetchData}
                userAddress={address}
                activeRole={activeTab}
              />
            ))}
          </div>
        )}

        {/* Architecture & GenLayer Fit Section */}
        <ProtocolArchitecture />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showPurchase && (
        <PurchasePolicy 
          onClose={() => setShowPurchase(false)} 
          onSuccess={fetchData}
          initialUrl={purchaseInitial.url}
          initialSchema={purchaseInitial.schema}
          userAddress={address}
        />
      )}

      {claimPolicy && (
        <FileClaimModal 
          policyId={claimPolicy.id} 
          coverageGen={claimPolicy.coverage} 
          onClose={() => setClaimPolicy(null)} 
          onSuccess={fetchData} 
        />
      )}

      {inspectPolicy && (
        <DiagnosticInspectorModal 
          policy={inspectPolicy} 
          onClose={() => setInspectPolicy(null)} 
        />
      )}

      {showSandbox && (
        <ProbeSandboxModal 
          onClose={() => setShowSandbox(false)} 
          onDeployPreset={handleDeployFromSandbox}
        />
      )}
    </div>
  );
}

export default App;
