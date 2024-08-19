import { http } from 'wagmi'
import { createConfig } from '@privy-io/wagmi';
import { SELECTED_NETWORK } from './constants';

export const config = createConfig({
  chains: [SELECTED_NETWORK],
  transports: {
    [SELECTED_NETWORK.id]: http(),
  },
});