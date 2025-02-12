import { updateProgress } from "./update-progress";

import underdogBaseState from "./default-states-by-games/underdog";
import rabbitHoleBaseState from "./default-states-by-games/rabbithole";
import bullrunBaseState from "./default-states-by-games/bullrun";

import { finishRace } from "../models/users/users.model";

// games events

import initUnderdog from './events-by-games/underdog';
import initRabbithole from './events-by-games/rabbithole';
import initBullrun from './events-by-games/bullrun';

import module from '../models/games-socket/index';


const {
    ConnectedUser,
    RaceProgress,
    Screen,
    PlayerPoints,
} = module.default;

const { 
    QuestionsState
} = module.underdog;

const {
    TunnelState
} = module.rabbithole;

const {
    PlayersState,
    InGamePlayers,
    GamesRequired,
    MatchesPlayed,
    GameCounts,
    GameCompletes,
} = module.bullrun;


export const applySocketEvents = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });

    io.on("connection", async socket => { 
        // init games 
        initUnderdog(socket, io);
        initRabbithole(socket, io);
        initBullrun(socket, io);

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
                    // Remove the disconnected user 
                    await PlayersState.deleteMany({ raceId: userConnection.raceId, userAddress: userConnection.userAddress });

                    // Get all remaining players
                    const waitingAndActivePlayers = await PlayersState.find({ raceId: userConnection.raceId });
                    const inGamePlayers = await InGamePlayers.find({ raceId: userConnection.raceId });

                    let remainingPlayers = [
                        ...waitingAndActivePlayers,
                        ...inGamePlayers
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
                    remainingPlayers.forEach(async player => {
                        // Update required games to new value
                        await GamesRequired.findOneAndUpdate(
                            { raceId: userConnection.raceId, userAddress: player.userAddress }, 
                            { requiredGames: newRequiredGames },
                            { upsert: true }
                        );

                        // If they haven't played against the leaving player, increment their game count
                        const matchesPlayedAgainstPlayer = await MatchesPlayed.find({ 
                            raceId: userConnection.raceId, 
                            $or: [{ player1: player.userAddress }, { player2: player.userAddress }] 
                        });

                        // if user was not playing against leaving player
                        if (!matchesPlayedAgainstPlayer.find(i => i.player1 == userConnection.userAddress || i.player2 == userConnection.userAddress)) {
                            await GameCounts.findOneAndUpdate(
                                { raceId: userConnection.raceId, userAddress: player.userAddress },
                                { $inc: { count: 1 } },
                                { upsert: true }
                            );
                        }

                        // Check if player has completed his games
                        const playerGameCounts = await GameCounts.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress });

                        if (playerGameCounts.count >= newRequiredGames) {
                            const gameCompletesUser = await GameCompletes.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress });
                            if (!gameCompletesUser) {
                                await GameCompletes.create({ raceId: userConnection.raceId, userAddress: player.userAddress, completed: true });
                            }
                        }
                    });

                    // Notify remaining players about updates
                    const roomName = `race-${userConnection.raceId}`;
                    io.to(roomName).emit('bullrun-required-games-descreased', {
                        raceId: userConnection.raceId,
                    });

                    const currentGameAndUserCounts = (await GameCounts.findOne({ raceId: userConnection.raceId })).count;
                    const currentRaceGameCompletes = await GameCompletes.countDocuments({ raceId: userConnection.raceId });

                    // Emit updated game counts to all remaining players
                    remainingPlayers.forEach(player => {
                        io.to(player.id).emit('bullrun-game-counts', {
                            raceId: userConnection.raceId,
                            userAddress: player.userAddress,
                            gameCounts: currentGameAndUserCounts,
                            gameCompletesAmount: currentRaceGameCompletes,
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
                screensOrderDB = await Screen.create({ room: roomName, raceId, screens: screensOrder });
            }
            //console.log("Connect live game", roomName, userAddress, part);

            // Remove any existing connections for this user address
            // console.log({ lenNeforeDelete: await ConnectedUser.countDocuments() });
            //console.log("delete one", { userAddress, room: roomName })

            await ConnectedUser.deleteMany({ userAddress, room: roomName });

            // Add new connection with unique socket ID
            const newUser = {
                room: roomName,
                id: socket.id,
                userAddress,
            };
            // console.log("create one", newUser)
            await ConnectedUser.create(newUser);

            // console.log({ lenAfterCreate: await ConnectedUser.countDocuments() });

            // set latest screen
            if (screensOrderDB && (screensOrderDB.screens.indexOf(screensOrderDB.latestScreen) < screensOrderDB.screens.indexOf(part))) {
                console.log({part});
                screensOrderDB.latestScreen = part;
                await screensOrderDB.save();
            }
            io.to(roomName).emit('screen-changed', { screen: screensOrderDB.latestScreen });
            io.to(socket.id).emit('latest-screen', { raceId, screen: screensOrderDB.latestScreen });

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
            // console.log("rm on minimize")
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


            if (property === 'rabbithole-eliminate') {
                const racesProgresses = await RaceProgress.find({ room: roomName });
                const connectedUsers = await ConnectedUser.find({ room: roomName });

                // Set the fuel of all players who are not connected to 0
                racesProgresses.forEach(progress => {
                    // Check if the player is not the eliminating player and is not connected
                    if (progress.userAddress !== userAddress && !connectedUsers.some(user => user.userAddress === progress.userAddress)) {
                        progress.progress.rabbithole[version] = {
                            ...progress.progress.rabbithole[version],
                            game: {
                                ...progress.progress.rabbithole[version].game,
                                fuel: 0, // Set fuel to 0 for players who are not connected
                            }
                        };
                    }
                });

                // Set the fuel of the eliminating player to 0
                const eliminatingPlayerProgress = racesProgresses.find(progress => progress.userAddress === userAddress);
                if (eliminatingPlayerProgress) {
                    eliminatingPlayerProgress.progress.rabbithole[version] = {
                        ...eliminatingPlayerProgress.progress.rabbithole[version],
                        game: {
                            ...eliminatingPlayerProgress.progress.rabbithole[version].game,
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



        // get amount completed by raceId game gameId
        socket.on('get-progress', async ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            const progress = await RaceProgress.findOne({ room: roomName, userAddress });

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
                latestScreen: roomScreenData?.latestScreen,
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

    
        // get users amount connected to the game
        socket.on('get-connected', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const connectedInRoom = await ConnectedUser.find({ room: roomName });
            io.to(socket.id).emit('amount-of-connected', { 
                amount: connectedInRoom.length, 
                raceId 
            });
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