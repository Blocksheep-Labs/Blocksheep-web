import BotsSchema from "../models/bots/bots.mongo";
require('dotenv').config();


const BOTS_ADDRS = (process.env.BOTS_ADDRS as string).split(',');


export default async function initBotsInDatabase() {
    console.log("[BOTS] Initializing bots...");
    const botsDBAddresses = (await BotsSchema.find()).map(i => i.address.toLowerCase());

    await Promise.all(BOTS_ADDRS.map(async address => {
        if (!botsDBAddresses.includes(address.toLowerCase())) {
            console.log(`[BOTS] Adding bot with address: ${address.toLowerCase()} ...`);
            return BotsSchema.create({address}).catch(console.error);
        }
        return new Promise<void>((resolve, reject) => { resolve(); });
    }));

    console.log("[BOTS] Initialized.");
}