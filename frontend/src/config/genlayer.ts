import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee";

export const getGenLayerClient = (userAccount?: string) => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api",
    provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
    account: userAccount ? ({ address: userAccount as `0x${string}` } as any) : undefined,
  });
};

export const ensureStudionetNetwork = async () => {
  if (typeof window === 'undefined' || !(window as any).ethereum) return;
  const ethereum = (window as any).ethereum;
  const chainIdHex = '0xf1ef'; // 61999
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'GenLayer Studionet',
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
          rpcUrls: ['https://studio.genlayer.com/api'],
          blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
        }],
      });
    }
  }
};
