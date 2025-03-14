import BotSchema from "./bots.mongo";
import {registerOnTheRace} from "../../utils/bot_web3_functions/registerOnTheRace";
import {insertUser as insertUserIntoRace} from "../races/races.model";



export const registerBotAtRace = async (raceId: string) => {
    const botWithMinimumPayload = await BotSchema.findOne()
        .sort({ connectedRaceIds: 1 })

    if (!botWithMinimumPayload) {
        throw new Error("No bots was found");
    }

    await registerOnTheRace(Number(raceId), botWithMinimumPayload.address);
    await insertUserIntoRace(raceId, botWithMinimumPayload._id as string);

    // Use MongoDB's atomic update ($addToSet) to avoid duplicates
    return BotSchema.findOneAndUpdate(
        { _id: botWithMinimumPayload._id },
        { $addToSet: { connectedRaceIds: raceId } },
        { new: true }
    );
};

export const disconnectBotsFromRace = async (raceId: string) => {
    return BotSchema.updateMany(
        { connectedRaceIds: raceId },
        { $pull: { connectedRaceIds: raceId } } // Atomic update
    );
};

export const botShouldInteractWithUser = async (
    userAddress: string,
    gameName: string,
    botAddress: string
) => {
    return BotSchema.updateOne(
        { userAddress: botAddress },
        { $set: { [`usersGameMapping.${userAddress}`]: gameName } }, // Atomic update
        { new: true }
    );
};

export const botShouldStopInteractingWithUser = async (
    userAddress: string,
    botAddress: string
) => {
    return BotSchema.updateOne(
        { userAddress: botAddress },
        { $unset: { [`usersGameMapping.${userAddress}`]: "" } }, // Atomic removal
        { new: true }
    );
};
