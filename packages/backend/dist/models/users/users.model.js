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
exports.finishRace = exports.getUserDataByAddress = exports.setNameByAddress = void 0;
const users_mongo_1 = __importDefault(require("./users.mongo"));
const setNameByAddress = (name, address) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_mongo_1.default.findOneAndUpdate({
        address
    }, {
        name
    }, {
        new: true,
        upsert: true
    });
});
exports.setNameByAddress = setNameByAddress;
const getUserDataByAddress = (address) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_mongo_1.default.findOne({ address });
});
exports.getUserDataByAddress = getUserDataByAddress;
const finishRace = (address, type, raceId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_mongo_1.default.findOne({ address });
    if (!user) {
        throw new Error("User was not found");
    }
    // ensure that the user has been modified since the points distribution of the race
    if (user.finishedRaces.map(i => Number(i.raceId)).includes(Number(raceId))) {
        return;
    }
    const stat = {
        raceId,
        previousGamesAboveAverage: user.gamesAboveAverage,
        newGamesAboveAverage: 0,
    };
    // to track state on the frontend
    user.previousGamesAboveAverage = user.gamesAboveAverage;
    if (type === "increment") {
        stat.newGamesAboveAverage = stat.previousGamesAboveAverage + 1;
        user.gamesAboveAverage++;
    }
    if (type === "decrement") {
        if (user.gamesAboveAverage - 1 >= 0) {
            stat.newGamesAboveAverage = stat.previousGamesAboveAverage - 1;
            user.gamesAboveAverage--;
        }
    }
    user.finishedRaces.push(stat);
    return yield user.save();
});
exports.finishRace = finishRace;
