import module from '../../models/games-socket/index';

const {
    ConnectedUser,
    RaceProgress,
    Screen,
    PlayerPoints,
} = module.default;

const {
    PlayersState,
    InGamePlayers,
    GamesRequired,
    MatchesPlayed,
    GameCounts,
    GameCompletes,
} = module.bullrun;


interface IConnectLiveGame {
    raceId: string,
    userAddress: string,
    part: string,
    screensOrder: string[],
}

interface IMinimizeGame {
    part: string,
    raceId: string,
}


export default (socket: any, io: any): void => {
    // when user disconnects
    socket.on('disconnect', async() => {
        // Find all rooms this socket was connected to before filtering
        console.log(`User ${socket.id} disconnecting...`);
        const userConnection = await ConnectedUser.findOne({ id: socket.id });
        console.log(`Connection instance id: ${userConnection?._id}, addr: ${userConnection?.userAddress}`);

        if (!userConnection) {
            console.log("No user active session, player-leave cleanup skipped.");
            return;
        }

        const connectedUsers = await ConnectedUser.find();

        // Remove user from connected users
        if (userConnection) {
            // console.log({ userConnection });
            const usersInRace = connectedUsers.filter(u => (u.id !== socket.id) && (u.room == userConnection.room));
            const roomScreenData = await Screen.findOne({ room: userConnection.room });

            if (usersInRace.length == 0) {
                //console.log("[alert] no users in game left!");
                //console.log(userConnection)


                if (roomScreenData && ["UNDERDOG", "BULLRUN", "RABBIT_HOLE"].includes(roomScreenData.latestScreen)) {
                    const screenPos = roomScreenData.screens.indexOf(roomScreenData.latestScreen);

                    if (roomScreenData.screens.length - 1 >= screenPos + 1) {
                        roomScreenData.latestScreen = roomScreenData.screens[screenPos + 1];
                    } else {
                        roomScreenData.latestScreen = roomScreenData.screens[roomScreenData.screens.length - 1];
                    }

                    await roomScreenData.save();
                }
            }

            // Leave rooms and emit events
            socket.leave(userConnection.room);
            /*
            console.log("Emitting leaved event: ", {
                socketId: socket.id,
                userAddress: userConnection.userAddress,
                raceId: userConnection.raceId,
                movedToNext: false,
                part: userConnection.part
            });
            */
            await ConnectedUser.deleteMany({ userAddress: userConnection.userAddress });

            io.to(userConnection.room).emit('leaved', {
                socketId: socket.id,
                userAddress: userConnection.userAddress,
                raceId: userConnection.raceId,
                movedToNext: false,
                part: userConnection.part,
                connectedCount: await ConnectedUser.countDocuments({ raceId: userConnection.raceId })
            });


            // handling bullrun
            if (userConnection.userAddress && userConnection.raceId && roomScreenData && roomScreenData.latestScreen == "BULLRUN") {
                // Remove the disconnected user
                await PlayersState.deleteMany({ raceId: userConnection.raceId, userAddress: userConnection.userAddress });

                // Get all remaining players
                const remainingPlayers = await PlayersState.find({ raceId: userConnection.raceId });

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
                    // If they haven't played against the leaving player, increment their game count
                    const matchesPlayedAgainstPlayer = await MatchesPlayed.find({
                        raceId: userConnection.raceId,
                        $or: [{ player1: player.userAddress }, { player2: player.userAddress }]
                    });

                    // if user was not playing against leaving player
                    if (!matchesPlayedAgainstPlayer.find(i => i.player1 == userConnection.userAddress || i.player2 == userConnection.userAddress)) {
                        //await GameCounts.findOneAndUpdate(
                        //    { raceId: userConnection.raceId, userAddress: player.userAddress },
                        //    { $inc: { count: 1 } },
                        //    { upsert: true }
                        //);

                        // Update required games to new value += -1
                        await GamesRequired.findOneAndUpdate(
                            { raceId: userConnection.raceId, userAddress: player.userAddress },
                            { $inc: { requiredGames: -1 } },
                            { upsert: true }
                        );
                    }

                    // Check if player has completed his games
                    const playerGameCounts = (await GameCounts.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress }))?.count || 0;

                    if (playerGameCounts >= newRequiredGames) {
                        const gameCompletesUser = await GameCompletes.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress });
                        if (!gameCompletesUser) {
                            await GameCompletes.create({ raceId: userConnection.raceId, userAddress: player.userAddress, completed: true });
                        }
                    }
                });

                // Notify remaining players about updates
                const roomName = `race-${userConnection.raceId}`;
                io.to(roomName).emit('bullrun-required-games-decreased', {
                    raceId: userConnection.raceId,
                });

                const currentGameAndUserCounts = (await GameCounts.findOne({ raceId: userConnection.raceId }))?.count || 0;
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
        }
    });

    // connect the live
    socket.on('connect-live-game', async ({ raceId, userAddress, part, screensOrder }: IConnectLiveGame) => {
        const roomName = `race-${raceId}`;
        let screensOrderDB = await Screen.findOne({ room: roomName });

        // console.log({screensOrderDB, screensOrder})
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
            part,
            raceId,
        };
        // console.log("create one", newUser)
        await ConnectedUser.create(newUser);

        // console.log({ lenAfterCreate: await ConnectedUser.countDocuments() });

        // set latest screen
        console.log({
            latestScreenIndex: screensOrderDB?.screens.indexOf(screensOrderDB.latestScreen),
            newIndex: screensOrderDB?.screens.indexOf(part),
            //screensOrderDB,
            //screensOrder,
            //part
        });

        if (screensOrderDB && (screensOrderDB.screens.indexOf(screensOrderDB.latestScreen) < screensOrderDB.screens.indexOf(part))) {
            console.log({part});
            screensOrderDB.latestScreen = part;
            await screensOrderDB.save();
        }

        io.to(roomName).emit('screen-changed', { screen: screensOrderDB?.latestScreen });
        io.to(socket.id).emit('latest-screen', { raceId, screen: screensOrderDB?.latestScreen });

        socket.join(roomName);
        io.to(roomName).emit("joined", {
            socketId: socket.id,
            userAddress,
            raceId,
            part,
        });
    });

    // minimize race (game)
    socket.on('minimize-live-game', async({ part, raceId }: IMinimizeGame) => {
        //console.log('mimized', { part, raceId })
        const connectedUsers = await ConnectedUser.find({ room: `race-${raceId}` })
        const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
        // rm user
        // console.log("rm on minimize")
        await ConnectedUser.deleteMany({ userAddress: socket.userAddress });

        // send the socket events
        roomsToEmitDisconnectEvent.forEach(roomName => {
            socket.leave(roomName);
            io.to(roomName).emit('leaved', {socketId: socket.id, part, raceId, movedToNext: true});
        });
    });
}