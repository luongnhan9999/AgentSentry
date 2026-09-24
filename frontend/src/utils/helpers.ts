export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatGen = (amountStr: string | number) => {
  const amount = Number(amountStr);
  if (isNaN(amount)) return "0.0000 GEN";
  return (amount / 1e18).toFixed(4) + " GEN";
};

export const getStatusLabel = (status: number) => {
  const mapping: Record<number, string> = {
    0: 'ACTIVE',
    1: 'CLAIM_FILED',
    2: 'INDEMNIFIED',
    3: 'CLAIM_REJECTED',
    4: 'EXPIRED'
  };
  return mapping[status] || 'UNKNOWN';
};

export const getStatusColor = (status: number) => {
  const mapping: Record<number, string> = {
    0: 'bg-emerald-500 text-white',
    1: 'bg-yellow-500 text-white',
    2: 'bg-crimson-500 text-white',
    3: 'bg-gray-500 text-white',
    4: 'bg-gray-400 text-white'
  };
  return mapping[status] || 'bg-gray-300 text-black';
};

export const parseContractResponse = (response: any) => {
  if (typeof response === 'string') {
    try {
      return JSON.parse(response);
    } catch (e) {
      return response;
    }
  }
  return response;
};
