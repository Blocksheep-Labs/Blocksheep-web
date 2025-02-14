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

    // ensure that the user has been modified since the points distribution of the race
    if (user.finishedRaces.map(i => Number(i.raceId)).includes(Number(raceId))) {
        return;
    }

    const stat: IFinishRaceStat = {
        raceId,
        previousGamesAboveAverage: user.gamesAboveAverage,
        newGamesAboveAverage: 0,
    };

    // to track state on the frontend
    user.previousGamesAboveAverage = user.gamesAboveAverage;
    if (type === "increment") {
        stat.newGamesAboveAverage = stat.previousGamesAboveAverage + 1;
        user.gamesAboveAverage++;
    }
    
    if (type === "decrement") {
        if (user.gamesAboveAverage - 1 >= 0) {
            stat.newGamesAboveAverage = stat.previousGamesAboveAverage - 1;
            user.gamesAboveAverage--;
        }
    }
    
    user.finishedRaces.push(stat);

    return await user.save();
}

export {
    setNameByAddress,
    getUserDataByAddress,
    finishRace,
};