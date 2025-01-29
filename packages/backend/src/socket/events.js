const updateProgress = require("./update-progress");
const underdogBaseState = require("./default-states-by-games/underdog");
const rabbitHoleBaseState = require("./default-states-by-games/rabbit-hole");
const bullrunBaseState = require("./default-states-by-games/bullrun");
const { finishRace } = require("../models/users/users.model");

// { room: string, id: string, userAddress: string }
let connectedUsers = [];
// { room: string, userAddress: string, progress: ("countdown": number, "game-1": number, "board-1": number, "game-2": number) }
let racesProgresses = [];

// { raceId: string, screen: string }
let screens = {};

let roomsLatestScreen = [];

// UNDERDOG
// { 
// 'room': string, 
// 'index': number, 
// 'secondsLeft': number,
// }
let questionsGameStates = [["answering", "submitting"], ["distributing", "distributed"]];
let questionsState = [];

// RABBIT_HOLE
// { 
// 'room': string, 
// 'secondsLeft': number,
// 'roundsPlayed': number,
// }
let tunnelGameStates = ["reset", "default", "close", "open"];
let tunnelState = [];


// BULLRUN
let activePlayers = {};
let waitingPlayers = {};
let matchesPlayed = {};  // matches between players (e.g., { 'player1_id': ['player2_id', ...] })
let gameCounts = {};     // number of games each player has played (e.g., { 'player1_id': 3, ... })
let gamesRequired = {};  // number of games per player required to move to next game  { 'player1_id': 3, ... }
let gameCompletesAmount = {};
let gameCompletes = {};
let inGamePlayers = {}; // Track players currently in a game by raceId


// PLAYER IN-GAME POINTS
let playerPoints = [];


module.exports = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });

    io.on("connection", socket => { 
         // when user disconnects
         socket.on('disconnect', () => {
            // Find all rooms this socket was connected to before filtering
            const userConnection = connectedUsers.find(i => i.id === socket.id);

            // Log the disconnect attempt
            /*
            console.log("Disconnect attempt for socket:", {
                socketId: socket.id,
                foundUser: userConnection,
                allConnectedUsers: connectedUsers.map(u => ({id: u.id, room: u.room, address: u.userAddress}))
            });
            */
            
            if (!userConnection) {
                //console.log("No user active session, skip leave event");
                return;
            }

            // Remove user from connected users
            if (userConnection) {
                connectedUsers = connectedUsers.filter(i => i.id !== socket.id);

                const usersInRace = connectedUsers.filter(u => u.raceId == userConnection.raceId);
                if (usersInRace.length == 0) {
                    //console.log("[alert] no users in game left!");
                    //console.log(userConnection)
                    // Reset the latest screen to initial state when all users disconnect
                    const roomScreenIndex = roomsLatestScreen.findIndex(i => i.raceId == userConnection.raceId);
                    if (roomScreenIndex == -1) {
                        //console.log("no screen found, set:", screens[0]);
                        roomsLatestScreen.push({
                            raceId: userConnection.raceId,
                            screen: "RACE_START"
                        });
                    } else if (["UNDERDOG", "BULLRUN", "RABBIT_HOLE"].includes(roomsLatestScreen[roomScreenIndex].screen)) {
                        const screen = roomsLatestScreen[roomScreenIndex].screen;

                        const screenNamesPerUserConnection = screens[userConnection.room];
                        const screenPos = screenNamesPerUserConnection.indexOf(screen);
                        

                        if (screenNamesPerUserConnection.length - 1 >= screenPos + 1) {
                            roomsLatestScreen[roomScreenIndex].screen = screenNamesPerUserConnection[screenPos + 1];
                        } else {
                            roomsLatestScreen[roomScreenIndex].screen = screenNamesPerUserConnection[screenNamesPerUserConnection.length - 1];
                        }
                    }
                }
                
                // Leave rooms and emit events
                
                socket.leave(userConnection.room);
                io.to(userConnection.room).emit('leaved', {
                    socketId: socket.id,
                    userAddress: userConnection.userAddress,
                    raceId: userConnection.raceId,
                    movedToNext: false,
                    part: userConnection.part
                });
                

                // handling bullrun
                if (userConnection.userAddress && userConnection.raceId) {
                    // Initialize arrays if they don't exist
                    if (!activePlayers[userConnection.raceId]) activePlayers[userConnection.raceId] = [];
                    if (!waitingPlayers[userConnection.raceId]) waitingPlayers[userConnection.raceId] = [];

                    // Remove the disconnected user from both arrays
                    activePlayers[userConnection.raceId] = activePlayers[userConnection.raceId].filter(i => i.userAddress != userConnection.userAddress);
                    waitingPlayers[userConnection.raceId] = waitingPlayers[userConnection.raceId].filter(i => i.userAddress != userConnection.userAddress);

                    // Initialize other data structures if they don't exist
                    if (!gameCompletes[userConnection.raceId]) gameCompletes[userConnection.raceId] = {};
                    if (!gamesRequired[userConnection.raceId]) gamesRequired[userConnection.raceId] = {};
                    if (!gameCounts[userConnection.raceId]) gameCounts[userConnection.raceId] = {};
                    if (!matchesPlayed[userConnection.raceId]) matchesPlayed[userConnection.raceId] = {};
                    if (!gameCompletesAmount[userConnection.raceId]) gameCompletesAmount[userConnection.raceId] = 0;

                    // Get all remaining players
                    const remainingPlayers = [
                        ...(activePlayers[userConnection.raceId] || []), 
                        ...(waitingPlayers[userConnection.raceId] || []),
                        ...(inGamePlayers[userConnection.raceId] || [])
                    ];
                    /*
                    console.log("Remaining players:", remainingPlayers.map(p => ({
                        id: p.id,
                        address: p.userAddress
                    })));
                    */

                    const remainingPlayersCount = remainingPlayers.length;

                    // Calculate new required games based on remaining players
                    const newRequiredGames = Math.max(0, remainingPlayersCount - 1);

                    // For each remaining player
                    remainingPlayers.forEach(player => {
                        // Update required games to new value
                        gamesRequired[userConnection.raceId][player.userAddress] = newRequiredGames;

                        // If they haven't played against the leaving player, increment their game count
                        if (!matchesPlayed[userConnection.raceId][player.userAddress]?.includes(userConnection.userAddress)) {
                            gameCounts[userConnection.raceId][player.userAddress] = 
                                (gameCounts[userConnection.raceId][player.userAddress] || 0) + 1;
                        }

                        // Check if player has completed their games
                        if (gameCounts[userConnection.raceId][player.userAddress] >= newRequiredGames) {
                            if (!gameCompletes[userConnection.raceId][player.userAddress]) {
                                gameCompletes[userConnection.raceId][player.userAddress] = true;
                                gameCompletesAmount[userConnection.raceId]++;
                            }
                        }
                    });

                    // Notify remaining players about updates
                    const roomName = `race-${userConnection.raceId}`;
                    io.to(roomName).emit('bullrun-required-games-descreased', {
                        raceId: userConnection.raceId,
                    });

                    // Emit updated game counts to all remaining players
                    remainingPlayers.forEach(player => {
                        io.to(player.id).emit('bullrun-game-counts', {
                            raceId: userConnection.raceId,
                            userAddress: player.userAddress,
                            gameCounts: gameCounts[userConnection.raceId][player.userAddress],
                            gameCompletesAmount: gameCompletesAmount[userConnection.raceId],
                        });
                    });
                }

                /*
                console.log("User disconnected:", {
                    socketId: socket.id,
                    userAddress: userConnection.userAddress,
                    rooms: roomsToEmitDisconnectEvent
                });
                */
            }
        });
    
        // connect the live
        socket.on('connect-live-game', ({ raceId, userAddress, part, screensOrder }) => {
            const roomName = `race-${raceId}`;

            if (!screens[roomName] && screensOrder) {
                screens[roomName] = screensOrder;
            }
            //console.log("Connect live game", roomName, userAddress, part);

            // Remove any existing connections for this user address
            connectedUsers = connectedUsers.filter(user => 
                !(user.userAddress === userAddress && user.room === roomName)
            );

            // Add new connection with unique socket ID
            connectedUsers.push({
                room: roomName, 
                id: socket.id,  // This should now be unique
                userAddress, 
                raceId, 
                part 
            });

            // Log current connections for debugging
            /*
            console.log("Current connections:", connectedUsers.map(u => ({
                socketId: u.id,
                address: u.userAddress,
                room: u.room
            })));
            */

            // set latest screen
            const roomScreenData = roomsLatestScreen.find(i => i.raceId == raceId);
            if (roomScreenData && (screens[roomName].indexOf(roomScreenData.screen) < screens[roomName].indexOf(part))) {
                console.log({part});
                roomScreenData.screen = part;
                io.to(roomName).emit('screen-changed', { screen: part });
            } else if (!roomScreenData) {
                roomsLatestScreen.push({ raceId, screen: part });
                io.to(roomName).emit('screen-changed', { screen: part });
            }

            socket.join(roomName);
            io.to(roomName).emit('joined', {
                socketId: socket.id, 
                userAddress, 
                raceId, 
                part
            });
        });

        socket.on('get-latest-screen', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const roomScreenData = roomsLatestScreen.find(i => i.raceId == raceId);

            let latestScreen = undefined;
            
            if (roomScreenData?.screen) {
                latestScreen = roomScreenData.screen;
            }
            
            if (!screens[roomName]) {
                latestScreen = "UNKNOWN";
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
            // console.log({ raceId, userAddress, property, value, version })
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


            if (property === 'game2-eliminate') {
                // Set the fuel of all players who are not connected to 0
                racesProgresses.forEach(progress => {
                    // Check if the player is not the eliminating player and is not connected
                    if (progress.userAddress !== userAddress && !connectedUsers.some(user => user.userAddress === progress.userAddress)) {
                        progress.progress.game2[version] = {
                            ...progress.progress.game2[version],
                            game: {
                                ...progress.progress.game2[version].game,
                                fuel: 0, // Set fuel to 0 for players who are not connected
                            }
                        };
                    }
                });

                // Set the fuel of the eliminating player to 0
                const eliminatingPlayerProgress = racesProgresses.find(progress => progress.userAddress === userAddress);
                if (eliminatingPlayerProgress) {
                    eliminatingPlayerProgress.progress.game2[version] = {
                        ...eliminatingPlayerProgress.progress.game2[version],
                        game: {
                            ...eliminatingPlayerProgress.progress.game2[version].game,
                            fuel: 0, // Set fuel to 0 for the eliminating player
                        }
                    };
                }
            }
            

            const updatedProgress = updateProgress(property, value, updatedRProgress, version);

            // update rProgress by index
            const index = racesProgresses.findIndex(i => i?.room === roomName && i?.userAddress === userAddress);
            racesProgresses[index] = updatedProgress;

            io.to(roomName).emit('progress-updated', { raceId, property, value, userAddress, rProgress: updatedProgress });
        });





        socket.on('set-questions-state', ({ raceId, newIndex, secondsLeft, state }) => {
            const roomName = `race-${raceId}`;
            const currData = questionsState.find(i => i.room == roomName);
            //console.log("Data:", currData)
            if (!currData) {
                const newState = {
                    room: roomName,
                    index: newIndex,
                    secondsLeft,
                    state: 'answering'
                };
                questionsState.push(newState);
                //console.log("New data:", newState)

                io.to(roomName).emit('questions-state', { raceId, data: newState });
                return;
            }

            if (currData.index < newIndex) {
                currData.index = newIndex;
            }

            currData.secondsLeft = secondsLeft;

            const newStateLevel = questionsGameStates.indexOf(i => i.includes(state));
            const currStateLevel = questionsGameStates.indexOf(i => i.includes(currData.state));
            if (newStateLevel >= currStateLevel) {
                currData.state = state;
            }

            //console.log("Updated data:", currData)

            io.to(roomName).emit('questions-state', { raceId, data: currData })
        });

        socket.on('get-questions-state', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const currData = questionsState.find(i => i.room == roomName);

            if (!currData) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                questionsState.push(newState);
                io.to(socket.id).emit('questions-state', { raceId, data: newState });
                return;
            }
            io.to(socket.id).emit('questions-state', { raceId, data: currData })
        });





        socket.on('set-tunnel-state', ({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished }) => {
            //console.log({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished })
            const roomName = `race-${raceId}`;
            const currData = tunnelState.find(i => i.room == roomName);
            //console.log("Data:", currData)
            if (!currData) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: addRoundsPlayed,
                    gameState,
                    isFinished: false,
                };
                tunnelState.push(newState);
                //console.log("New data:", newState)

                io.to(roomName).emit('tunnel-state', { raceId, data: newState });
                return;
            }

            if (secondsLeft < currData.secondsLeft) {
                currData.secondsLeft = secondsLeft;
            }

            currData.roundsPlayed += addRoundsPlayed;

            if (gameState && tunnelGameStates.includes(gameState)) {
                currData.gameState = gameState;
            }

            if (isFinished) {
                currData.isFinished = true;
            }

            //console.log("Updated data:", currData)

            io.to(roomName).emit('tunnel-state', { raceId, data: currData })
        });

        socket.on('get-tunnel-state', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const currData = tunnelState.find(i => i.room == roomName);

            if (!currData) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                tunnelState.push(newState);
                io.to(socket.id).emit('tunnel-state', { raceId, data: newState });
                return;
            }
            io.to(socket.id).emit('tunnel-state', { raceId, data: currData })
        });



    
        // get amount completed by raceId game gameId
        socket.on('get-progress', ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            const progress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
            let questionsStateValue = questionsState.find(i => i?.room == roomName);
            let tunnelStateValue = tunnelState.find(i => i?.room == roomName);

            if (!questionsStateValue) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                questionsState.push(newState);
                questionsStateValue = newState;
            }

            if (!tunnelStateValue) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                tunnelState.push(newState);
                tunnelStateValue = newState;
            }

            const roomScreenData = roomsLatestScreen.find(i => i.raceId == raceId);

            io.to(socket.id).emit('race-progress', { 
                progress, 
                latestScreen: roomScreenData ? roomScreenData.screen : undefined,
                questionsState: questionsStateValue,
                tunnelState: tunnelStateValue
            });
        });
    
        // get amount completed by raceId game gameId
        socket.on('get-progress-all', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progress = racesProgresses.filter(i => i?.room === roomName);
            io.to(socket.id).emit('race-progress-all', { progress });
        });

    
        // get all progresses for tunnel game
        socket.on('get-all-fuel-tunnel', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progresses = racesProgresses.filter(i => i.room == roomName);

            /*
            console.log("PROGRESSES", raceId, roomName, progresses.map(i => {
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
        socket.on('get-connected', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const connectedInRoom = connectedUsers.filter(user => user.room === roomName);
            io.to(socket.id).emit('amount-of-connected', { 
                amount: connectedInRoom.length, 
                raceId 
            });
        });
        
        
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
            if (!gamesRequired[raceId]) {
                gamesRequired[raceId] = {};      // Track required games per player
                matchesPlayed[raceId] = {};      // Track matches each player has played
                gameCounts[raceId] = {};         // Track how many games each player has completed
                gameCompletesAmount[raceId] = 0; // Initialize completed games counter for race
                activePlayers[raceId] = [];      // Track active players in the race
                waitingPlayers[raceId] = [];     // Track players waiting for a match
                gameCompletes[raceId] = {};      // Track game completes by player web3 address
                inGamePlayers[raceId] = [];
            }
        
            // Initialize game data for the player
            function initializePlayer(playerAddress, socket) {
                if (!matchesPlayed[raceId][playerAddress]) matchesPlayed[raceId][playerAddress] = [];
                if (!gameCounts[raceId][playerAddress]) gameCounts[raceId][playerAddress] = 0;
                if (!gamesRequired[raceId][playerAddress]) gamesRequired[raceId][playerAddress] = amountOfGamesRequired;

                if (!inGamePlayers[raceId]) inGamePlayers[raceId] = [];

                // Check if the player is not in inGamePlayers
                if (!Array(inGamePlayers[raceId]).indexOf(i => i.userAddress == playerAddress)) {
                        console.log("PUSH:", playerAddress)
                    inGamePlayers[raceId].push(socket); 
                }
            }
            socket.userAddress = userAddress; 
            initializePlayer(userAddress, socket);
        
        
            // get players from waiting queue
            activePlayers[raceId] = [...(activePlayers[raceId] || []), ...(waitingPlayers[raceId] || [])];
            waitingPlayers[raceId] = [];
        
            //console.log("ACTIVE BEFORE:", activePlayers[raceId].map(i => i.id));
            if (!activePlayers[raceId].some(p => p.userAddress === userAddress)) {
                activePlayers[raceId].push(socket); 
            }
            //console.log("UPDATED LIST OF ACTIVE PLAYERS:", activePlayers[raceId].map(i => ({id: i.id, address: i.userAddress})));
        
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
                    if (player1.userAddress === player2.userAddress) {
                        //console.log("ERROR: Trying to pair player with themselves!", player1.id);
                        waitingPlayers[raceId].push(player1, player2); // Put both players back in waiting queue
                        retries++;
                        continue;
                    }
            
                    // Ensure players can still play more games and haven't played each other yet
                    if (
                        gameCounts[raceId][player1.userAddress] < gamesRequired[raceId][player1.userAddress] &&
                        gameCounts[raceId][player2.userAddress] < gamesRequired[raceId][player2.userAddress] &&
                        !matchesPlayed[raceId][player1.userAddress].includes(player2.userAddress) &&
                        !matchesPlayed[raceId][player2.userAddress].includes(player1.userAddress)
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
                        matchesPlayed[raceId][player1.userAddress].push(player2.userAddress);
                        matchesPlayed[raceId][player2.userAddress].push(player1.userAddress);
            
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

                    if (gameCounts[raceId][remainingPlayer.userAddress] >= gamesRequired[raceId][remainingPlayer.userAddress]) {
                        io.to(remainingPlayer.id).emit('bullrun-game-complete', { 
                            message: 'You have completed all your games', 
                            raceId 
                        });
                        return;
                    }

                    waitingPlayers[raceId].push(remainingPlayer);
                    const gamesPlayed = gameCounts[raceId][remainingPlayer.userAddress];
                    io.to(remainingPlayer.id).emit('bullrun-waiting', { message: `Waiting for an opponent, games played: ${gamesPlayed}`, raceId });
                }
            
                if (retries >= maxRetries) {
                    //console.log('Max retries reached, ending pairing attempts for now.');
                }
            }
            

            // Increment game count and handle completion checks
            function incrementGameCount(player1, player2) {
                gameCounts[raceId][player1.userAddress]++;
                gameCounts[raceId][player2.userAddress]++;
                //console.log(`Incremented gameCounts for players: ${player1.userAddress} (${gameCounts[raceId][player1.userAddress]}) and ${player2.userAddress} (${gameCounts[raceId][player2.userAddress]})`);
            }
        
            pairPlayers();
        });

        socket.on('bullrun-curtains-closing', (data) => {
            io.to(data.toId).emit('bullrun-curtains-closing', data);
            io.to(socket.id).emit('bullrun-curtains-closing', data);
        });

        socket.on('bullrun-get-game-counts', ({ raceId, userAddress }) => {
            io.to(socket.id).emit('bullrun-game-counts', {
                raceId,
                userAddress,
                gameCounts: gameCounts[raceId][userAddress],
                gameCompletesAmount: gameCompletesAmount[raceId],
            });
        });
        
        socket.on('bullrun-game-end', ({raceId}) => {
            // Check if player completed all games
            if (gameCounts[raceId][socket.userAddress] >= gamesRequired[raceId][socket.userAddress]) {
                gameCompletes[raceId][socket.userAddress] = true;
                gameCompletesAmount[raceId]++;
                io.to(socket.id).emit('bullrun-game-complete', { 
                    message: 'You have completed all your games', 
                    raceId 
                });
            } else {
                io.to(socket.id).emit('bullrun-game-continue', { 
                    message: `You can contInue playing ${gameCounts[raceId][socket.userAddress]}/${gamesRequired[raceId][socket.userAddress]}`, 
                    raceId 
                });
            }

            // Emit the updated amount of completed games to the room
            io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: gameCompletesAmount[raceId] });
        });

        socket.on('player-add-points', ({ raceId, points, userAddress }) => {
            if (!playerPoints[raceId]) {
                playerPoints[raceId] = {};
            }

            if (!playerPoints[raceId][userAddress]) {
                playerPoints[raceId][userAddress] = { points, finished: false };
            } else {
                playerPoints[raceId][userAddress].points += points;
            }
            console.log({ raceId, points, userAddress });
        });

        socket.on('race-finish', ({raceId, userAddress}) => {
            if (!playerPoints[raceId]) {
                playerPoints[raceId] = {};
            }

            const entries = Object.entries(playerPoints[raceId]);

            // Sort entries by points in descending order
            entries.sort((a, b) => b[1].points - a[1].points);

            const centralIndex = Math.floor(entries.length / 2);

            const centralScore = entries[centralIndex]?.[1].points || 0; // Default to 0 if no score exists


            entries.forEach((i, key) => {
                if (!playerPoints[raceId][i[0]]) {
                    playerPoints[raceId][i[0]] = { points: 0, finished: true };
                } else {
                    playerPoints[raceId][i[0]].finished = true;
                }

                let property = i[1].points >= centralScore ? "increment" : "decrement";
                if (key >= centralIndex) {
                    property = "decrement";
                }

                console.log(
                    i[0],
                    property,
                    raceId
                );

                finishRace(
                    i[0],
                    property,
                    raceId
                );
            });
        });
    });

    console.log("[SOCKET] Events applied.");
}