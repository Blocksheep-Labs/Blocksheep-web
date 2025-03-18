import BotSchema from "./bots.mongo";
import UsersSchema from "../users/users.mongo";
import {registerOnTheRace} from "../../utils/bot_web3_functions/registerOnTheRace";
import {insertUser as insertUserIntoRace} from "../races/races.model";



export const registerBotAtRace = async (raceId: string) => {
    const rid = Number(raceId.split('-')[1]);

    const botWithMinimumPayload = await BotSchema.findOne()
        .sort({ connectedRaceIds: 1 })

    if (!botWithMinimumPayload) {
        throw new Error("No bots was found");
    }

    const botAsUserEntity = await UsersSchema.findOne({ address: botWithMinimumPayload.address });

    if (!botAsUserEntity) {
        throw new Error(`Bot ${botWithMinimumPayload.address} is not initialized as user`);
    }

    await registerOnTheRace(rid, botWithMinimumPayload.address);
    await insertUserIntoRace(raceId, botAsUserEntity._id as string);

    // Use MongoDB's atomic update ($addToSet) to avoid duplicates
    return BotSchema.findOneAndUpdate(
        { _id: botWithMinimumPayload._id },
        { $addToSet: { connectedRaceIds: rid } },
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
