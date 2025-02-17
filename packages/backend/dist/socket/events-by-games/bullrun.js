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
const index_1 = __importDefault(require("../../models/games-socket/index"));
const { GameCounts, GameCompletes, GamesRequired, InGamePlayers, MatchesPlayed, PlayersState } = index_1.default.bullrun;
exports.default = (socket, io) => {
    socket.on('bullrun-set-pending', ({ id, opponentId, userAddress, isPending, raceId }) => {
        // Emit event to opponent and the socket
        io.to(opponentId).emit('bullrun-pending', { id, userAddress, isPending, raceId });
        io.to(socket.id).emit('bullrun-pending', { id, userAddress, isPending, raceId });
    });
    socket.on('bullrun-win-modal-opened', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('bullrun-win-modal-opened-on-client', { raceId, socketId: socket.id });
    }));
    socket.on('bullrun-join-game', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress, amountOfGamesRequired }) {
        const roomName = `race-${raceId}`;
        socket.join(roomName);
        const gamesRequired = yield GamesRequired.findOne({ raceId, userAddress });
        const inGamePlayers = yield InGamePlayers.find({ raceId });
        function initializePlayer(playerAddress, socket) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!gamesRequired) {
                    yield GamesRequired.create({ raceId, userAddress, requiredGames: amountOfGamesRequired });
                }
                if (!inGamePlayers.map(i => i.userAddress.toString()).includes(playerAddress)) {
                    yield InGamePlayers.create({ raceId, userAddress: playerAddress });
                }
            });
        }
        socket.userAddress = userAddress;
        yield initializePlayer(userAddress, socket);
        const existingPlayerState = yield PlayersState.findOne({ raceId, userAddress });
        if (!existingPlayerState) {
            yield PlayersState.create({ raceId, userAddress, status: 'waiting' });
        }
        const waitingPlayers = yield PlayersState.find({ raceId, status: 'waiting' });
        if (waitingPlayers.length >= 2) {
            yield PlayersState.updateMany({ raceId, status: 'waiting' }, { status: 'active' });
        }
        const activePlayers = yield PlayersState.find({ raceId, status: 'active' });
        if (!activePlayers.some(p => p.userAddress === userAddress)) {
            yield PlayersState.updateOne({ raceId, userAddress: userAddress }, { status: 'active' });
        }
        function pairPlayers() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                const activePlayers = yield PlayersState.find({ raceId, status: 'active' });
                let maxRetries = activePlayers.length * 2;
                let retries = 0;
                while (activePlayers.length >= 2 && retries < maxRetries) {
                    let player1 = activePlayers.shift();
                    let player2 = activePlayers.shift();
                    const connectedUsers = Array.from(io.sockets.sockets.values());
                    player1 = connectedUsers.find((i) => i.userAddress == player1.userAddress);
                    player2 = connectedUsers.find((i) => i.userAddress == player2.userAddress);
                    if (player1.userAddress === player2.userAddress) {
                        yield PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                        yield PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'waiting' });
                        retries++;
                        continue;
                    }
                    const gameCount1 = ((_a = (yield GameCounts.findOne({ raceId, userAddress: player1.userAddress }))) === null || _a === void 0 ? void 0 : _a.count) || 0;
                    const gameCount2 = ((_b = (yield GameCounts.findOne({ raceId, userAddress: player2.userAddress }))) === null || _b === void 0 ? void 0 : _b.count) || 0;
                    const matchesPlayed1 = yield MatchesPlayed.find({ raceId, $or: [{ player1: player1.userAddress }, { player2: player1.userAddress }] });
                    const matchesPlayed2 = yield MatchesPlayed.find({ raceId, $or: [{ player1: player2.userAddress }, { player2: player2.userAddress }] });
                    const requiredGamesPlayer1 = ((_c = (yield GamesRequired.findOne({ raceId, userAddress: player1.userAddress }))) === null || _c === void 0 ? void 0 : _c.requiredGames) || Infinity;
                    const requiredGamesPlayer2 = ((_d = (yield GamesRequired.findOne({ raceId, userAddress: player2.userAddress }))) === null || _d === void 0 ? void 0 : _d.requiredGames) || Infinity;
                    if (gameCount1 < requiredGamesPlayer1 &&
                        gameCount2 < requiredGamesPlayer2 &&
                        !matchesPlayed1.some(match => match.player1 === player2.userAddress || match.player2 === player2.userAddress) &&
                        !matchesPlayed2.some(match => match.player1 === player1.userAddress || match.player2 === player1.userAddress)) {
                        const roomName = `1v1-${player1.id}-${player2.id}`;
                        player1.join(roomName);
                        player2.join(roomName);
                        io.to(player1.id).emit('bullrun-game-start', { players: [player1.id, player2.id], opponent: { id: player2.id, userAddress: player2.userAddress } });
                        io.to(player2.id).emit('bullrun-game-start', { players: [player2.id, player1.id], opponent: { id: player1.id, userAddress: player1.userAddress } });
                        yield MatchesPlayed.updateOne({ raceId, userAddress: player1.userAddress }, { $push: { matches: player2.userAddress } });
                        yield MatchesPlayed.updateOne({ raceId, userAddress: player2.userAddress }, { $push: { matches: player1.userAddress } });
                        yield incrementGameCount(player1, player2);
                        yield PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'active' });
                        yield PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                    }
                    else {
                        yield PlayersState.updateOne({ raceId, userAddress: player1.userAddress }, { status: 'waiting' });
                        yield PlayersState.updateOne({ raceId, userAddress: player2.userAddress }, { status: 'active' });
                        retries++;
                        continue;
                    }
                }
                if (activePlayers.length === 1) {
                    const remainingPlayer = activePlayers.shift();
                    const remainingGameCount = yield GameCounts.findOne({ raceId, userAddress: remainingPlayer.userAddress });
                    const requiredGames = ((_e = (yield GamesRequired.findOne({ raceId, userAddress: remainingPlayer.userAddress }))) === null || _e === void 0 ? void 0 : _e.requiredGames) || Infinity;
                    if (remainingGameCount.count >= requiredGames) {
                        io.to(remainingPlayer.id).emit('bullrun-game-complete', {
                            message: 'You have completed all your games',
                            raceId
                        });
                        return;
                    }
                    yield PlayersState.updateOne({ raceId, userAddress: remainingPlayer.userAddress }, { status: 'waiting' });
                    const gamesPlayed = remainingGameCount.count;
                    io.to(remainingPlayer.id).emit('bullrun-waiting', { message: `Waiting for an opponent, games played: ${gamesPlayed}`, raceId });
                }
            });
        }
        function incrementGameCount(player1, player2) {
            return __awaiter(this, void 0, void 0, function* () {
                yield GameCounts.updateOne({ raceId, userAddress: player1.userAddress }, { $inc: { count: 1 } });
                yield GameCounts.updateOne({ raceId, userAddress: player2.userAddress }, { $inc: { count: 1 } });
            });
        }
        pairPlayers();
    }));
    socket.on('bullrun-curtains-closing', (data) => {
        io.to(data.toId).emit('bullrun-curtains-closing', data);
        io.to(socket.id).emit('bullrun-curtains-closing', data);
    });
    socket.on('bullrun-get-game-counts', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, userAddress }) {
        const gameCounts = yield GameCounts.findOne({ raceId, userAddress });
        const gameCompletesAmount = (yield GameCompletes.find({ raceId, completed: true })).length;
        io.to(socket.id).emit('bullrun-game-counts', {
            raceId,
            userAddress,
            gameCounts,
            gameCompletesAmount,
        });
    }));
    socket.on('bullrun-game-end', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
        const gameCount = yield GameCounts.findOne({ raceId, userAddress: socket.userAddress });
        const requiredGames = yield GamesRequired.findOne({ raceId, userAddress: socket.userAddress });
        if (gameCount.count >= requiredGames.requiredGames) {
            yield GameCompletes.updateOne({ raceId, userAddress: socket.userAddress }, { $set: { completed: true } });
            io.to(socket.id).emit('bullrun-game-complete', {
                message: 'You have completed all your games',
                raceId
            });
        }
        else {
            io.to(socket.id).emit('bullrun-game-continue', {
                message: `You can continue playing ${gameCount.count}/${requiredGames.requiredGames}`,
                raceId
            });
        }
        const completedGamesAmount = (yield GameCompletes.find({ raceId, completed: true })).length;
        io.to(`race-${raceId}`).emit('bullrun-amount-of-completed-games', { gameCompletesAmount: completedGamesAmount });
    }));
};
