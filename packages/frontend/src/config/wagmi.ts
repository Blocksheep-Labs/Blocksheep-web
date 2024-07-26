import { http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { createConfig } from '@privy-io/wagmi';

export const config = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(),
  },
});