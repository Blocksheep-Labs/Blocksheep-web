import Race from "./races.mongo";

const insertUser = async (raceId: string, userId: string): Promise<any> => {
    return await Race.findOneAndUpdate(
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
    return await Race.findOne({ raceId });
}

const createRace = async (raceId: string): Promise<any> => {
    return await Race.insertMany([{ raceId }]);
}

const getUserParticipatesIn = async (userAddress: string): Promise<any[]> => {
    return await Race.find({ users: userAddress });
}

export {
    insertUser,
    getRaceDataById,
    createRace,
    getUserParticipatesIn,
};