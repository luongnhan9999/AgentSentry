export const truncateAddress = (address: string) => {
  if (!address) return "0x0000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatGen = (amountStr: string | number) => {
  const amount = Number(amountStr);
  if (isNaN(amount) || amount === 0) return "0.0000 GEN";
  const gen = amount / 1e18;
  if (gen < 0.0001) return "< 0.0001 GEN";
  return gen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " GEN";
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
    0: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    1: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    2: 'bg-red-100 text-red-800 border border-red-300 font-bold',
    3: 'bg-slate-100 text-slate-700 border border-slate-200',
    4: 'bg-slate-100 text-slate-500 border border-slate-200'
  };
  return mapping[status] || 'bg-slate-100 text-slate-700';
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
