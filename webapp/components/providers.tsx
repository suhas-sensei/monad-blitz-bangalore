'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { privyConfig } from '@/lib/privy-config';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { ReactNode } from 'react';
import { defineChain } from 'viem';

const queryClient = new QueryClient();
 
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://testnet.monadvision.com',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  if (!privyAppId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#27262c' }}>
        <div className="text-center max-w-2xl space-y-4 text-yellow-400">
          <h1 className="text-2xl font-bold">Privy App ID required</h1>
          <p className="opacity-75">Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local</p>
          <p className="text-sm opacity-60">Get your ID from https://dashboard.privy.io/</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
