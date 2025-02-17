"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserParticipatesIn = exports.createRace = exports.getRaceDataById = exports.insertUser = void 0;
const racesModel = __importStar(require("../models/races/races.model"));
const insertUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { raceId, userId } = req.body;
    try {
        const race = yield racesModel.insertUser(raceId, userId);
        return res.status(201).json({
            ok: true,
            race,
        });
    }
    catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
});
exports.insertUser = insertUser;
const getRaceDataById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { raceId } = req.query;
    try {
        const race = yield racesModel.getRaceDataById(raceId);
        return res.status(200).json({
            ok: true,
            race,
        });
    }
    catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
});
exports.getRaceDataById = getRaceDataById;
const createRace = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { raceId } = req.body;
    try {
        const race = yield racesModel.createRace(raceId);
        return res.status(200).json({
            ok: true,
            race,
        });
    }
    catch (error) {
        return res.status(400).json({
            ok: false,
            error,
        });
    }
});
exports.createRace = createRace;
const getUserParticipatesIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.query;
    try {
        const races = yield racesModel.getUserParticipatesIn(address);
        return res.status(200).json({
            ok: true,
            races,
        });
    }
    catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
});
exports.getUserParticipatesIn = getUserParticipatesIn;
