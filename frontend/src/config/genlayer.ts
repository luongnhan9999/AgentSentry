import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee";

export const getGenLayerClient = (userAccount?: string) => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api",
    provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
    account: userAccount ? (userAccount as `0x${string}`) : undefined,
  });
};

export const ensureStudionetNetwork = async () => {
  if (typeof window === 'undefined' || !(window as any).ethereum) return;
  const ethereum = (window as any).ethereum;
  try {
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    // 61999 in hex is 0xf22f
    if (
      currentChainId && 
      (currentChainId.toLowerCase() === '0xf22f' || 
       parseInt(currentChainId, 16) === 61999 ||
       currentChainId.toLowerCase() === '0xf1ef')
    ) {
      return; // Already on GenLayer Studio network!
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xf22f' }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xf22f',
            chainName: 'GenLayer Studio',
            nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
            rpcUrls: ['https://studio.genlayer.com/api'],
            blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
          }],
        });
      }
    }
  } catch (err) {
    console.warn('Network check non-blocking warning:', err);
  }
};
