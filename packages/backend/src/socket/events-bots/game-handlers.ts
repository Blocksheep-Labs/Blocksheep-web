import botsSchema from "../../models/bots/bots.mongo";
import {makeMove} from "../../utils/bot_web3_functions/makeMove";
import {distribute} from "../../utils/bot_web3_functions/distribute";

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
    const bots = await botsSchema.find({ raceId: raceId });

    // ensure that we have bots at race
    if (!bots.length) {
        console.log("No bots was found at race, move skipped.");
        return;
    }

    // lock bots as sending tx

    switch (game) {
        case "BULLRUN":
            break;
        case "RABBITHOLE":
            break;
        case "UNDERDOG":
            await Promise.all(
                bots.map(async (i) => {
                    if (
                        !i.isMakingMoveMap.get(raceId) &&
                        type == "makeMove" &&
                        !(i.underdogPassedQuestionIndexes.get(raceId)?.includes(data.questionIndex as number))
                    ) {
                        // lock bot in race id (making move)
                        await botsSchema.findOneAndUpdate(
                            { address: i.address },
                            {
                                $set: { [`isMakingMoveMap.${raceId}`]: true },
                                $push: { [`underdogPassedQuestionIndexes.${raceId}`]: data.questionIndex }
                            },
                            { upsert: true }
                        );
                        return makeMove(
                            "UNDERDOG",
                            raceId,
                            i.address,
                            data, // underdog data
                            undefined, // rabbithole data should be empty
                            undefined // bullrun data should be empty
                        );
                    } else if (!i.isDistributingMap.get(raceId) && type == "distribute") {
                        // lock bot in race id (distributing reward)
                        await botsSchema.findOneAndUpdate(
                            {address: i.address},
                            { $set: { [`isDistributingMap.${raceId}`]: true } },
                            { upsert: true }
                        );
                        return distribute(
                            "UNDERDOG",
                            raceId,
                            i.address,
                            undefined // bullrun data should be empty
                        );
                    }
                    return new Promise((resolve, _) => { resolve(true); });
                })
            );
            break;
    }
}
