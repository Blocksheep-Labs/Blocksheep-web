const { 
    bullrun: {
        GameCounts,
        GameCompletes,
        GamesRequired,
        InGamePlayers,
        MatchesPlayed,
        PlayersState,
    }
} = require('../../models/games-socket/index');


module.exports = (socket, io) => {

    socket.on('bullrun-set-pending', ({ id, opponentId, userAddress, isPending, raceId }) => {
        //console.log({ id, opponentId, userAddress, isPending, raceId })
        //const playerToEmit = activePlayers[raceId]?.find(i => i.id == opponentId);
    
        //if (playerToEmit) {
            io.to(opponentId).emit('bullrun-pending', { id, userAddress, isPending, raceId });
            io.to(socket.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
        //}
    });
    
    
    
    socket.on('bullrun-win-modal-opened', async({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('bullrun-win-modal-opened-on-client', { raceId, socketId: socket.id });
    });
    
    

    
    socket.on('bullrun-join-game', async({ raceId, userAddress, amountOfGamesRequired }) => {
        //console.log('bullrun-join-game', { raceId, userAddress, amountOfGamesRequired });
        const roomName = `race-${raceId}`;
        socket.join(roomName);
    
        // Initialize game data for the race if not already initialized
        const gamesRequired = await GamesRequired.findOne({ raceId, userAddress });

        const inGamePlayers = await InGamePlayers.find({ raceId });
    
        // Initialize game data for the player
        async function initializePlayer(playerAddress, socket) {

            if (!gamesRequired) {
                await GamesRequired.create({ raceId, userAddress, requiredGames: amountOfGamesRequired })
            } 
    
            // Check if the player is not in inGamePlayers
            if (!inGamePlayers.map(i => i.userAddress.toString()).includes(playerAddress)) {
                console.log("PUSH:", playerAddress)
                await InGamePlayers.create({ raceId, userAddress: playerAddress });
            }
        }
        socket.userAddress = userAddress; 
        await initializePlayer(userAddress, socket);

        // Add player to the database as waiting, but only if they don't already exist
        const existingPlayerState = await PlayersState.findOne({ raceId, userAddress });
        if (!existingPlayerState) {
            await PlayersState.create({ raceId, userAddress, status: 'waiting' });
        }

        // Only update waiting players to active if there are enough players to form pairs
        const waitingPlayers = await PlayersState.find({ raceId, status: 'waiting' });
        if (waitingPlayers.length >= 2) {
            await PlayersState.updateMany(
                { raceId, status: 'waiting' }, 
                { status: 'active' }
            );
        }

        // Fetch all active players for the race
        const activePlayers = await PlayersState.find({ raceId, status: 'active' });
    
        //console.log("ACTIVE BEFORE:", activePlayers[raceId].map(i => i.id));
        if (!activePlayers.some(p => p.userAddress === userAddress)) {
            await PlayersState.updateOne({ raceId, userAddress: userAddress }, { status: 'active' });
        }
        //console.log("UPDATED LIST OF ACTIVE PLAYERS:", activePlayers[raceId].map(i => ({id: i.id, address: i.userAddress})));
    
        // Pair players and start the game
        async function pairPlayers() {
            // Fetch updated active players
            const activePlayers = await PlayersState.find({ raceId, status: 'active' });

            let maxRetries = activePlayers.length * 2; // Limit retries to prevent infinite loops
            let retries = 0;
        
            // Pair players only if we have at least 2 active players
            while (activePlayers.length >= 2 && retries < maxRetries) {
                const player1 = activePlayers.shift();
                const player2 = activePlayers.shift();
    
                //console.log("TRYING TO PAIR...", player1.id, player2.id);
        
                // Ensure player1 and player2 are not the same person
                if (player1.userAddress === player2.userAddress) {
                    //console.log("ERROR: Trying to pair player with themselves!", player1.id);
                    await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                    await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'waiting' });
                    retries++;
                    continue;
                }

                // Fetch game counts and matches played from MongoDB
                const gameCount1 = await GameCounts.findOne({ raceId, userAddress: player1.userAddress });
                const gameCount2 = await GameCounts.findOne({ raceId, userAddress: player2.userAddress });
                const matchesPlayed1 = await MatchesPlayed.find({ raceId, $or: [{ player1: player1.userAddress }, { player2: player1.userAddress }] });
                const matchesPlayed2 = await MatchesPlayed.find({ raceId, $or: [{ player1: player2.userAddress }, { player2: player2.userAddress }] });
        
                // Ensure players can still play more games and haven't played each other yet
                if (
                    gameCount1.count < raceData.gamesRequired[player1.userAddress] &&
                    gameCount2.count < raceData.gamesRequired[player2.userAddress] &&
                    !matchesPlayed1.some(match => match.player1 === player2.userAddress || match.player2 === player2.userAddress) &&
                    !matchesPlayed2.some(match => match.player1 === player1.userAddress || match.player2 === player1.userAddress)
                ) {
                    // Set up a room for this 1v1 match
                    const roomName = `1v1-${player1.id}-${player2.id}`;
                    player1.join(roomName);
                    player2.join(roomName);
        
                    // Emit game start to both players, with their correct opponents
                    io.to(player1.id).emit('bullrun-game-start', { players: [player1.id, player2.id], opponent: { id: player2.id, userAddress: player2.userAddress } });
                    io.to(player2.id).emit('bullrun-game-start', { players: [player2.id, player1.id], opponent: { id: player1.id, userAddress: player1.userAddress } });
        
                    //console.log(`Pairing players: ${player1.id} vs ${player2.id}`);
        
                    // Track matches played
                    await MatchesPlayed.updateOne(
                        { raceId, userAddress: player1.userAddress },
                        { $push: { matches: player2.userAddress } }
                    );
                    await MatchesPlayed.updateOne(
                        { raceId, userAddress: player2.userAddress },
                        { $push: { matches: player1.userAddress } }
                    );
        
                    // Increment their game counts
                    await incrementGameCount(player1, player2);

                    // After successful pairing, update their status to active
                    await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'active' });
                    await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                } else {
                    //console.log("TRYING TO PAIR...", player1.id, player2.id, "FAILED!");
                    // If pairing fails, put players back in the queue but rotate them
                    await PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                    await PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                    retries++;
                    continue;  // Continue to try pairing other players
                }
            }
        
            // If only one player is left unpaired, move them to the waiting list
            if (activePlayers.length === 1) {
                const remainingPlayer = activePlayers.shift();

                const remainingGameCount = await GameCounts.findOne({ raceId, userAddress: remainingPlayer.userAddress });
                if (remainingGameCount.count >= raceData.gamesRequired[remainingPlayer.userAddress]) {
                    io.to(remainingPlayer.id).emit('bullrun-game-complete', { 
                        message: 'You have completed all your games', 
                        raceId 
                    });
                    return;
                }

                await PlayersState.updateOne({ raceId, userAddress: remainingPlayer.userAddress }, { status: 'waiting' });
                const gamesPlayed = remainingGameCount.count;
                io.to(remainingPlayer.id).emit('bullrun-waiting', { message: `Waiting for an opponent, games played: ${gamesPlayed}`, raceId });
            }

            if (retries >= maxRetries) {
                //console.log('Max retries reached, ending pairing attempts for now.');
            }
        }
        
    
        // Increment game count and handle completion checks
        async function incrementGameCount(player1, player2) {
            await GameCounts.updateOne(
                { raceId, userAddress: player1.userAddress },
                { $inc: { count: 1 } }
            );

            await GameCounts.updateOne(
                { raceId, userAddress: player2.userAddress },
                { $inc: { count: 1 } }
            );
            //console.log(`Incremented gameCounts for players: ${player1.userAddress} (${gameCounts[raceId][player1.userAddress]}) and ${player2.userAddress} (${gameCounts[raceId][player2.userAddress]})`);
        }
    
        pairPlayers();
    });


    socket.on('bullrun-curtains-closing', (data) => {
        io.to(data.toId).emit('bullrun-curtains-closing', data);
        io.to(socket.id).emit('bullrun-curtains-closing', data);
    });
    
    
    

    socket.on('bullrun-get-game-counts', async ({ raceId, userAddress }) => {
        const gameCounts = await GameCounts.findOne({ raceId, userAddress });
        const gameCompletesAmount = (await GameCompletes.find({ raceId, completed: true })).length;
        
        io.to(socket.id).emit('bullrun-game-counts', {
            raceId,
            userAddress,
            gameCounts,
            gameCompletesAmount,
        });
    });




    socket.on('bullrun-game-end', async ({raceId}) => {
        const gameCount = await GameCounts.findOne({ raceId, userAddress: socket.userAddress });
        const requiredGames = await GamesRequired.findOne({ raceId, userAddress: socket.userAddress });

        if (gameCount.count >= requiredGames.requiredGames) {
            // Update game completion status
            await GameCompletes.updateOne(
                { raceId, userAddress: socket.userAddress },
                { $set: { completed: true } }
            );

            io.to(socket.id).emit('bullrun-game-complete', { 
                message: 'You have completed all your games', 
                raceId 
            });
        } else {
            io.to(socket.id).emit('bullrun-game-continue', { 
                message: `You can continue playing ${gameCount.count}/${requiredGames.requiredGames}`, 
                raceId 
            });
        }

        // Emit the updated amount of completed games to the room
        const completedGamesAmount = (await GameCompletes.find({ raceId, completed: true })).length;
        io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: completedGamesAmount.count });
    });
}










