// src/lib/constants.js
export const CONTRACT_BY_CHAIN = {
  8453: "0xa3016C0793e3951B0ec3dF96D667b5E5F9DfA4bf", // Base proxy (ajusta si es distinto)
  42161: "0xB35277ae23d34FC6cd4CC230C5528db55F8289CB", // Arbitrum proxy
};

export const TOKENS_BY_CHAIN = {
  8453: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  42161: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    MXNB: "0xf197ffc28c23e0309b5559e7a166f2c6164c80aa",
  },
};

export const getDefaultTokenForChain = (chainId) => {
  const map = TOKENS_BY_CHAIN[chainId] || TOKENS_BY_CHAIN[8453];
  return map.USDC || Object.values(map)[0];
};
