const updateProgress = require("./update-progress");
const underdogBaseState = require("./default-states-by-games/underdog");
const rabbitHoleBaseState = require("./default-states-by-games/rabbit-hole");
const bullrunBaseState = require("./default-states-by-games/bullrun");

// { room: string, id: string, userAddress: string }
let connectedUsers = [];
// { room: string, userAddress: string, progress: ("countdown": number, "game-1": number, "board-1": number, "game-2": number) }
let racesProgresses = [];

let activePlayers = [];
let waitingPlayers = [];
let matchesPlayed = {};  // matches between players (e.g., { 'player1_id': ['player2_id', ...] })
let gameCounts = {};     // number of games each player has played (e.g., { 'player1_id': 3, ... })
let gamesRequired = {};  // number of games per player required to move to next game  { 'player1_id': 3, ... }
let gameCompletes = {};
let gameCompletesAmount = {};



module.exports = (io) => {
    io.on("connection", socket => { 
        // when user disconnects
         // when user disconnects
         socket.on('disconnect', () => {
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
    
    
            // rm user
            let userAddress = null;
            connectedUsers = connectedUsers.filter(i => {
                // i.id !== socket.id
                if (i.id !== socket.id) {
                    return true;
                } else {
                    userAddress = i.userAddress;
                    return false;
                }
            });
    
            console.log({roomsToEmitDisconnectEvent})
    
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                let rProgress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
                socket.leave(roomName);
                io.to(roomName).emit('leaved', {socketId: socket.id, userAddress, rProgress});
            });
        });
    
        // connect the live
        socket.on('connect-live-game', ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            // find user 
            const data = connectedUsers.find(i => i.raceId === raceId && i.userAddress === userAddress);
    
            if (!data) {
                // add user
                connectedUsers.push({ room: roomName, id: socket.id, userAddress });
            } else {
                connectedUsers = connectedUsers.map(i => {
                    if (i => i.raceId === raceId && i.userAddress === userAddress) {
                        i.id = socket.id;
                    }
                    return i;
                });
            }
    
            socket.join(roomName);
            // send the socket event
            console.log('joined',  {socketId: socket.id, userAddress, raceId, roomName})
            io.to(roomName).emit('joined', {socketId: socket.id, userAddress, raceId});
        });
    
        // minimize race (game)
        socket.on('minimize-live-game', () => {
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
            // rm user
            connectedUsers = connectedUsers.filter(i => i.id !== socket.id);
    
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                socket.leave(roomName);
                io.to(roomName).emit('leaved', {socketId: socket.id});
            });
        });
    
        // user completes the game
        socket.on('update-progress', ({ raceId, userAddress, property, value }) => {
            const roomName = `race-${raceId}`;
            let rProgress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
            //console.log("UPDATE:", roomName, userAddress, property, value)
    
            //console.log(roomName, userAddress, rProgress);
            if (!rProgress) {
                //console.log("No progress was found, setting new")
                rProgress = {
                    room: roomName, 
                    userAddress,
                    progress: {
                        countdown: false,
                        board1: false,

                        // initial games states
                        ...underdogBaseState,
                        ...rabbitHoleBaseState,
                        ...bullrunBaseState,
                    }
                }
    
                rProgress = updateProgress(property, value, rProgress);       
                racesProgresses.push(rProgress);
            } else {
                rProgress = updateProgress(property, value, rProgress);
            }
    
            console.log("UPDATED PROGRESSES", racesProgresses.map(i => i.progress));
            console.log("EMIT:", {raceId, property, value, userAddress})
            io.to(roomName).emit('progress-updated', {raceId, property, value, userAddress, rProgress});
        });
    
        // get amount completed by raceId game gameId
        socket.on('get-progress', ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            const progress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
            io.to(socket.id).emit('race-progress', { progress });
        });
    
        // get amount completed by raceId game gameId
        socket.on('get-progress-questions', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progress = racesProgresses.filter(i => i?.room === roomName);
            io.to(socket.id).emit('race-progress-questions', { progress });
        });
    
        // get all progresses for tunnel game
        socket.on('get-all-fuel-tunnel', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progresses = racesProgresses.filter(i => i.room === roomName);
            
            io.to(socket.id).emit(`race-fuel-all-tunnel`, {
                progresses: progresses.map(i => {
                    return {
                        userAddress: i.userAddress,
                        ...i.progress.game2
                    }
                }),
            });
        });
    
        // get users amount connected to the game 
        socket.on('get-connected', async({ raceId }) => {
            const roomName = `race-${raceId}`;
            const sockets = await io.in(roomName).fetchSockets();
            io.to(socket.id).emit('amount-of-connected', { amount: sockets.length, raceId });
        });

        
        socket.on('bullrun-set-pending', ({ id, opponentId, userAddress, isPending, raceId }) => {
            const playerToEmit = activePlayers[raceId]?.find(i => i.id == opponentId);

            if (playerToEmit) {
                io.to(playerToEmit.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
                io.to(socket.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
            }
        });

        socket.on('bullrun-join-game', ({ raceId, userAddress, amountOfGamesRequired }) => {
            console.log('bullrun-join-game', { raceId, userAddress, amountOfGamesRequired });
            const roomName = `race-${raceId}`;
            socket.join(roomName);
        
            // Initialize game data for the player
            function initializePlayer(playerId) {
                if (!gamesRequired[raceId]) {
                    gameCompletesAmount[raceId] = 0;
                    matchesPlayed[raceId] = {};
                    gameCounts[raceId] = {};
                    gamesRequired[raceId] = {};
                    activePlayers[raceId] = [];
                    waitingPlayers[raceId] = [];
                }
                if (!matchesPlayed[raceId][playerId]) matchesPlayed[raceId][playerId] = [];
                if (!gameCounts[raceId][playerId])    gameCounts[raceId][playerId] = 0;
                if (!gamesRequired[raceId][playerId]) gamesRequired[raceId][playerId] = amountOfGamesRequired;
            }
            initializePlayer(socket.id);

            console.log("GR_:", gamesRequired[raceId]);
        
            socket.userAddress = userAddress;
            if (activePlayers[raceId].length <= gamesRequired[raceId][socket.id]) {
                activePlayers[raceId].push(socket);
                io.to(socket.id).emit('bullrun-game-start', { message: 'You have joined the game', raceId });
            } else {
                waitingPlayers[raceId].push(socket);
                io.to(socket.id).emit('bullrun-waiting', { message: 'You are in the queue, waiting to join', raceId });
            }
        
            //console.log({ activePlayers: activePlayers[raceId], waitingPlayers: waitingPlayers[raceId] });
        
            // Now pair the players and start the game
            function pairPlayers() {
                const numPlayers = activePlayers[raceId].length;
        
                for (let i = 0; i < numPlayers; i++) {
                    const player1 = activePlayers[raceId][i];
                    for (let j = i + 1; j < numPlayers; j++) {
                        const player2 = activePlayers[raceId][j];
        
                        // Ensure that the players can still play more games
                        if (
                            gameCounts[raceId][player1.id] < gamesRequired[raceId][player1.id] && 
                            gameCounts[raceId][player2.id] < gamesRequired[raceId][player2.id] &&
                            !matchesPlayed[raceId][player1.id].includes(player2.id) && 
                            !matchesPlayed[raceId][player2.id].includes(player1.id)
                        ) {
                            // Set up a room for this 1v1 match
                            const roomName = `1v1-${player1.id}-${player2.id}`;
                            player1.join(roomName);
                            player2.join(roomName);
        
                            // Emit game start to both players, with their correct opponents
                            io.to(player1.id).emit('bullrun-game-start', { players: [player1.id, player2.id], opponent: {id: player2.id, userAddress: player2.userAddress} });
                            io.to(player2.id).emit('bullrun-game-start', { players: [player2.id, player1.id], opponent: {id: player1.id, userAddress: player1.userAddress} });
                            
                            console.log(`Pairing players: ${player1.id} vs ${player2.id}`);
                        }
                    }
                }
            }
        
            pairPlayers();
        });
        
        
        // End round for 1v1 bullrun
        socket.on('bullrun-game-end', ({ raceId }) => {
            function rotatePlayers() {
                if (waitingPlayers[raceId]?.length > 0) {
                    const leavingPlayer = activePlayers[raceId].shift();  // Remove one player from the game
                    const nextPlayer = waitingPlayers[raceId].shift();    // Add the waiting player
                    
                    activePlayers[raceId].push(nextPlayer);  // Add the new player to the game
                    waitingPlayers[raceId].push(leavingPlayer);  // Put the leaving player into the waiting queue
                    
                    io.to(leavingPlayer.id).emit('bullrun-waiting', { message: 'You are now waiting for the next round', raceId });
                    io.to(nextPlayer.id).emit('bullrun-game-start', { message: 'You are now playing', raceId });
                } else {
                    console.log("NO GAME WAITING PLAYERS")
                }
            }
            rotatePlayers();
        
        
            function pairPlayers() {
                const numPlayers = activePlayers[raceId]?.length;
            
                for (let i = 0; i < numPlayers; i++) {
                    const player1 = activePlayers[raceId][i];
                    for (let j = i + 1; j < numPlayers; j++) {
                        const player2 = activePlayers[raceId][j];
                        
                        const roomName = `1v1-${player1.id}-${player2.id}`;

                        if (socket.id == player1.id && !matchesPlayed[raceId][player1.id].includes(player2.id)) {
                            if (gameCounts[raceId][player1.id] < gamesRequired[raceId][player1.id]) {
                                player1.join(roomName);
                                matchesPlayed[raceId][player1.id].push(player2.id);
                                gameCounts[raceId][player1.id]++;
                                console.log("INCREMENTED gameCounts per", player1.id, gameCounts[raceId][player1.id]);
                                io.to(roomName).emit('bullrun-start-game', { players: [player1.id, player2.id], raceId });

                                if (gameCounts[raceId][player1.id] >= gamesRequired[raceId][player1.id]) {
                                    io.to(player1.id).emit('bullrun-game-complete', { message: 'You have completed all your games', raceId });
                                    gameCompletes[player1.id] = true;
                                    gameCompletesAmount[raceId]++;
                                }
                            }
                        }

                        if (socket.id == player2.id && !matchesPlayed[raceId][player2.id].includes(player1.id)) {
                            if (gameCounts[raceId][player2.id] < gamesRequired[raceId][player2.id]) {
                                player2.join(roomName);
                                matchesPlayed[raceId][player2.id].push(player1.id);
                                gameCounts[raceId][player2.id]++;
                                console.log("INCREMENTED gameCounts per", player2.id, gameCounts[raceId][player2.id]);
                                io.to(roomName).emit('bullrun-start-game', { players: [player1.id, player2.id], raceId });

                                if (gameCounts[raceId][player2.id] >= gamesRequired[raceId][player2.id]) {
                                    io.to(player2.id).emit('bullrun-game-complete', { message: 'You have completed all your games', raceId });
                                    gameCompletes[player2.id] = true;
                                    gameCompletesAmount[raceId]++;
                                }
                            }
                        }
                    }
                }
            }
            pairPlayers();
            io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: gameCompletesAmount[raceId] });
        });
    });

    console.log("[SOCKET] Events applied.");
}