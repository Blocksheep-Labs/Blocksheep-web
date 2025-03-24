import { Socket } from 'socket.io';
import modules from '../../models/games-socket/index';
import UserMongo from "../../models/users/users.mongo";
import handleUserChoiceWithBot from "../../utils/botGameHandlers";
import botsMongo from "../../models/bots/bots.mongo";

                                                    // not used
const { GameCounts, GameCompletes, GamesRequired, InGamePlayers, MatchesPlayed, PlayersState } = modules.bullrun;
const { ConnectedUser } = modules.default;

// Define types for the socket events data
interface BullrunSetPendingData {
    id: string;
    opponentId: string;
    userAddress: string;
    isPending: boolean;
    raceId: number;
}

interface BullrunJoinGameData {
    raceId: number;
    userAddress: string;
    amountOfGamesRequired: number;
    userName: string;
}

interface BullrunGetGameCountsData {
    raceId: string;
    userAddress: string;
}

interface BullrunGameEndData {
    raceId: number;
}

interface BullrunStartedDistributing {
    raceId: number,
    userAddress: string,
    opponentAddress: string,
}

const isPairing = new Map();

export const startPairingPlayer = async(socket: any, io: any, { raceId, userAddress, amountOfGamesRequired }: BullrunJoinGameData) => {
    const roomName = `race-${raceId}`;
    socket.join(roomName);



    async function initializePlayerAndBots(playerAddress: string, socket: Socket) {
        const gamesRequired = await GamesRequired.findOne({ raceId, userAddress });
        if (!gamesRequired) {
            await GamesRequired.create({ raceId, userAddress: playerAddress, requiredGames: amountOfGamesRequired });
        }

        const bots = await botsMongo.find({ connectedRaceIds: String(raceId) });
        await Promise.all(bots.map(async bot => {
            const botGamesRequired = await GamesRequired.findOne({ raceId, userAddress: bot.address });
            if (!botGamesRequired) {
                return {
                    setBotActive: await PlayersState.updateOne(
                        { raceId, userAddress: bot.address },
                        { status: 'active' },
                        { upsert: true }
                    ),
                    initBot: await GamesRequired.create(
                        { raceId, userAddress: bot.address, requiredGames: amountOfGamesRequired }
                    ),
                }
            }
            return new Promise((resolve, _) => { resolve(true) });
        }));
    }

    socket.userAddress = userAddress;
    socket.userName = (await UserMongo.findOne({ address: userAddress }))?.name || "Unknown";
    await initializePlayerAndBots(userAddress, socket);

    // Get all waiting players and make them active
    await PlayersState.updateMany({ raceId, status: 'waiting' }, { status: 'active' });
    // make the joining user active
    await PlayersState.updateOne({ raceId, userAddress }, { status: 'active' }, { upsert: true });

    let activePlayers = await PlayersState.find({ raceId, status: 'active' });

    async function pairPlayers() {
        if (isPairing.get(raceId)) return;
        isPairing.set(raceId, true);

        try {
            //console.log("BEFORE PAIRING - ACTIVE PLAYERS:", await PlayersState.find({ raceId, status: 'active' }));

            while (activePlayers.length >= 2) {
                const player1_DB = await PlayersState.findOneAndUpdate(
                    { raceId, status: 'active' },
                    { $set: { status: 'in-game' } },
                    { new: true }
                );

                if (!player1_DB) break;

                // Find a player who hasn't played against player1_DB yet
                const playedAgainst1 = await MatchesPlayed.find({
                    raceId,
                    $or: [
                        { player1: player1_DB.userAddress },
                        { player2: player1_DB.userAddress }
                    ]
                }).distinct("player1");

                // Also get distinct values for "player2"
                const playedAgainst2 = await MatchesPlayed.find({
                    raceId,
                    $or: [
                        { player1: player1_DB.userAddress },
                        { player2: player1_DB.userAddress }
                    ]
                }).distinct("player2");

                // Merge both results to get all unique opponents
                const allPlayedAgainst = [...new Set([...playedAgainst1, ...playedAgainst2])];

                const player2_DB = await PlayersState.findOneAndUpdate(
                    { raceId, status: 'active', userAddress: { $nin: [...allPlayedAgainst, player1_DB.userAddress] } },
                    { $set: { status: 'in-game' } },
                    { new: true }
                );

                if (!player2_DB) {
                    await PlayersState.updateOne({ raceId, userAddress: player1_DB.userAddress }, { status: 'active' });
                    break;
                }

                const bots = await botsMongo.find({ connectedRaceIds: String(raceId) });

                // Get socket instances of users (merged with bots)
                const connectedUsers = [
                    ...Array.from(io.sockets.sockets.values()),
                    ...bots.map(bot => ({
                        userAddress: bot.address,
                        userName: `bot-${bot.address.substring(bot.address.length - 4, bot.address.length)}`,
                        isBot: true,
                        id: `bot-${bot.address.substring(bot.address.length - 4, bot.address.length)}`
                    })),
                ];
                let player1: any = connectedUsers.find((i: any) => i.userAddress === player1_DB.userAddress);
                let player2: any = connectedUsers.find((i: any) => i.userAddress === player2_DB.userAddress);

                if (!player1 || !player2 || player1.userAddress === player2.userAddress) {
                    await PlayersState.updateOne({ raceId, userAddress: player1_DB.userAddress }, { status: 'active' });
                    await PlayersState.updateOne({ raceId, userAddress: player2_DB.userAddress }, { status: 'active' });
                    continue;
                }

                // Check match history & game count
                const gameCount1 = (await GameCounts.findOne({ raceId, userAddress: player1.userAddress }))?.count || 0;
                const gameCount2 = (await GameCounts.findOne({ raceId, userAddress: player2.userAddress }))?.count || 0;
                const requiredGames1 = (await GamesRequired.findOne({ raceId, userAddress: player1.userAddress }))?.requiredGames || Infinity;
                const requiredGames2 = (await GamesRequired.findOne({ raceId, userAddress: player2.userAddress }))?.requiredGames || Infinity;

                // Check if they were recently matched (last 5 minutes)
                const playedMatch = await MatchesPlayed.findOne({
                    raceId,
                    player1: { $in: [player1.userAddress, player2.userAddress] },
                    player2: { $in: [player1.userAddress, player2.userAddress] },
                });

                console.log({
                    playedMatch,
                    player1: player1.userName,
                    player2: player2.userName
                });

                if (!playedMatch && gameCount1 < requiredGames1 && gameCount2 < requiredGames2) {
                    // Create the match
                    const roomName = `1v1-${player1.id}-${player2.id}`;
                    !player1.isBot && player1.join(roomName);
                    !player2.isBot && player2.join(roomName);

                    !player1.isBot && io.to(player1.id).emit('bullrun-game-start', {
                        players: [player1.id, player2.id],
                        opponent: { id: player2.id, userAddress: player2.userAddress }
                    });

                    !player2.isBot && io.to(player2.id).emit('bullrun-game-start', {
                        players: [player2.id, player1.id],
                        opponent: { id: player1.id, userAddress: player1.userAddress }
                    });

                    await MatchesPlayed.create({ raceId, player1: player1.userAddress, player2: player2.userAddress });
                    await incrementGameCount(player1, player2);

                    // Remove from active players list
                    activePlayers = activePlayers.filter(p => p.userAddress !== player1.userAddress && p.userAddress !== player2.userAddress);
                } else {
                    await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                    await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                    continue;
                }
            }

            //console.log("AFTER PAIRING - ACTIVE PLAYERS:", await PlayersState.find({ raceId, status: 'active' }));

            if (activePlayers.length === 1) {
                let remainingPlayer: any = activePlayers.shift();
                const connectedUsers = Array.from(io.sockets.sockets.values());
                remainingPlayer = connectedUsers.find((i: any) => i.userAddress === remainingPlayer.userAddress);

                const remainingGameCount = (await GameCounts.findOne({ raceId, userAddress: remainingPlayer.userAddress }))?.count || 0;
                const requiredGames = (await GamesRequired.findOne({ raceId, userAddress: remainingPlayer.userAddress }))?.requiredGames || Infinity;

                if (remainingGameCount >= requiredGames) {
                    io.to(remainingPlayer.id).emit('bullrun-game-complete', {
                        message: 'You have completed all your games',
                        raceId
                    });
                    return;
                }

                io.to(remainingPlayer.id).emit('bullrun-waiting', {
                    message: `Waiting for an opponent, games played: ${remainingGameCount}`,
                    raceId
                });
            }
        } catch (error) {
            console.error("Error in pairing:", error);
        } finally {
            setTimeout(() => {
                isPairing.set(raceId, false);
            }, 5000);
        }
    }

    async function incrementGameCount(player1: any, player2: any) {
        console.log(`Increment game count for ${player1.userName} and ${player2.userName}`);

        await GameCounts.updateOne(
            { raceId, userAddress: player1.userAddress },
            { $inc: { count: 1 } },
            { upsert: true }
        );

        await GameCounts.updateOne(
            { raceId, userAddress: player2.userAddress },
            { $inc: { count: 1 } },
            { upsert: true }
        );
    }

    pairPlayers();
}

export const bullrunSetPending = async(socket: any, io: any, { id, opponentId, userAddress, isPending, raceId }: BullrunSetPendingData) => {
    io.to(opponentId).emit('bullrun-pending', { id, userAddress, isPending, raceId });
    if (socket) {
        io.to(socket.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
    }
}

export default (socket: any, io: any): void => {

    socket.on('bullrun-set-pending', async(data: BullrunSetPendingData) => {
        // Emit event to opponent and the socket
        await bullrunSetPending(socket, io, data);

        handleUserChoiceWithBot({
            game: "BULLRUN",
            raceId: data.raceId,
            type: "makeMove",
            data: {
                opponentAddress: data.userAddress, // pass user who has emitted this event as an opponent to some bot;
                                                   // bot as an opponent (if it was) will be
                                                   // identified later at handleUserChoiceWithBot
            }
        }).catch(err => {
            console.log("Bot makeMove error:", err);
        });
    });

    socket.on("bullrun-started-distributing", async({ raceId, userAddress, opponentAddress }: BullrunStartedDistributing) => {
        handleUserChoiceWithBot({
            game: "BULLRUN",
            raceId,
            type: "distribute",
            data: {
                opponentAddress: userAddress // pass user who has emitted this event as an opponent to some bot;
                                             // bot as an opponent (if it was) will be
                                             // identified later at handleUserChoiceWithBot
            }
        }).catch(err => {
            console.log("Bot distribute error:", err);
        });
    });

    socket.on('bullrun-win-modal-opened', async ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('bullrun-win-modal-opened-on-client', { raceId, socketId: socket.id });
    });

    socket.on('bullrun-join-game', async (data: BullrunJoinGameData) => {
        await startPairingPlayer(socket, io, data);
    });
    

    socket.on('bullrun-curtains-closing', (data: { toId: string }) => {
        io.to(data.toId).emit('bullrun-curtains-closing', data);
        io.to(socket.id).emit('bullrun-curtains-closing', data);
    });

    socket.on('bullrun-get-game-counts', async ({ raceId, userAddress }: BullrunGetGameCountsData) => {
        const gameCounts = (await GameCounts.findOne({ raceId, userAddress }))?.count || 0;
        const gameCompletesAmount = await GameCompletes.countDocuments({ raceId, completed: true });

        io.to(socket.id).emit('bullrun-game-counts', {
            raceId,
            userAddress,
            gameCounts,
            gameCompletesAmount,
        });
    });

    socket.on('bullrun-game-end', async ({ raceId }: BullrunGameEndData) => {
        const gameCount = (await GameCounts.findOne({ raceId, userAddress: socket.userAddress }))?.count || 0;
        const requiredGames = (await GamesRequired.findOne({ raceId, userAddress: socket.userAddress }))?.requiredGames || Infinity;

        console.log({ gameCount, requiredGames });
        if (gameCount >= requiredGames) {
            await GameCompletes.updateOne(
                { raceId, userAddress: socket.userAddress },
                { $set: { completed: true } },
                { upsert: true }
            );
            
            io.to(socket.id).emit('bullrun-game-complete', {
                message: 'You have completed all your games',
                raceId
            });
        } else {
            io.to(socket.id).emit('bullrun-game-continue', {
                message: `You can continue playing ${gameCount}/${requiredGames}`,
                raceId
            });
        }

        const completedGamesAmount = await GameCompletes.countDocuments({ raceId, completed: true });
        io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { 
            gameCompletesAmount: completedGamesAmount,
            connectedCount: await ConnectedUser.countDocuments({ raceId, part: "BULLRUN" })
        });
    });
};
