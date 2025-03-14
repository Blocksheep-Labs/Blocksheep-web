import cors from 'cors';
import express from "express";
import cookieParser from "cookie-parser";
import envCfg from "./config/env";

import usersRouter from "./routers/users.router";
import racesRouter from "./routers/races.router";


console.log('[APP] Launching...');

// ########################### BASE ###########################
// express app
const app = express();

// cors
const whitelist: string[] = envCfg.CLIENT_BASE.split(',');
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