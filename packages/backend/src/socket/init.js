require("dotenv").config();
const applySocketEvents = require("./events");

module.exports = (httpServer) => {
    const options = {
        cors: {
            origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
        },
    };
    
    const io = require("socket.io")(httpServer, options);
    applySocketEvents(io);
    console.log("[SOCKET] Initialized.");
    return io;
}
