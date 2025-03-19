import botsSchema from "../models/bots/bots.mongo";
import {makeMove} from "./bot_web3_functions/makeMove";
import {distribute} from "./bot_web3_functions/distribute";

interface IUserMadeChoice {
    type: "makeMove" | "distribute",
    game: "UNDERDOG" | "RABBITHOLE" | "BULLRUN",
    raceId: number,
    data: any,
}


export default async function handleUserChoiceWithBot({ game, raceId, type, data }: IUserMadeChoice) {
    // based on the game bot participates in - listens to users choices (submissions)
    // and participates in the race too


    // get bots participating in provided raceId as Number
    let bots = await botsSchema.find({ connectedRaceIds: String(raceId) });

    // ensure that we have bots at race
    if (!bots.length) {
        console.log(`No bots was found at race: ${raceId}, move skipped.`);
        return;
    }

    switch (game) {
        case "BULLRUN":
            break;
        case "RABBITHOLE":
            break;
        case "UNDERDOG":
            await Promise.all(
                bots.map(async (i) => {
                    if (
                        !i.isMakingMoveMap.get(String(raceId)) &&
                        type == "makeMove" &&
                        !(i.underdogPassedQuestionIndexes.get(String(raceId)) || []).includes(Number(data.questionIndex))
                    ) {
                        console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: UNDERDOG`);
                        // lock bot in race id (making move)
                        await botsSchema.findOneAndUpdate(
                            { address: i.address },
                            {
                                $set: { [`isMakingMoveMap.${raceId}`]: true },
                                $push: { [`underdogPassedQuestionIndexes.${raceId}`]: Number(data.questionIndex) }
                            },
                            { upsert: true }
                        );
                        const makeMoveData = await makeMove(
                            "UNDERDOG",
                            raceId,
                            i.address,
                            data, // underdog data
                            undefined, // rabbithole data should be empty
                            undefined // bullrun data should be empty
                        );

                        // lock bot in race id (making move)
                        await botsSchema.findOneAndUpdate(
                            { address: i.address },
                            {
                                $set: { [`isMakingMoveMap.${raceId}`]: false },
                            },
                            { upsert: true }
                        );

                        return makeMoveData;
                    } else if (!i.isDistributingMap.get(String(raceId)) && type == "distribute") {
                        console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}`);
                        // lock bot in race id (distributing reward)
                        await botsSchema.findOneAndUpdate(
                            {address: i.address},
                            { $set: { [`isDistributingMap.${raceId}`]: true } },
                            { upsert: true }
                        );
                        const distributeData = await distribute(
                            "UNDERDOG",
                            raceId,
                            i.address,
                            undefined // bullrun data should be empty
                        );

                        // unlock bot in race id (distributing reward)
                        await botsSchema.findOneAndUpdate(
                            {address: i.address},
                            { $set: { [`isDistributingMap.${raceId}`]: false } },
                            { upsert: true }
                        );

                        return distributeData;
                    }
                    return new Promise((resolve, _) => { resolve(true); });
                })
            );
            break;
    }
}
