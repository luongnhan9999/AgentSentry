import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee";

export const getGenLayerClient = () => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api"
  });
};
