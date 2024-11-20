const updateProgress = require("./update-progress");
const underdogBaseState = require("./default-states-by-games/underdog");
const rabbitHoleBaseState = require("./default-states-by-games/rabbit-hole");
const bullrunBaseState = require("./default-states-by-games/bullrun");

// { room: string, id: string, userAddress: string }
let connectedUsers = [];
// { room: string, userAddress: string, progress: ("countdown": number, "game-1": number, "board-1": number, "game-2": number) }
let racesProgresses = [];

// { raceId: string, screen: string }
let screens = [
    "STORY_INTRO", "RACE_START", 
    "RABBIT_HOLE_PREVIEW", "RABBIT_HOLE_RULES", "RABBIT_HOLE",
    "RACE_UPDATE_1", "STORY_PART_1",
    "UNDERDOG_PREVIEW", "UNDERDOG_RULES", "UNDERDOG",
    "RACE_UPDATE_2", "STORY_PART_2",
    "BULL_RUN_PREVIEW", "BULL_RUN_RULES", "BULL_RUN",
    "RACE_UPDATE_3", "STORY_PART_3",
    "RABBIT_HOLE_V2_PREVIEW", "RABBIT_HOLE_V2_RULES", "RABBIT_HOLE_V2",
    "RACE_UPDATE_4", "STORY_PART_4", 
    "RATE", "STORY_CONCLUSION", "PODIUM"
];
let roomsLatestScreen = [];

let activePlayers = {};
let waitingPlayers = {};
let matchesPlayed = {};  // matches between players (e.g., { 'player1_id': ['player2_id', ...] })
let gameCounts = {};     // number of games each player has played (e.g., { 'player1_id': 3, ... })
let gamesRequired = {};  // number of games per player required to move to next game  { 'player1_id': 3, ... }
let gameCompletesAmount = {};


module.exports = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });

    io.on("connection", socket => { 
        // when user disconnects
         // when user disconnects
         socket.on('disconnect', () => {
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
    
    
            // rm user
            let userAddress = null;
            let raceId = null;
            let part = null;
            connectedUsers = connectedUsers.filter(i => {
                // i.id !== socket.id
                if (i.id !== socket.id) {
                    return true;
                } else {
                    userAddress = i.userAddress;
                    raceId = i.raceId;
                    part = i.part;
                    return false;
                }
            });
    
            //console.log({roomsToEmitDisconnectEvent})
    
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                //let rProgress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
                socket.leave(roomName);
                io.to(roomName).emit('leaved', {socketId: socket.id, userAddress, raceId, movedToNext: false, part});
            });
        });
    
        // connect the live
        socket.on('connect-live-game', ({ raceId, userAddress, part }) => {
            const roomName = `race-${raceId}`;
            // find user 
            const data = connectedUsers.find(i => i.raceId === raceId && i.userAddress === userAddress);
    
            if (!data) {
                // add user
                connectedUsers.push({ room: roomName, id: socket.id, userAddress, raceId, part });
            } else {
                connectedUsers = connectedUsers.map(i => {
                    if (i => i.raceId === raceId && i.userAddress === userAddress) {
                        i.part = part;
                        i.id = socket.id;
                    }
                    return i;
                });
            }

            // set latest creen
            const roomScreenData = roomsLatestScreen.find(i => i.raceId == raceId);
            if (roomScreenData && (screens.indexOf(roomScreenData.screen) < screens.indexOf(part))) {
                console.log({part});
                roomScreenData.screen = part;
            } else {
                roomsLatestScreen.push({ raceId, screen: part });
            }
    
            socket.join(roomName);
            // send the socket event
            //console.log('joined',  {socketId: socket.id, userAddress, raceId, roomName, part})
            io.to(roomName).emit('joined', {socketId: socket.id, userAddress, raceId, part});
        });

        socket.on('get-latest-screen', ({ raceId }) => {
            const roomScreenData = roomsLatestScreen.find(i => i.raceId == raceId);
            let latestScreen = screens[0];
            if (roomScreenData?.screen) {
                latestScreen = roomScreenData.screen;
            }
            io.to(socket.id).emit('latest-screen', { raceId, screen: latestScreen });
        });
    
        // minimize race (game)
        socket.on('minimize-live-game', ({ part, raceId }) => {
            //console.log('mimized', { part, raceId })
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
            // rm user
            connectedUsers = connectedUsers.filter(i => i.id !== socket.id);
            
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                socket.leave(roomName);
                io.to(roomName).emit('leaved', {socketId: socket.id, part, raceId, movedToNext: true});
            });
        });
    
        // Listen for 'update-progress' events
        socket.on('update-progress', ({ raceId, userAddress, property, value, version }) => {
            const roomName = `race-${raceId}`;
            
            // try to find existing progress
            let rProgress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
            
            if (!rProgress) {
                rProgress = {
                    room: roomName,
                    userAddress,
                    progress: {
                        countdown: false,
                        board1: false,
                        board2: false,
                        board3: false,
                        board4: false,
                        nicknameSet: false,
                        story: {
                            intro: false,
                            part1: false,
                            part2: false,
                            part3: false,
                            part4: false,
                            conclusion: false,
                        },
                        ...underdogBaseState,
                        ...rabbitHoleBaseState,
                        ...bullrunBaseState,
                    }
                };

                racesProgresses.push(rProgress);
            }

            // clone to avoid issues
            const updatedRProgress = JSON.parse(JSON.stringify(rProgress));

            const updatedProgress = updateProgress(property, value, updatedRProgress, version);

            // update rProgress by index
            const index = racesProgresses.findIndex(i => i?.room === roomName && i?.userAddress === userAddress);
            racesProgresses[index] = updatedProgress;

            io.to(roomName).emit('progress-updated', { raceId, property, value, userAddress, rProgress: updatedProgress });
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

            /*
            console.log("PROGRESSES", progresses.map(i => {
                return {
                    userAddress: i.userAddress,
                    game2: {...i.progress.game2.v1.game}
                }
            }));
            */
            
            io.to(socket.id).emit(`race-fuel-all-tunnel`, {
                progresses: progresses.map(i => {
                    return {
                        userAddress: i.userAddress,
                        ...i.progress.game2
                    }
                }),
            });
        });

        socket.on('tunnel-started', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            io.to(roomName).emit('tunnel-started-on-client', { socketId: socket.id, raceId });
        });

        socket.on('rabbit-hole-results-shown', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            io.to(roomName).emit('rabbit-hole-results-shown-on-client', { socketId: socket.id, raceId });
        });

        socket.on('underdog-results-shown', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            io.to(roomName).emit('underdog-results-shown-on-client', { socketId: socket.id, raceId });
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

        socket.on('bullrun-join-game', async({ raceId, userAddress, amountOfGamesRequired }) => {
            //console.log('bullrun-join-game', { raceId, userAddress, amountOfGamesRequired });
            const roomName = `race-${raceId}`;
            socket.join(roomName);

            // Initialize game data for the race if not already initialized
            if (!gamesRequired[raceId]) {
                gamesRequired[raceId] = {};      // Track required games per player
                matchesPlayed[raceId] = {};      // Track matches each player has played
                gameCounts[raceId] = {};         // Track how many games each player has completed
                gameCompletesAmount[raceId] = 0; // Initialize completed games counter for race
                activePlayers[raceId] = [];      // Track active players in the race
                waitingPlayers[raceId] = [];     // Track players waiting for a match
            }
        
            // Initialize game data for the player
            function initializePlayer(playerId, socket) {
                if (!matchesPlayed[raceId][playerId]) matchesPlayed[raceId][playerId] = [];
                if (!gameCounts[raceId][playerId]) gameCounts[raceId][playerId] = 0;
                if (!gamesRequired[raceId][playerId]) gamesRequired[raceId][playerId] = amountOfGamesRequired;
            }
            initializePlayer(socket.id, socket);
            socket.userAddress = userAddress;
            // get players from waiting queue
            activePlayers[raceId] = [...activePlayers[raceId], ...waitingPlayers[raceId]];
            waitingPlayers[raceId] = [];

            //console.log("ACTIVE BEFORE:", activePlayers[raceId].map(i => i.id));
            if (!activePlayers[raceId].includes(socket)) {
                activePlayers[raceId].push(socket); 
            }
            //console.log("GR_:", gamesRequired[raceId]);
            //console.log("UPDATED LIST OF ACTIVE PLAYERS:", activePlayers[raceId].map(i => i.id));
        
            // Pair players and start the game
            function pairPlayers() {
                //console.log("LIST OF ACTIVE PLAYERS...", activePlayers[raceId].map(i => i.id));
            
                let maxRetries = activePlayers[raceId].length * 2; // Limit retries to prevent infinite loops
                let retries = 0;
            
                // Pair players only if we have at least 2 waiting players
                while (activePlayers[raceId].length >= 2 && retries < maxRetries) {
                    const player1 = activePlayers[raceId].shift();
                    const player2 = activePlayers[raceId].shift();
                    //console.log("TRYING TO PAIR...", player1.id, player2.id);
            
                    // Ensure player1 and player2 are not the same person
                    if (player1.id === player2.id) {
                        //console.log("ERROR: Trying to pair player with themselves!", player1.id);
                        waitingPlayers[raceId].push(player1, player2); // Put both players back in waiting queue
                        retries++;
                        continue;
                    }
            
                    // Ensure players can still play more games and haven't played each other yet
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
                        io.to(player1.id).emit('bullrun-game-start', { players: [player1.id, player2.id], opponent: { id: player2.id, userAddress: player2.userAddress } });
                        io.to(player2.id).emit('bullrun-game-start', { players: [player2.id, player1.id], opponent: { id: player1.id, userAddress: player1.userAddress } });
            
                        //console.log(`Pairing players: ${player1.id} vs ${player2.id}`);
            
                        // Track matches played
                        matchesPlayed[raceId][player1.id].push(player2.id);
                        matchesPlayed[raceId][player2.id].push(player1.id);
            
                        // Increment their game counts
                        incrementGameCount(player1, player2);
                    } else {
                        //console.log("TRYING TO PAIR...", player1.id, player2.id, "FAILED!");
                        // If pairing fails, put players back in the queue but rotate them
                        waitingPlayers[raceId].push(player1);
                        activePlayers[raceId].push(player2);
                        retries++;
                        continue;  // Continue to try pairing other players
                    }
                }
            
                // If only one player is left unpaired, move them to the waiting list
                if (activePlayers[raceId].length === 1) {
                    const remainingPlayer = activePlayers[raceId].shift();
                    waitingPlayers[raceId].push(remainingPlayer);
                    io.to(remainingPlayer.id).emit('bullrun-waiting', { message: 'Waiting for an opponent', raceId });
                }
            
                if (retries >= maxRetries) {
                    //console.log('Max retries reached, ending pairing attempts for now.');
                }
            }
            

            // Increment game count and handle completion checks
            function incrementGameCount(player1, player2) {
                gameCounts[raceId][player1.id]++;
                gameCounts[raceId][player2.id]++;
                //console.log(`Incremented gameCounts for players: ${player1.id} (${gameCounts[raceId][player1.id]}) and ${player2.id} (${gameCounts[raceId][player2.id]})`);
            }
        
            pairPlayers();
        });
        
        socket.on('bullrun-game-end', ({raceId}) => {
            // Check if player completed all games
            if (gameCounts[raceId][socket.id] >= gamesRequired[raceId][socket.id]) {
                // gameCompletes[raceId][socket.id] = true;
                gameCompletesAmount[raceId]++;
                io.to(socket.id).emit('bullrun-game-complete', { 
                    message: 'You have completed all your games', 
                    raceId 
                });
            } else {
                io.to(socket.id).emit('bullrun-game-continue', { 
                    message: `You can contInue playing ${gameCounts[raceId][socket.id]}/${gamesRequired[raceId][socket.id]}`, 
                    raceId 
                });
            }

            // Emit the updated amount of completed games to the room
            io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: gameCompletesAmount[raceId] });
        });

    });

    console.log("[SOCKET] Events applied.");
}