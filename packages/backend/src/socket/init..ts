import * as dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { applySocketEvents } from "./events";

// Load environment variables from .env file
dotenv.config();

// Define the type for the httpServer parameter
type HttpServer = import("http").Server;

const options = {
    cors: {
        origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
    },
} as any;

let io: SocketIOServer | null = null; // Declare io instance

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
    if (!io) {
        io = new SocketIOServer(httpServer, options);
        applySocketEvents(io);
        console.log("[SOCKET] Initialized.");
    }
    return io;
};

// Export function to get io instance
export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized!");
    }
    return io;
};
