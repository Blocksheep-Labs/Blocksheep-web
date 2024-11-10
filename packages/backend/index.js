const app = require("./src/app");
//const httpServer = require("http").createServer(app);
const initSocketIO = require("./src/socket/init");
const connectMongo = require("./src/utils/connectMongo");
require("dotenv").config();


const httpServer = require("http2").createSecureServer({
    allowHTTP1: true,
    //key: fs.readFileSync("/tmp/key.pem"),
    //cert: fs.readFileSync("/tmp/cert.pem")
});


const launchServer = async() => {
    initSocketIO(httpServer);
    await connectMongo();

    httpServer.listen(process.env.PORT, () => {
        console.log("[INFO] Server is running on port:", process.env.PORT)
    });
}

launchServer();