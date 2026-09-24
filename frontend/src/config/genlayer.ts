import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x2aEaFC5C6e2e9967B19b82707537b3798C2F4b7e";

export const getGenLayerClient = () => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api"
  });
};
