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
exports.getUserParticipatesIn = exports.createRace = exports.getRaceDataById = exports.insertUser = void 0;
const races_mongo_1 = __importDefault(require("./races.mongo"));
const insertUser = (raceId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield races_mongo_1.default.findOneAndUpdate({
        raceId,
    }, {
        $addToSet: {
            users: userId
        }
    }, {
        new: true,
        upsert: true
    });
});
exports.insertUser = insertUser;
const getRaceDataById = (raceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield races_mongo_1.default.findOne({ raceId });
});
exports.getRaceDataById = getRaceDataById;
const createRace = (raceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield races_mongo_1.default.insertMany([{ raceId }]);
});
exports.createRace = createRace;
const getUserParticipatesIn = (userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield races_mongo_1.default.find({ users: userAddress });
});
exports.getUserParticipatesIn = getUserParticipatesIn;
