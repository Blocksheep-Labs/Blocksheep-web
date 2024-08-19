import { bscTestnet } from "viem/chains";

export const BLOCK_SHEEP_CONTRACT = import.meta.env.VITE_BLOCKSHEEP_ADDR;
export const USDC_ADDR = import.meta.env.VITE_MOCK_USDC_ADDR;
export const USDC_MULTIPLIER = 10**6;
export const SERVER_BASE = import.meta.env.VITE_SERVER_BASE;

export const PIMLICO_BUNDLER_URL = import.meta.env.VITE_PIMLICO_BUNDLER_URL;
export const PIMLICO_PAYMASTER_URL = import.meta.env.VITE_PIMLICO_PAYMASTER_URL;
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

export const SELECTED_NETWORK = bscTestnet;
//export const SMART_ACCOUNT_FACTORY_ADDRESS = "0x0000000000400CdFef5E2714E63d8040b700BC24";