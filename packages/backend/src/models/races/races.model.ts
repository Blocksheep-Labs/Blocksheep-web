import Race from "./races.mongo";
import {registerBotAtRace} from "../bots/bots.model";

const insertUser = async (raceId: string, userId: string): Promise<any> => {
    return Race.findOneAndUpdate(
        { 
            raceId,
        }, 
        {
            $addToSet: {
                users: userId
            }
        }, 
        { 
            new: true, 
            upsert: true 
        }
    );
}

const getRaceDataById = async (raceId: string): Promise<any> => {
    return Race.findOne({ raceId });
}

const createRace = async (raceId: string, screenTimings: any, amountOfBots: number): Promise<any> => {
    try {
        // register bots at the race if the amount is > 0
        if (amountOfBots) {
            for (let i = 0; i < amountOfBots; i++) {
                await registerBotAtRace(raceId);
            }
        }
    } catch (err) {
        console.log(err);
    }

    return await Race.create({ raceId, screenTimings, amountOfBots });
}

const getUserParticipatesIn = async (userAddress: string): Promise<any[]> => {
    return Race.find({ users: userAddress });
}

export {
    insertUser,
    getRaceDataById,
    createRace,
    getUserParticipatesIn,
};