"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySocketEvents = void 0;
const update_progress_1 = require("./update-progress");
const underdog_1 = __importDefault(require("./default-states-by-games/underdog"));
const rabbithole_1 = __importDefault(require("./default-states-by-games/rabbithole"));
const bullrun_1 = __importDefault(require("./default-states-by-games/bullrun"));
const users_model_1 = require("../models/users/users.model");
// games events
const underdog_2 = __importDefault(require("./events-by-games/underdog"));
const rabbithole_2 = __importDefault(require("./events-by-games/rabbithole"));
const bullrun_2 = __importDefault(require("./events-by-games/bullrun"));
const index_1 = __importDefault(require("../models/games-socket/index"));
const { ConnectedUser, RaceProgress, Screen, PlayerPoints, } = index_1.default.default;
const { QuestionsState } = index_1.default.underdog;
const { TunnelState } = index_1.default.rabbithole;
const { PlayersState, InGamePlayers, GamesRequired, MatchesPlayed, GameCounts, GameCompletes, } = index_1.default.bullrun;
const applySocketEvents = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req); // the request object
        console.log(err.code); // the error code, for example 1
        console.log(err.message); // the error message, for example "Session ID unknown"
        console.log(err.context); // some additional error context
    });
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        // init games 
        (0, underdog_2.default)(socket, io);
        (0, rabbithole_2.default)(socket, io);
        (0, bullrun_2.default)(socket, io);
        // when user disconnects
        socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
            // Find all rooms this socket was connected to before filtering
            const userConnection = yield ConnectedUser.findOne({ id: socket.id });
            if (!userConnection) {
                //console.log("No user active session, skip leave event");
                return;
            }
            const connectedUsers = yield ConnectedUser.find();
            // Remove user from connected users
            if (userConnection) {
                const usersInRace = connectedUsers.filter(u => (u.id !== socket.id) && (u.room == userConnection.room));
                if (usersInRace.length == 0) {
                    //console.log("[alert] no users in game left!");
                    //console.log(userConnection)
                    const roomScreenData = yield Screen.findOne({ room: userConnection.room });
                    if (roomScreenData && ["UNDERDOG", "BULLRUN", "RABBIT_HOLE"].includes(roomScreenData.latestScreen)) {
                        const screenNamesPerUserConnection = yield Screen.find({ room: userConnection.room });
                        const screenPos = screenNamesPerUserConnection.indexOf(roomScreenData.latestScreen);
                        if (screenNamesPerUserConnection.length - 1 >= screenPos + 1) {
                            roomScreenData.latestScreen = screenNamesPerUserConnection[screenPos + 1];
                        }
                        else {
                            roomScreenData.latestScreen = screenNamesPerUserConnection[screenNamesPerUserConnection.length - 1];
                        }
                        yield roomScreenData.save();
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
                    yield PlayersState.deleteMany({ raceId: userConnection.raceId, userAddress: userConnection.userAddress });
                    // Get all remaining players
                    const waitingAndActivePlayers = yield PlayersState.find({ raceId: userConnection.raceId });
                    const inGamePlayers = yield InGamePlayers.find({ raceId: userConnection.raceId });
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
                    remainingPlayers.forEach((player) => __awaiter(void 0, void 0, void 0, function* () {
                        // Update required games to new value
                        yield GamesRequired.findOneAndUpdate({ raceId: userConnection.raceId, userAddress: player.userAddress }, { requiredGames: newRequiredGames }, { upsert: true });
                        // If they haven't played against the leaving player, increment their game count
                        const matchesPlayedAgainstPlayer = yield MatchesPlayed.find({
                            raceId: userConnection.raceId,
                            $or: [{ player1: player.userAddress }, { player2: player.userAddress }]
                        });
                        // if user was not playing against leaving player
                        if (!matchesPlayedAgainstPlayer.find(i => i.player1 == userConnection.userAddress || i.player2 == userConnection.userAddress)) {
                            yield GameCounts.findOneAndUpdate({ raceId: userConnection.raceId, userAddress: player.userAddress }, { $inc: { count: 1 } }, { upsert: true });
                        }
                        // Check if player has completed his games
                        const playerGameCounts = yield GameCounts.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress });
                        if (playerGameCounts.count >= newRequiredGames) {
                            const gameCompletesUser = yield GameCompletes.findOne({ raceId: userConnection.raceId, userAddress: player.userAddress });
                            if (!gameCompletesUser) {
                                yield GameCompletes.create({ raceId: userConnection.raceId, userAddress: player.userAddress, completed: true });
                            }
                        }
                    }));
                    // Notify remaining players about updates
                    const roomName = `race-${userConnection.raceId}`;
                    io.to(roomName).emit('bullrun-required-games-descreased', {
                        raceId: userConnection.raceId,
                    });
                    const currentGameAndUserCounts = (yield GameCounts.findOne({ raceId: userConnection.raceId })).count;
                    const currentRaceGameCompletes = yield GameCompletes.countDocuments({ raceId: userConnection.raceId });
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
        }));
        // connect the live
        socket.on('connect-live-game', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress, part, screensOrder }) {
            const roomName = `race-${raceId}`;
            let screensOrderDB = yield Screen.findOne({ room: roomName });
            if (!screensOrderDB && screensOrder) {
                screensOrderDB = yield Screen.create({ room: roomName, raceId, screens: screensOrder });
            }
            //console.log("Connect live game", roomName, userAddress, part);
            // Remove any existing connections for this user address
            yield ConnectedUser.deleteMany({ userAddress, room: roomName });
            // Add new connection with unique socket ID
            const newUser = new ConnectedUser({
                room: roomName,
                id: socket.id,
                userAddress,
            });
            yield newUser.save();
            // set latest screen
            if (screensOrderDB && (screensOrderDB.indexOf(screensOrderDB.latestScreen) < screensOrderDB.indexOf(part))) {
                console.log({ part });
                screensOrderDB.latestScreen = part;
                yield screensOrderDB.save();
            }
            io.to(roomName).emit('screen-changed', { screen: part });
            socket.join(roomName);
            io.to(roomName).emit('joined', {
                socketId: socket.id,
                userAddress,
                raceId,
                part
            });
        }));
        socket.on('get-latest-screen', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
            const roomName = `race-${raceId}`;
            const roomScreenData = yield Screen.findOne({ raceId: raceId, room: roomName });
            let latestScreen = undefined;
            if (roomScreenData === null || roomScreenData === void 0 ? void 0 : roomScreenData.latestScreen) {
                latestScreen = roomScreenData.latestScreen;
            }
            if (!latestScreen) {
                latestScreen = "UNKNOWN";
                roomScreenData.latestScreen = latestScreen;
                yield roomScreenData.save();
            }
            io.to(socket.id).emit('latest-screen', { raceId, screen: latestScreen });
        }));
        // minimize race (game)
        socket.on('minimize-live-game', (_a) => __awaiter(void 0, [_a], void 0, function* ({ part, raceId }) {
            //console.log('mimized', { part, raceId })
            const connectedUsers = yield ConnectedUser.find({ room: `race-${raceId}` });
            const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
            // rm user
            yield ConnectedUser.deleteOne({ id: socket.id });
            // send the socket events
            roomsToEmitDisconnectEvent.forEach(roomName => {
                socket.leave(roomName);
                io.to(roomName).emit('leaved', { socketId: socket.id, part, raceId, movedToNext: true });
            });
        }));
        // Listen for 'update-progress' events
        socket.on('update-progress', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress, property, value, version }) {
            // console.log({ raceId, userAddress, property, value, version })
            const roomName = `race-${raceId}`;
            let rProgress = yield RaceProgress.findOne({ room: roomName, userAddress });
            if (!rProgress) {
                rProgress = new RaceProgress({
                    room: roomName,
                    userAddress,
                    progress: Object.assign(Object.assign(Object.assign({ countdown: false, board1: false, board2: false, board3: false, board4: false, nicknameSet: false, story: {
                            intro: false,
                            part1: false,
                            part2: false,
                            part3: false,
                            part4: false,
                            conclusion: false,
                        } }, underdog_1.default), rabbithole_1.default), bullrun_1.default)
                });
                yield rProgress.save();
            }
            // clone to avoid issues
            const updatedRProgress = JSON.parse(JSON.stringify(rProgress));
            if (property === 'rabbithole-eliminate') {
                const racesProgresses = yield RaceProgress.find({ room: roomName });
                const connectedUsers = yield ConnectedUser.find({ room: roomName });
                // Set the fuel of all players who are not connected to 0
                racesProgresses.forEach(progress => {
                    // Check if the player is not the eliminating player and is not connected
                    if (progress.userAddress !== userAddress && !connectedUsers.some(user => user.userAddress === progress.userAddress)) {
                        progress.progress.rabbithole[version] = Object.assign(Object.assign({}, progress.progress.rabbithole[version]), { game: Object.assign(Object.assign({}, progress.progress.rabbithole[version].game), { fuel: 0 }) });
                    }
                });
                // Set the fuel of the eliminating player to 0
                const eliminatingPlayerProgress = racesProgresses.find(progress => progress.userAddress === userAddress);
                if (eliminatingPlayerProgress) {
                    eliminatingPlayerProgress.progress.rabbithole[version] = Object.assign(Object.assign({}, eliminatingPlayerProgress.progress.rabbithole[version]), { game: Object.assign(Object.assign({}, eliminatingPlayerProgress.progress.rabbithole[version].game), { fuel: 0 }) });
                }
            }
            const updatedProgress = (0, update_progress_1.updateProgress)(property, value, updatedRProgress, version);
            // Update the progress in MongoDB
            yield RaceProgress.updateOne({ room: roomName, userAddress }, { $set: updatedProgress });
            io.to(roomName).emit('progress-updated', { raceId, property, value, userAddress, rProgress: updatedProgress });
        }));
        // get amount completed by raceId game gameId
        socket.on('get-progress', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress }) {
            const roomName = `race-${raceId}`;
            const racesProgresses = yield RaceProgress.findOne({ room: roomName });
            const progress = racesProgresses.find(i => (i === null || i === void 0 ? void 0 : i.room) === roomName && (i === null || i === void 0 ? void 0 : i.userAddress) === userAddress);
            let questionsStateValue = yield QuestionsState.findOne({ room: roomName });
            let tunnelStateValue = yield TunnelState.findOne({ room: roomName });
            if (!questionsStateValue) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                questionsStateValue = yield QuestionsState.create(newState);
            }
            if (!tunnelStateValue) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                tunnelStateValue = yield TunnelState.create(newState);
            }
            const roomScreenData = yield Screen.findOne({ raceId, room: roomName });
            io.to(socket.id).emit('race-progress', {
                progress,
                latestScreen: roomScreenData.latestScreen,
                questionsState: questionsStateValue,
                tunnelState: tunnelStateValue
            });
        }));
        // get amount completed by raceId game gameId
        socket.on('get-progress-all', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
            const roomName = `race-${raceId}`;
            const progress = yield RaceProgress.find({ room: roomName });
            io.to(socket.id).emit('race-progress-all', { progress });
        }));
        // get users amount connected to the game
        socket.on('get-connected', ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const connectedInRoom = ConnectedUser.find({ room: roomName });
            io.to(socket.id).emit('amount-of-connected', {
                amount: connectedInRoom.length,
                raceId
            });
        });
        socket.on('player-add-points', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, points, userAddress }) {
            const roomName = `room-${raceId}`;
            let playerPoints = yield PlayerPoints.findOne({ userAddress, room: roomName });
            if (!playerPoints) {
                playerPoints = yield PlayerPoints.create({
                    userAddress, room: roomName,
                    points,
                    finished: false
                });
            }
            else {
                playerPoints.points += points;
                yield playerPoints.save();
            }
            console.log({ raceId, points, userAddress });
        }));
        socket.on('race-finish', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress }) {
            const roomName = `room-${raceId}`;
            const playersPointsData = yield PlayerPoints.find({ room: roomName });
            if (!playersPointsData || playersPointsData.length === 0) {
                return;
            }
            // Sort players by points in descending order
            playersPointsData.sort((a, b) => b.points - a.points);
            const centralIndex = Math.floor(playersPointsData.length / 2);
            // const centralScore = playersPointsData[centralIndex]?.points || 0;
            // Use Promise.all to handle multiple async operations
            yield Promise.all(playersPointsData.map((player, index) => __awaiter(void 0, void 0, void 0, function* () {
                player.finished = true;
                yield player.save();
                let property = "decrement";
                if (index < centralIndex) {
                    property = "increment";
                }
                console.log(player.userAddress, property, raceId);
                yield (0, users_model_1.finishRace)(player.userAddress, property, raceId);
            })));
        }));
    }));
    console.log("[SOCKET] Events applied.");
};
exports.applySocketEvents = applySocketEvents;
