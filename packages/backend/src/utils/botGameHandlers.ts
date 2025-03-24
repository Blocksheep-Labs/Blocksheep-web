import botsSchema from "../models/bots/bots.mongo";
import progressSchema from "../models/games-socket/default/race-progress.mongo";
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

    async function unlockForDistribute(botAddress: string) {
        await botsSchema.findOneAndUpdate(
            {address: botAddress},
            { $set: { [`isDistributingMap.${raceId}`]: false } },
            { upsert: true }
        );
    }

    async function lockForDistribute(botAddress: string) {
        await botsSchema.findOneAndUpdate(
            {address: botAddress},
            { $set: { [`isDistributingMap.${raceId}`]: true } },
            { upsert: true }
        );
    }

    async function unlockForMakeMove(botAddress: string) {
        await botsSchema.findOneAndUpdate(
            { address: botAddress },
            {
                $set: { [`isMakingMoveMap.${raceId}`]: false },
            },
            { upsert: true }
        );
    }


    switch (game) {
        case "BULLRUN":
            bots.map(async (i) => {
               if (
                   !i.isMakingMoveMap.get(String(raceId)) &&
                   type == "makeMove" &&
                   !(i.bullrunOpponentsPassed.get(String(raceId)) || []).includes(data.opponentAddress)
               ) {
                   const botProgressData = await progressSchema.findOne({ room: `race-${raceId}`, userAddress: i.address });
                   const botGameData = botProgressData?.progress.bullrun;
                   const botIsCompleted = botGameData?.isCompleted;

                   // if bot has finished playing
                   if (botIsCompleted) {
                       return;
                   }

                   console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: BULLRUN`);
                   // lock bot (making move) and add opponentAddress played against
                   await botsSchema.findOneAndUpdate(
                       { address: i.address },
                       {
                           $set: { [`isMakingMoveMap.${raceId}`]: true },
                           $push: { [`bullrunOpponentsPassed.${raceId}`]: data.opponentAddress }
                       },
                       { upsert: true }
                   );

                   // make move
                   const makeMoveData = await makeMove(
                       "BULLRUN",
                       raceId,
                       i.address,
                       undefined,
                       undefined,
                       {
                           opponentAddress: data.opponentAddress,
                       }
                   );

                   // unlock bot for make move
                   await unlockForMakeMove(i.address);

                   return makeMoveData;
               } else {
                   console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: BULLRUN`);

                   // lock bot distributing at race
                   await lockForDistribute(i.address);

                   const distributeData = await distribute(
                       "BULLRUN",
                       raceId,
                       i.address,
                       undefined,
                       {
                           opponentAddress: data.opponentAddress,
                       }
                   );

                   // unlock bot
                   await unlockForDistribute(i.address);

                   return distributeData;
               }
            });
            break;

        case "RABBITHOLE":
            bots.map(async (i) => {
                if (
                    !i.isMakingMoveMap.get(String(raceId)) &&
                    type == "makeMove" &&
                    !(i.rabbitholeRoundsPlayed.get(String(raceId)) || []).includes(Number(data.roundIndex))
                ) {
                    // check for bot not to be eliminated
                    const botProgressData = await progressSchema.findOne({ room: `race-${raceId}`, userAddress: i.address });
                    const botGameData = botProgressData?.progress.rabbithole[data.version].game;
                    const botIsCompleted = botGameData?.isCompleted || false;
                    const botIsEliminated = botGameData?.isEliminated || false;

                    // if bot is eliminated - it must not do any txs
                    if (botIsEliminated || botIsCompleted) {
                        return;
                    }

                    console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: RABBITHOLE`);
                    // lock bot in race id (making move)
                    await botsSchema.findOneAndUpdate(
                        { address: i.address },
                        {
                            $set: { [`isMakingMoveMap.${raceId}`]: true },
                            $push: { [`rabbitholeRoundsPlayed.${raceId}`]: Number(data.roundIndex) }
                        },
                        { upsert: true }
                    );

                    const makeMoveData = await makeMove(
                        "RABBITHOLE",
                        raceId,
                        i.address,
                        undefined, // underdog data should be empty
                        {
                            ...data,
                            fuelLeft: botGameData.maxAvailableFuel,
                            fuelSubmission: Math.floor(Math.random() * (botGameData.maxAvailableFuel + 1)),
                        }, // rabbithole data
                        undefined // bullrun data should be empty
                    );

                    // unlock bot in race id (making move)
                    await unlockForMakeMove(i.address);

                    return makeMoveData;
                } else if (!i.isDistributingMap.get(String(raceId)) && type == "distribute") {
                    console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: RABBITHOLE`);
                    // lock bot in race id (distributing reward)
                    await lockForDistribute(i.address);

                    const distributeData = await distribute(
                        "RABBITHOLE",
                        raceId,
                        i.address,
                        data,
                        undefined // bullrun data should be empty
                    );

                    // unlock bot in race id (distributing reward)
                    await unlockForDistribute(i.address);

                    return distributeData;
                }
                return new Promise((resolve, _) => { resolve(true); });
            });
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

                        // unlock bot in race id (making move)
                        await unlockForMakeMove(i.address);

                        return makeMoveData;
                    } else if (!i.isDistributingMap.get(String(raceId)) && type == "distribute") {
                        console.log(`Performing operation: ${type.toUpperCase()} for: ${raceId}, botAddress ${i.address}, game: UNDERDOG`);
                        // lock bot in race id (distributing reward)
                        await lockForDistribute(i.address);

                        const distributeData = await distribute(
                            "UNDERDOG",
                            raceId,
                            i.address,
                            data,
                            undefined // bullrun data should be empty
                        );

                        // unlock bot in race id (distributing reward)
                        await unlockForDistribute(i.address);

                        return distributeData;
                    }
                    return new Promise((resolve, _) => { resolve(true); });
                })
            );
            break;
    }
}
