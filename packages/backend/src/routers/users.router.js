const express = require("express");
const usersController = require("../controllers/users.controller");

const usersRouter = express.Router();

usersRouter.get('/by-address', usersController.getUserDataByAddress);

usersRouter.post('/set-name', usersController.setNameByAddress);


module.exports = usersRouter;

