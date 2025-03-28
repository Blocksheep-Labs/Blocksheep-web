import express from "express";
import * as racesController from "../controllers/races.controller";


// @ts-ignore
const racesRouter = new express.Router();

racesRouter.get('/id', racesController.getRaceDataById);

racesRouter.get('/participates', racesController.getUserParticipatesIn);

racesRouter.post('/insert-user', racesController.insertUser);

racesRouter.post('/create', racesController.createRace);

export default racesRouter;
