import Race from "./races.mongo";

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
    return await Race.insertMany([{ raceId, screenTimings, amountOfBots }]);
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