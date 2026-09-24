import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x90dbdC2caA70f014867C7a6C85A918fA6f74C810";

export const getGenLayerClient = () => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api"
  });
};
