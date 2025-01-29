const Race = require("./races.mongo");


const insertUser = async(raceId, userId) => {
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

const getRaceDataById = async(raceId) => {
    return await Race.findOne({ raceId });
}

const createRace = async(raceId) => {
    return await Race.insertMany([ {raceId} ]);
}

const getUserParticipatesIn = async(userAddress) => {
    return await Race.find({ users: userAddress });
}


module.exports = {
    insertUser,
    getRaceDataById,
    createRace,
    getUserParticipatesIn,
}