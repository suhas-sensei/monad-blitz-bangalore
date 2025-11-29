import type { PrivyClientConfig } from '@privy-io/react-auth';

export const monadTestnet = {
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
};

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users',
    },
  },
  loginMethods: ['email', 'wallet'],
  defaultChain: monadTestnet,
  supportedChains: [monadTestnet],
  appearance: {
    theme: 'dark',
    accentColor: '#F59E0B',
    logo: undefined,
    walletList: ['metamask'],
  },
};
