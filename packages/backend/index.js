const app = require("express")();
const httpServer = require("http").createServer(app);
const options = {
    cors: {
        origin: "http://localhost:5173"
    }
};
const io = require("socket.io")(httpServer, options);

// { room: string, id: string }
const rooms = [];


io.on("connection", socket => { 
    socket.on('disconnect', () => {
        const roomsToEmitDisconnectEvent = rooms.filter(i => i.id === socket.id).map(i => i.room);
        rooms = rooms.filter(i => i.id === socket.id);

        roomsToEmitDisconnectEvent.forEach(roomName => {
            io.to(roomName).emit('leaved', socket.id);
        });
    });

    socket.on('connect-live-game', (raceId, gameId) => {
        const roomName = `race-${raceId} game-${gameId}`;
        rooms.push({ room: roomName, id: socket.id });

        socket.join(roomName);
        io.to(roomName).emit('joined', socket.id);
    });
});

httpServer.listen(8000);