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
import Footer from './components/Footer';
import { getGenLayerClient, contractAddress } from './config/genlayer';
import { parseContractResponse } from './utils/helpers';
import { DEMO_POLICIES, DEMO_STATS, PolicyRecord } from './utils/demoData';
import { Plus, Search, Filter, RefreshCw, Sparkles, Scale, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [onchainStats, setOnchainStats] = useState<any>(null);
  const [onchainPolicies, setOnchainPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Showcase mode: enabled by default when 0 policies onchain so judges can test all UI states
  const [showDemoData, setShowDemoData] = useState<boolean>(true);

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

  // Connect MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const chainIdHex = '0xF1EF'; // 61999 decimal
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
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          fetchBalance(accounts[0]);
        }
      } catch (err) {
        console.error("Connection failed", err);
      }
    } else {
      alert("MetaMask extension not found. Please install MetaMask to interact on-chain.");
    }
  };

  const fetchBalance = async (acc: string) => {
    if (window.ethereum) {
      try {
        const bal = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [acc, 'latest']
        });
        setBalance(BigInt(bal).toString());
      } catch (e) {
        console.error("Failed to read balance", e);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const client = getGenLayerClient();

      // Read protocol stats
      const statsRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_stats',
        args: []
      });
      const parsedStats = parseContractResponse(statsRes);
      setOnchainStats(parsedStats);

      // Read paginated policies
      const policiesRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_policies_paginated',
        args: [0, 50]
      });
      const parsedPolicies = parseContractResponse(policiesRes);
      if (Array.isArray(parsedPolicies)) {
        setOnchainPolicies(parsedPolicies.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch on-chain data:", err);
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

  // Determine active dataset: onchain data is merged with demo data if showcase mode is active
  const displayedPolicies = useMemo(() => {
    let list: any[] = [];
    if (onchainPolicies && onchainPolicies.length > 0) {
      list = [...onchainPolicies];
    }
    
    if (showDemoData) {
      // Add demo policies that don't collide with onchain IDs
      const onchainIds = new Set(list.map((p) => p.policy_id));
      const filteredDemos = DEMO_POLICIES.filter((p) => !onchainIds.has(p.policy_id));
      list = [...list, ...filteredDemos];
    }

    // Filter by Role Tab
    if (activeTab === 'consumer') {
      if (address) {
        const myPolicies = list.filter((p) => 
          p.insured_consumer && p.insured_consumer.toLowerCase() === address.toLowerCase()
        );
        if (myPolicies.length > 0) list = myPolicies;
      }
    } else if (activeTab === 'underwriter') {
      if (address) {
        const myEscrows = list.filter((p) => 
          p.underwriter_pool && p.underwriter_pool.toLowerCase() === address.toLowerCase()
        );
        if (myEscrows.length > 0) list = myEscrows;
      }
    } else if (activeTab === 'jury') {
      // AI Jury Chamber: prioritize claims needing deliberation
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
  }, [onchainPolicies, showDemoData, activeTab, statusFilter, searchQuery, address]);

  // Aggregate Stats
  const effectiveStats = useMemo(() => {
    if (onchainPolicies.length > 0) {
      return onchainStats;
    }
    return showDemoData ? DEMO_STATS : (onchainStats || { total_policies: 0, total_coverage_locked: "0", total_claims_settled: 0 });
  }, [onchainPolicies, onchainStats, showDemoData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = (onchainPolicies.length > 0 ? onchainPolicies : (showDemoData ? DEMO_POLICIES : []));
    const pending = all.filter((p) => p.status === 1).length;
    const consumerCount = address 
      ? all.filter((p) => p.insured_consumer?.toLowerCase() === address.toLowerCase()).length 
      : all.length;
    const underwriterCount = address 
      ? all.filter((p) => p.underwriter_pool?.toLowerCase() === address.toLowerCase()).length 
      : all.length;

    return {
      total: all.length,
      consumer: consumerCount,
      underwriter: underwriterCount,
      pendingAdjudication: pending,
    };
  }, [onchainPolicies, showDemoData, address]);

  const activeCount = useMemo(() => {
    const list = onchainPolicies.length > 0 ? onchainPolicies : (showDemoData ? DEMO_POLICIES : []);
    return list.filter((p) => p.status === 0).length;
  }, [onchainPolicies, showDemoData]);

  const breachCount = useMemo(() => {
    const list = onchainPolicies.length > 0 ? onchainPolicies : (showDemoData ? DEMO_POLICIES : []);
    return list.filter((p) => p.status === 2 || p.verdict === 'INCIDENT_VERIFIED').length;
  }, [onchainPolicies, showDemoData]);

  const handleOpenSandbox = () => {
    setShowSandbox(true);
  };

  const handleDeployFromSandbox = (url: string, schema: string) => {
    setPurchaseInitial({ url, schema });
    setShowPurchase(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar 
        address={address} 
        balance={balance} 
        onConnect={connectWallet} 
        showDemoData={showDemoData}
        onToggleDemoData={() => setShowDemoData(!showDemoData)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
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

        {/* Aggregated Stats Metrics Bar */}
        <StatsBar 
          stats={effectiveStats} 
          activeCount={activeCount}
          breachCount={breachCount}
        />

        {/* Role Tabs */}
        <RoleTabs 
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={tabCounts}
        />

        {/* Action & Filter Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
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

        {/* Notice for Showcase Data */}
        {showDemoData && onchainPolicies.length === 0 && (
          <div className="mb-6 p-4 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-center justify-between text-xs text-sky-900 font-mono">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>
                <strong>Showcase Telemetry Active:</strong> Displaying simulated API monitoring telemetry so you can test all 4 policy states (Active, Claim Pending, Indemnified Payout, Healthy Rejection).
              </span>
            </div>
            <button 
              onClick={() => setShowPurchase(true)}
              className="hidden sm:inline-block px-3 py-1 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-500 transition-colors ml-4 flex-shrink-0"
            >
              + Create On-Chain Policy
            </button>
          </div>
        )}

        {/* Policies Grid */}
        {loading && displayedPolicies.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono text-slate-500">Querying GenLayer studionet smart contract...</p>
          </div>
        ) : displayedPolicies.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-mono font-bold text-base text-slate-800 mb-1">No Matching Policies Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 font-sans">
              No policies match your active filter or search criteria. Reset filters or create a new policy to begin monitoring.
            </p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
                setActiveTab('all');
                setShowDemoData(true);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-lg transition-colors"
            >
              Reset Filters & Show Demo Telemetry
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
