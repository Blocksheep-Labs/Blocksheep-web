const User = require("./users.mongo");

const setNameByAddress = async(name, address) => {
    return await User.findOneAndUpdate(
        { 
            address 
        },
        { 
            name 
        },
        { 
            new: true, 
            upsert: true 
        }
    );
}

const getUserDataByAddress = async(address) => {
    return await User.findOne({ address });
}

const finishRace = async(address, type, raceId) => {
    const user = await User.findOne({ address });
    if (!user) {
        throw new Error("User was not found");
    }

    if (type == "increment") {
        user.gamesAboveAverage++;
    }

    if (type == "decrement") {
        user.gamesAboveAverage--;
    }

    user.finishedRaces.push(raceId);

    return await user.save();
}


module.exports = {
    setNameByAddress,
    getUserDataByAddress,
    finishRace,
}