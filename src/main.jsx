import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { base, arbitrum } from 'wagmi/chains';
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc';

import {
  connectorsForWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ⚙️ RPCs por red (puedes ponerlos en .env como VITE_BASE_RPC_URL y VITE_ARBITRUM_RPC_URL)
const { chains, publicClient } = configureChains(
  [base, arbitrum],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === base.id) {
          return {
            http:
              import.meta.env.VITE_BASE_RPC_URL ||
              'https://mainnet.base.org',
          };
        }
        if (chain.id === arbitrum.id) {
          return {
            http:
              import.meta.env.VITE_ARBITRUM_RPC_URL ||
              'https://arb1.arbitrum.io/rpc',
          };
        }
        return null;
      },
    }),
  ]
);

// 🔐 WalletConnect projectId (ponlo en .env como VITE_WC_PROJECT_ID)
const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'demo';

const connectors = connectorsForWallets([
  {
    groupName: 'Recomendadas',
    wallets: [
      metaMaskWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'Abi.dil', chains }),
      walletConnectWallet({ projectId, chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
