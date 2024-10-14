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

const createRace = async(raceId, storyKey) => {
    return await Race.insertMany([ {raceId, storyKey} ]);
}


module.exports = {
    insertUser,
    getRaceDataById,
    createRace,
}