const express = require("express");
const racesController = require("../controllers/races.controller");

const racesRouter = express.Router();

racesRouter.get('/id', racesController.getRaceDataById);

racesRouter.post('/insert-user', racesController.insertUser);

racesRouter.post('/create', racesController.createRace);

module.exports = racesRouter;