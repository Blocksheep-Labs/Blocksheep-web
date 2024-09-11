const app = require("express")();
const httpServer = require("http").createServer(app);
const initSocketIO = require("./socket/init");
require("dotenv").config();

initSocketIO(httpServer);

httpServer.listen(process.env.PORT, () => {
    console.log("[INFO] Server is running on port:", process.env.PORT)
});