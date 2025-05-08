
import express, { Router } from "express";
import * as usersController from "../controllers/users.controller";

// @ts-ignore
const usersRouter = new express.Router();

usersRouter.get('/by-address', usersController.getUserDataByAddress);

usersRouter.post('/set-name', usersController.setNameByAddress);

export default usersRouter;
