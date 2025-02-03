const updateProgress = require("./update-progress");
const underdogBaseState = require("./default-states-by-games/underdog");
const rabbitHoleBaseState = require("./default-states-by-games/rabbit-hole");
const bullrunBaseState = require("./default-states-by-games/bullrun");
const { finishRace } = require("../models/users/users.model");

const { 
    ActivePlayer,
    ConnectedUser,
    QuestionsState,
    RaceProgress,
    Screen,
    TunnelState,
    WaitingPlayer,
    PlayerPoints,
} = require('../models/games-socket/index');


// UNDERDOG
let questionsGameStates = [["answering", "submitting"], ["distributing", "distributed"]];


// RABBIT_HOLE
let tunnelGameStates = ["reset", "default", "close", "open"];


// BULLRUN
let activePlayers = {};
let waitingPlayers = {};
let matchesPlayed = {};  // matches between players (e.g., { 'player1_id': ['player2_id', ...] })
let gameCounts = {};     // number of games each player has played (e.g., { 'player1_id': 3, ... })
let gamesRequired = {};  // number of games per player required to move to next game  { 'player1_id': 3, ... }
let gameCompletesAmount = {};
let gameCompletes = {};
let inGamePlayers = {}; // Track players currently in a game by raceId



module.exports = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });

    io.on("connection", async socket => { 
         // when user disconnects
         socket.on('disconnect', async() => {
            // Find all rooms this socket was connected to before filtering
            const userConnection = await ConnectedUser.findOne({ id: socket.id });
            
            if (!userConnection) {
                //console.log("No user active session, skip leave event");
                return;
            }

            const connectedUsers = await ConnectedUser.find();

            // Remove user from connected users
            if (userConnection) {

                const usersInRace = connectedUsers.filter(u => (u.id !== socket.id) && (u.room == userConnection.room));
                if (usersInRace.length == 0) {
                    //console.log("[alert] no users in game left!");
                    //console.log(userConnection)

                    const roomScreenData = await Screen.findOne({ room: userConnection.room });

                    if (roomScreenData && ["UNDERDOG", "BULLRUN", "RABBIT_HOLE"].includes(roomScreenData.latestScreen)) {
                        const screenNamesPerUserConnection = await Screen.find({ room: userConnection.room });
                        const screenPos = screenNamesPerUserConnection.indexOf(roomScreenData.latestScreen);
                        

                        if (screenNamesPerUserConnection.length - 1 >= screenPos + 1) {
                            roomScreenData.latestScreen = screenNamesPerUserConnection[screenPos + 1];
                        } else {
                            roomScreenData.latestScreen = screenNamesPerUserConnection[screenNamesPerUserConnection.length - 1];
                        }

                        await roomScreenData.save();
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
        socket.on('connect-live-game', async ({ raceId, userAddress, part, screensOrder }) => {
            const roomName = `race-${raceId}`;
            let screensOrderDB = await Screen.findOne({ room: roomName });

            if (!screensOrderDB && screensOrder) {
                screensOrderDB = await Screen.create({ room: roomName, raceId, screens: screensOrder })
            }
            //console.log("Connect live game", roomName, userAddress, part);

            // Remove any existing connections for this user address
            await ConnectedUser.deleteMany({ userAddress, room: roomName });

            // Add new connection with unique socket ID
            const newUser = new ConnectedUser({
                room: roomName,
                id: socket.id,
                userAddress,
            });
            await newUser.save();

            // set latest screen
            if (screensOrderDB && (screensOrderDB.indexOf(screensOrderDB.latestScreen) < screensOrderDB.indexOf(part))) {
                console.log({part});
                screensOrderDB.latestScreen = part;
                await screensOrderDB.save();
            }
            io.to(roomName).emit('screen-changed', { screen: part });

            socket.join(roomName);
            io.to(roomName).emit('joined', {
                socketId: socket.id, 
                userAddress, 
                raceId, 
                part
            });
        });

        socket.on('get-latest-screen', async ({ raceId }) => {
            const roomName = `race-${raceId}`;

            const roomScreenData = await Screen.findOne({ raceId: raceId, room: roomName });

            let latestScreen = undefined;
            
            if (roomScreenData?.latestScreen) {
                latestScreen = roomScreenData.latestScreen;
            }
            
            if (!latestScreen) {
                latestScreen = "UNKNOWN";
                roomScreenData.latestScreen = latestScreen;
                await roomScreenData.save();
            }

            io.to(socket.id).emit('latest-screen', { raceId, screen: latestScreen });
        });
    
        // minimize race (game)
        socket.on('minimize-live-game', async({ part, raceId }) => {
            //console.log('mimized', { part, raceId })
            const connectedUsers = await ConnectedUser.find({ room: `race-${raceId}` })
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
            // rm user
            await ConnectedUser.deleteOne({ id: socket.id });
            
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                socket.leave(roomName);
                io.to(roomName).emit('leaved', {socketId: socket.id, part, raceId, movedToNext: true});
            });
        });
    
        // Listen for 'update-progress' events
        socket.on('update-progress', async ({ raceId, userAddress, property, value, version }) => {
            // console.log({ raceId, userAddress, property, value, version })
            const roomName = `race-${raceId}`;
            
            let rProgress = await RaceProgress.findOne({ room: roomName, userAddress });
            
            if (!rProgress) {
                rProgress = new RaceProgress({
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
                });

                await rProgress.save();
            }

            // clone to avoid issues
            const updatedRProgress = JSON.parse(JSON.stringify(rProgress));


            if (property === 'game2-eliminate') {
                const racesProgresses = await RaceProgress.find({ room: roomName });
                const connectedUsers = await ConnectedUser.find({ room: roomName });

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

            // Update the progress in MongoDB
            await RaceProgress.updateOne(
                { room: roomName, userAddress },
                { $set: updatedProgress }
            );

            io.to(roomName).emit('progress-updated', { raceId, property, value, userAddress, rProgress: updatedProgress });
        });





        socket.on('set-questions-state', async ({ raceId, newIndex, secondsLeft, state }) => {
            const roomName = `race-${raceId}`;
            let currData = await QuestionsState.findOne({ room: roomName });

            if (!currData) {
                const newState = new QuestionsState({
                    room: roomName,
                    index: newIndex,
                    secondsLeft,
                    state: 'answering',
                });
                await newState.save();
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

            // Update the state in MongoDB
            await QuestionsState.updateOne(
                { room: roomName },
                { $set: { index: currData.index, secondsLeft: currData.secondsLeft, state } }
            );

            io.to(roomName).emit('questions-state', { raceId, data: currData });
        });

        socket.on('get-questions-state', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const currData = await QuestionsState.findOne({ room: roomName });

            if (!currData) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                await QuestionsState.create(newState);
                io.to(socket.id).emit('questions-state', { raceId, data: newState });
                return;
            }
            io.to(socket.id).emit('questions-state', { raceId, data: currData })
        });





        socket.on('set-tunnel-state', async ({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished }) => {
            //console.log({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished })
            const roomName = `race-${raceId}`;
            let currData = await TunnelState.findOne({ room: roomName });

            if (!currData) {
                const newState = new TunnelState({
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: addRoundsPlayed,
                    gameState,
                    isFinished: false,
                });
                await newState.save();
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

            // Update the tunnel state in MongoDB
            await TunnelState.updateOne(
                { room: roomName },
                { $set: currData }
            );

            io.to(roomName).emit('tunnel-state', { raceId, data: currData });
        });

        socket.on('get-tunnel-state', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const currData = await TunnelState.findOne({ room: roomName });

            if (!currData) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                await TunnelState.create(newState);

                io.to(socket.id).emit('tunnel-state', { raceId, data: newState });
                return;
            }
            io.to(socket.id).emit('tunnel-state', { raceId, data: currData })
        });



    
        // get amount completed by raceId game gameId
        socket.on('get-progress', async ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            const racesProgresses = await RaceProgress.findOne({ room: roomName });
            const progress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
          
            let questionsStateValue = await QuestionsState.findOne({ room: roomName });
            let tunnelStateValue = await TunnelState.findOne({ room: roomName });

            if (!questionsStateValue) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                questionsStateValue = await QuestionsState.create(newState);
            }

            if (!tunnelStateValue) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                tunnelStateValue = await TunnelState.create(newState);
            }

            const roomScreenData = await Screen.findOne({ raceId, room: roomName });

            io.to(socket.id).emit('race-progress', { 
                progress, 
                latestScreen: roomScreenData.latestScreen,
                questionsState: questionsStateValue,
                tunnelState: tunnelStateValue
            });
        });
    
        // get amount completed by raceId game gameId
        socket.on('get-progress-all', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progress = await RaceProgress.find({ room: roomName });
            io.to(socket.id).emit('race-progress-all', { progress });
        });

    
        // get all progresses for tunnel game
        socket.on('get-all-fuel-tunnel', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progresses = await RaceProgress.find({ room: roomName });

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
            const connectedInRoom = ConnectedUser.find({ room: roomName });
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

        socket.on('player-add-points', async ({ raceId, points, userAddress }) => {
            const roomName = `room-${raceId}`;
            let playerPoints = await PlayerPoints.findOne({ userAddress, room: roomName });

            if (!playerPoints) {
                playerPoints = await PlayerPoints.create({ 
                    userAddress, room: 
                    roomName, 
                    points, 
                    finished: false 
                });
            } else {
                playerPoints.points += points;
                await playerPoints.save();
            }

            console.log({ raceId, points, userAddress });
        });

        socket.on('race-finish', async ({raceId, userAddress}) => {
            const roomName = `room-${raceId}`;

            const playersPointsData = await PlayerPoints.find({ room: roomName });

            if (!playersPointsData || playersPointsData.length === 0) {
                return;
            }

            // Sort players by points in descending order
            playersPointsData.sort((a, b) => b.points - a.points);

            const centralIndex = Math.floor(playersPointsData.length / 2);
            // const centralScore = playersPointsData[centralIndex]?.points || 0;

            // Use Promise.all to handle multiple async operations
            await Promise.all(playersPointsData.map(async (player, index) => {
                player.finished = true;
                await player.save();

                let property = "decrement";
                if (index < centralIndex) {
                    property = "increment";
                }

                console.log(
                    player.userAddress,
                    property,
                    raceId
                );

                await finishRace(
                    player.userAddress,
                    property,
                    raceId
                );
            }));
        });
    });

    console.log("[SOCKET] Events applied.");
}