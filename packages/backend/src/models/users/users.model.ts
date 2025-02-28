import User from "./users.mongo";

interface IFinishRaceStat {
    raceId: number;
    previousGamesAboveAverage: number;
    newGamesAboveAverage: number;
}

const setNameByAddress = async (name: string, address: string): Promise<any> => {
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

const getUserDataByAddress = async (address: string): Promise<any> => {
    return await User.findOne({ address });
}

const finishRace = async (address: string, type: "increment" | "decrement", raceId: number): Promise<any> => {
    const user = await User.findOne({ address });
    if (!user) {
        throw new Error("User was not found");
    }

    // Ensure the race isn't already recorded
    const raceExists = user.finishedRaces.some(i => Number(i.raceId) === Number(raceId));
    if (raceExists) {
        return;
    }

    const incrementValue = type === "increment" ? 1 : type === "decrement" && user.gamesAboveAverage > 0 ? -1 : 0;
    const stat = {
        raceId,
        previousGamesAboveAverage: user.gamesAboveAverage,
        newGamesAboveAverage: user.gamesAboveAverage + incrementValue
    };

    // Update the user in one atomic operation
    return await User.findOneAndUpdate(
        { address },
        {
            $inc: { gamesAboveAverage: incrementValue },
            $addToSet: { finishedRaces: stat },
            $set: { previousGamesAboveAverage: user.gamesAboveAverage }
        },
        { new: true }
    );
};


export {
    setNameByAddress,
    getUserDataByAddress,
    finishRace,
};