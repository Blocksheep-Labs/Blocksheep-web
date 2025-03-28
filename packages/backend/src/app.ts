import cors from 'cors';
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import usersRouter from "./routers/users.router";
import racesRouter from "./routers/races.router";

dotenv.config();

console.log('[APP] Launching...');

// ########################### BASE ###########################
// app config
const CLIENT_BASE: string = process.env.CLIENT_BASE || '';

// express app
const app = express();

// cors
const whitelist: string[] = CLIENT_BASE.split(',');
console.log(`[CORS] Origins in whitelist: `, whitelist)

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (whitelist.indexOf(origin || '') !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}));

// cookie 
app.use(cookieParser());

// enable json
app.use(express.json());

// USER ENRITY
app.use('/users', usersRouter);
// RACE ENTITY
app.use('/races', racesRouter);

export default app;