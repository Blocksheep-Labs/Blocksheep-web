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
const { RaceProgress } = index_1.default.default;
const { TunnelState } = index_1.default.rabbithole;
const tunnelGameStates = ["reset", "default", "close", "open"];
exports.default = (socket, io) => {
    socket.on('rabbithole-set-tunnel-state', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished }) {
        const roomName = `race-${raceId}`;
        let currData = yield TunnelState.findOne({ room: roomName });
        if (!currData) {
            const newState = new TunnelState({
                room: roomName,
                secondsLeft: 10,
                roundsPlayed: addRoundsPlayed,
                gameState,
                isFinished: false,
            });
            yield newState.save();
            io.to(roomName).emit('rabbithole-tunnel-state', { raceId, data: newState });
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
        yield TunnelState.updateOne({ room: roomName }, { $set: currData });
        io.to(roomName).emit('rabbithole-tunnel-state', { raceId, data: currData });
    }));
    socket.on('rabbithole-get-tunnel-state', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
        const roomName = `race-${raceId}`;
        const currData = yield TunnelState.findOne({ room: roomName });
        if (!currData) {
            const newState = {
                room: roomName,
                secondsLeft: 10,
                roundsPlayed: 0,
                gameState: "default",
                isFinished: false,
            };
            yield TunnelState.create(newState);
            io.to(socket.id).emit('rabbithole-tunnel-state', { raceId, data: newState });
            return;
        }
        io.to(socket.id).emit('rabbithole-tunnel-state', { raceId, data: currData });
    }));
    socket.on('rabbithole-get-all-fuel-tunnel', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
        const roomName = `race-${raceId}`;
        const progresses = yield RaceProgress.find({ room: roomName });
        io.to(socket.id).emit('rabbithole-race-fuel-all-tunnel', {
            progresses: progresses.map(i => (Object.assign({ userAddress: i.userAddress }, i.progress.game2))),
        });
    }));
    socket.on('rabbithole-tunnel-started', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-tunnel-started-on-client', { socketId: socket.id, raceId });
    });
    socket.on('rabbithole-results-shown', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-results-shown-on-client', { socketId: socket.id, raceId });
    });
};
