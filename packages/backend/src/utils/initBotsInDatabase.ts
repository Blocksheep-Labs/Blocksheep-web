import BotsSchema from "../models/bots/bots.mongo";
import UsersSchema from "../models/users/users.mongo";
import {setNameByAddress} from "../models/users/users.model";

require('dotenv').config();


const BOTS_ADDRS = (process.env.BOTS_ADDRS as string).split(',');


export default async function initBotsInDatabase() {
    console.log("[BOTS] Initializing bots...");
    const botsDBAddresses = (await BotsSchema.find()).map(i => i.address.toLowerCase());

    await Promise.all(BOTS_ADDRS.map(async address => {
        if (!botsDBAddresses.includes(address.toLowerCase())) {
            console.log(`[BOTS] Adding bot with address: ${address.toLowerCase()} ...`);

            return {
                bot:  await BotsSchema.create({address}).catch(console.error),
                user: await setNameByAddress(`bot-${address.substring(address.length - 3, address.length)}`, address),
            }
        }
        return new Promise((resolve, reject) => {
            resolve({
                bot: null,
                user: null,
            });
        });
    }));

    console.log("[BOTS] Initialized.");
}