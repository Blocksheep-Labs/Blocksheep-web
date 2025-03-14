require('dotenv').config();

export default {
    PORT: process.env.PORT || 8000,
    CLIENT_BASE: process.env.CLIENT_BASE as string,
    MONGO_URL: process.env.MONGO_URL as string,
    BLOCKSHEEP_CONTRACT_ADDRESS: process.env.BLOCKSHEEP_CONTRACT_ADDRESS as string,
    USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS as string,
    BOTS_ADDRS: String(process.env.BOTS_ADDRS).split(','),
    BOTS_PRIVATE_KEYS: String(process.env.BOTS_PRIVATE_KEYS).split(','),
    RPC_URL: process.env.RPC_URL as string,
}
