import { Socket } from 'socket.io';
import modules from '../../models/games-socket/index';

const { GameCounts, GameCompletes, GamesRequired, InGamePlayers, MatchesPlayed, PlayersState } = modules.bullrun;

// Define types for the socket events data
interface BullrunSetPendingData {
    id: string;
    opponentId: string;
    userAddress: string;
    isPending: boolean;
    raceId: string;
}

interface BullrunJoinGameData {
    raceId: string;
    userAddress: string;
    amountOfGamesRequired: number;
}

interface BullrunGetGameCountsData {
    raceId: string;
    userAddress: string;
}

interface BullrunGameEndData {
    raceId: string;
}

export default (socket: any, io: any): void => {

    socket.on('bullrun-set-pending', ({ id, opponentId, userAddress, isPending, raceId }: BullrunSetPendingData) => {
        // Emit event to opponent and the socket
        io.to(opponentId).emit('bullrun-pending', { id, userAddress, isPending, raceId });
        io.to(socket.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
    });

    socket.on('bullrun-win-modal-opened', async ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('bullrun-win-modal-opened-on-client', { raceId, socketId: socket.id });
    });

    const isPairing = new Map();

    socket.on('bullrun-join-game', async ({ raceId, userAddress, amountOfGamesRequired }: BullrunJoinGameData) => {
        const roomName = `race-${raceId}`;
        socket.join(roomName);
    
        const gamesRequired = await GamesRequired.findOne({ raceId, userAddress });
    
        async function initializePlayer(playerAddress: string, socket: Socket) {
            if (!gamesRequired) {
                await GamesRequired.create({ raceId, userAddress: playerAddress, requiredGames: amountOfGamesRequired });
            }
        }
    
        socket.userAddress = userAddress;
        await initializePlayer(userAddress, socket);
        await PlayersState.updateMany({ raceId, status: 'waiting' }, { status: 'active' });
        let activePlayers = await PlayersState.find({ raceId, status: 'active' });

        if (!activePlayers.some(pl => pl.userAddress == userAddress)) {
            const newPlayer = await PlayersState.create({ raceId, userAddress, status: 'active' });
            activePlayers.push(newPlayer);
        }
        
        async function pairPlayers() {
            if (isPairing.get(raceId) == true) {
                return;
            }
            isPairing.set(raceId, true);

            try {
                let maxRetries = activePlayers.length * 2; // Limit retries to prevent infinite loops
                let retries = 0;
        
                while (activePlayers.length >= 2 && retries < maxRetries) {
                    const player1_DB: any = activePlayers.shift()!;
                    const player2_DB: any = activePlayers.shift()!;
        
                    const connectedUsers = Array.from(io.sockets.sockets.values());
        
                    let player1: any = connectedUsers.find((i: any) => i.userAddress == player1_DB.userAddress);
                    let player2: any = connectedUsers.find((i: any) => i.userAddress == player2_DB.userAddress);
        
                    if (player1.userAddress === player2.userAddress) {
                        await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                        await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'waiting' });
                        retries++;
                        continue;
                    }
        
                    const gameCount1 = (await GameCounts.findOne({ raceId, userAddress: player1.userAddress }))?.count || 0;
                    const gameCount2 = (await GameCounts.findOne({ raceId, userAddress: player2.userAddress }))?.count || 0;
                    const matchesPlayed1 = await MatchesPlayed.find({ raceId, $or: [{ player1: player1.userAddress }, { player2: player1.userAddress }] });
                    const matchesPlayed2 = await MatchesPlayed.find({ raceId, $or: [{ player1: player2.userAddress }, { player2: player2.userAddress }] });
                    const requiredGamesPlayer1 = (await GamesRequired.findOne({ raceId, userAddress: player1.userAddress }))?.requiredGames || Infinity;
                    const requiredGamesPlayer2 = (await GamesRequired.findOne({ raceId, userAddress: player2.userAddress }))?.requiredGames || Infinity;
        
                    if (
                        gameCount1 < requiredGamesPlayer1 &&
                        gameCount2 < requiredGamesPlayer2 &&
                        !matchesPlayed1.some(match => match.player1 === player2.userAddress || match.player2 === player2.userAddress) &&
                        !matchesPlayed2.some(match => match.player1 === player1.userAddress || match.player2 === player1.userAddress)
                    ) {
                        await PlayersState.deleteOne({ raceId, userAddress: player1.userAddress });
                        await PlayersState.deleteOne({ raceId, userAddress: player2.userAddress });
                        
                        const roomName = `1v1-${player1.id}-${player2.id}`;
                        player1.join(roomName);
                        player2.join(roomName);
        
                        io.to(player1.id).emit('bullrun-game-start', { players: [player1.id, player2.id], opponent: { id: player2.id, userAddress: player2.userAddress } });
                        io.to(player2.id).emit('bullrun-game-start', { players: [player2.id, player1.id], opponent: { id: player1.id, userAddress: player1.userAddress } });
        
                        await MatchesPlayed.create({
                            raceId,
                            player1: player1.userAddress,
                            player2: player2.userAddress,
                        });
        
                        await incrementGameCount(player1, player2);
    
                    } else {
                        await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                        await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                        retries++;
                        continue;
                    }
                }
    
                activePlayers = await PlayersState.find({ raceId, status: 'active' });
                
                // console.log({activePlayers});
    
                if (activePlayers.length === 1) {
                    let remainingPlayer: any = activePlayers.shift()!;
    
                    const connectedUsers = Array.from(io.sockets.sockets.values());
                    remainingPlayer = connectedUsers.find((i: any) => i.userAddress == remainingPlayer.userAddress);
        
                    const remainingGameCount = (await GameCounts.findOne({ raceId, userAddress: remainingPlayer.userAddress }))?.count || 0;
        
                    const requiredGames = (await GamesRequired.findOne({ raceId, userAddress: remainingPlayer.userAddress }))?.requiredGames || Infinity;
        
                    if (remainingGameCount >= requiredGames) {
                        io.to(remainingPlayer.id).emit('bullrun-game-complete', {
                            message: 'You have completed all your games',
                            raceId
                        });
                        return;
                    }
        
                    await PlayersState.updateOne({ raceId, userAddress: remainingPlayer.userAddress }, { status: 'waiting' });
                    const gamesPlayed = remainingGameCount;
                    console.log("EMIT waiting", remainingPlayer.userAddress)
                    io.to(remainingPlayer.id).emit('bullrun-waiting', { message: `Waiting for an opponent, games played: ${gamesPlayed}`, raceId });
                }
            } catch (error) {
                
            } finally {
                isPairing.set(raceId, false);
            }
        }
    
        async function incrementGameCount(player1: any, player2: any) {
            console.log(`Increment game count for ${player1.userAddress} and ${player2.userAddress}`);
    
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
        io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: completedGamesAmount });
    });
};
