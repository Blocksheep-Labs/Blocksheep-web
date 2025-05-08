import app from "./app";
import { createServer } from "http";
import { initializeSocket } from "./socket/init.";
import connectMongo from "./utils/connectMongo";
import dotenv from "dotenv";
import initBotsInDatabase from "./utils/initBotsInDatabase";

dotenv.config();

const httpServer = createServer(app);

const launchServer = async (): Promise<void> => {
    initializeSocket(httpServer);
    await connectMongo();
    await initBotsInDatabase();

    httpServer.listen(process.env.PORT, () => {
        console.log("[INFO] Server is running on port:", process.env.PORT);
    });
}

launchServer();