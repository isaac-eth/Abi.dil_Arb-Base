// src/lib/wallet.js
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Abi.dil',
  projectId: 'd4d558383685cd77b38db78a52208305',
  chains: [mainnet], // Puedes cambiarlo a base, arbitrum, etc.
  ssr: false,
});
