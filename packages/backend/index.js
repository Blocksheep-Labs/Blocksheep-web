const app = require("express")();
const httpServer = require("http").createServer(app);
require("dotenv").config();

const options = {
    cors: {
        origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
    }
};
const io = require("socket.io")(httpServer, options);
// { room: string, id: string, userAddress: string, game: string, }
let rooms = [];
// { userAddress: string, gameId: string, raceId: string, game: string, }
let completedGames = [];


io.on("connection", socket => { 
    console.log("Connected:", socket.id)

    // when user disconnects
    socket.on('disconnect', () => {
        const roomsToEmitDisconnectEvent = rooms.filter(i => i.id === socket.id).map(i => i.room);
        // rm user
        rooms = rooms.filter(i => i.id === socket.id);

        // send the socket events
        roomsToEmitDisconnectEvent.forEach(roomName => {
            io.to(roomName).emit('leaved', {socketId: socket.id});
        });

        console.log("Disconnected:", socket.id);
    });

    // connect the live game
    socket.on('connect-live-game', ({ raceId, userAddress, game }) => {
        const roomName = `race-${raceId}`;
        // find user 
        const data = rooms.find(i => i.raceId === raceId && i.userAddress === userAddress);

        if (!data) {
            // add user
            rooms.push({ room: roomName, id: socket.id, userAddress, game });
        } else {
            rooms = rooms.map(i => {
                if (i => i.raceId === raceId && i.userAddress === userAddress) {
                    i.id = socket.id;
                    i.game = game;
                }
                return i;
            });
        }

        socket.join(roomName);
        // send the socket event
        io.to(roomName).emit('joined', {socketId: socket.id, userAddress, game});
    });

    // used to dispatch user game currently playing
    socket.on('change-game', ({ raceId, userAddress, game }) => {
        const roomName = `race-${raceId}`;

        // update user's current game
        let prevGame; 
        const roomsData = rooms.map(i => {
            if (i.name === roomName && i.userAddress === userAddress && i.socketId === socket.id) {
                // save prev game name
                prevGame = i.game;
                i.game = game;
                i.id = socket.id;
            }
            return i;
        });

        console.log("Chenged game:", socket.id, userAddress, `${prevGame} -> ${game}`);

        rooms = roomsData;
        // send the socket event
        io.to(roomName).emit('changed-game', {socketId: socket.id, userAddress, game, previousGame: prevGame});
    });

    // user completes the game
    socket.on('complete-game', ({ raceId, gameId, userAddress, game }) => {
        const roomName = `race-${raceId}`;
        const data = {raceId, gameId, userAddress, game};
        completedGames.push(data);
        io.to(roomName).emit('completed-game', data);
    });

    // get amount completed by raceId game gameId
    socket.on('get-completed', ({ raceId, gameId, game }) => {
        let amount = 0;
        completedGames.forEach(i => {
            if (i.raceId === raceId && i.game === game && i.gameId === gameId) {
                amount++;
            }
        });
        io.to(socket.id).emit('amount-of-completed', { amount });
    });
});

httpServer.listen(process.env.PORT);