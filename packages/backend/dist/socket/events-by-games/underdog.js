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
const { QuestionsState } = index_1.default.underdog;
const questionsGameStates = [["answering", "submitting"], ["distributing", "distributed"]];
exports.default = (socket, io) => {
    socket.on('underdog-set-questions-state', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId, newIndex, secondsLeft, state }) {
        const roomName = `race-${raceId}`;
        let currData = yield QuestionsState.findOne({ room: roomName });
        if (!currData) {
            const newState = new QuestionsState({
                room: roomName,
                index: newIndex,
                secondsLeft,
                state: 'answering',
            });
            yield newState.save();
            io.to(roomName).emit('underdog-questions-state', { raceId, data: newState });
            return;
        }
        if (currData.index < newIndex) {
            currData.index = newIndex;
        }
        currData.secondsLeft = secondsLeft;
        const newStateLevel = questionsGameStates.findIndex(i => i.includes(state));
        const currStateLevel = questionsGameStates.findIndex(i => i.includes(currData.state));
        if (newStateLevel >= currStateLevel) {
            currData.state = state;
        }
        // Update the state in MongoDB
        yield QuestionsState.updateOne({ room: roomName }, { $set: { index: currData.index, secondsLeft: currData.secondsLeft, state } });
        io.to(roomName).emit('underdog-questions-state', { raceId, data: currData });
    }));
    socket.on('underdog-get-questions-state', (_a) => __awaiter(void 0, [_a], void 0, function* ({ raceId }) {
        const roomName = `race-${raceId}`;
        const currData = yield QuestionsState.findOne({ room: roomName });
        if (!currData) {
            const newState = {
                room: roomName,
                index: 0,
                secondsLeft: 10,
                state: 'answering',
            };
            yield QuestionsState.create(newState);
            io.to(socket.id).emit('underdog-questions-state', { raceId, data: newState });
            return;
        }
        io.to(socket.id).emit('underdog-questions-state', { raceId, data: currData });
    }));
    socket.on('underdog-underdog-results-shown', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('underdog-results-shown-on-client', { socketId: socket.id, raceId });
    });
};
