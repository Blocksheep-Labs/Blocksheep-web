import * as dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { applySocketEvents } from "./events";


// Load environment variables from .env file
dotenv.config();

// Define the type for the httpServer parameter
type HttpServer = import("http").Server;

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
    const options = {
        cors: {
            origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
        },
    } as any;
    
    const io = new SocketIOServer(httpServer, options);
    applySocketEvents(io);
    console.log("[SOCKET] Initialized.");
    return io;
};
