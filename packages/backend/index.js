const app = require("express")();
const httpServer = require("http").createServer(app);
require("dotenv").config();

const options = {
    cors: {
        origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
    }
};
const io = require("socket.io")(httpServer, options);
// { room: string, id: string }
let rooms = [];


io.on("connection", socket => { 
    console.log("Connected:", socket.id)
    socket.on('disconnect', () => {
        const roomsToEmitDisconnectEvent = rooms.filter(i => i.id === socket.id).map(i => i.room);
        rooms = rooms.filter(i => i.id === socket.id);

        roomsToEmitDisconnectEvent.forEach(roomName => {
            io.to(roomName).emit('leaved', {socketId: socket.id});
        });
    });

    socket.on('connect-live-game', ({ raceId, userAddress }) => {
        const roomName = `race-${raceId}`;
        rooms.push({ room: roomName, id: socket.id, userAddress });

        socket.join(roomName);
        io.to(roomName).emit('joined', {socketId: socket.id, userAddress});
    });
});

httpServer.listen(process.env.PORT);