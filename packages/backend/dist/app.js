"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('[APP] Launching...');
// ########################### BASE ###########################
// app config
const CLIENT_BASE = process.env.CLIENT_BASE || '';
// express app
const app = (0, express_1.default)();
// cors
const whitelist = CLIENT_BASE.split(',');
console.log(`[CORS] Origins in whitelist: `, whitelist);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin || '') !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// cookie 
app.use((0, cookie_parser_1.default)());
// enable json
app.use(express_1.default.json());
// USER ENRITY
app.use('/users', require("./routers/users.router"));
// RACE ENTITY
app.use('/races', require("./routers/races.router"));
exports.default = app;
