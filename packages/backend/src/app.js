const cors = require('cors');
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

console.log('[APP] Launching...');

// ########################### BASE ###########################
  // app config
  const CLIENT_BASE       = process.env.CLIENT_BASE;

  // express app
  const app = express();

  // cors
  const whitelist = [CLIENT_BASE];
  console.log(`[CORS] Origins in whitelist: `, whitelist)
  
  app.use(cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
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
  app.use('/users', require("./routers/users.router"));
  // RACE ENTITY
  app.use('/races', require("./routers/races.router"));

  


module.exports = app;