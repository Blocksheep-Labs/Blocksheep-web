const app = require("express")();
const httpServer = require("http").createServer(app);
require("dotenv").config();

const options = {
    cors: {
        origin: [process.env.CLIENT_BASE, process.env.CLIENT_BASE_HTTP],
    }
};
const io = require("socket.io")(httpServer, options);
// { room: string, id: string, userAddress: string }
let connectedUsers = [];
// { room: string, userAddress: string, progress: ("countdown": number, "game-1": number, "board-1": number, "game-2": number) }
let racesProgresses = [];


io.on("connection", socket => { 
    // when user disconnects
    socket.on('disconnect', () => {
        const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
        // rm user
        connectedUsers = connectedUsers.filter(i => i.id !== socket.id);

        // send the socket events
        roomsToEmitDisconnectEvent.forEach(roomName => {
            socket.leave(roomName);
            io.to(roomName).emit('leaved', {socketId: socket.id});
        });
    });

    // connect the live
    socket.on('connect-live-game', ({ raceId, userAddress }) => {
        const roomName = `race-${raceId}`;
        // find user 
        const data = connectedUsers.find(i => i.raceId === raceId && i.userAddress === userAddress);

        if (!data) {
            // add user
            connectedUsers.push({ room: roomName, id: socket.id, userAddress });
        } else {
            connectedUsers = connectedUsers.map(i => {
                if (i => i.raceId === raceId && i.userAddress === userAddress) {
                    i.id = socket.id;
                }
                return i;
            });
        }

        socket.join(roomName);
        // send the socket event
        io.to(roomName).emit('joined', {socketId: socket.id, userAddress, raceId});
    });

    // minimize race (game)
    socket.on('minimize-live-game', () => {
        const roomsToEmitDisconnectEvent = connectedUsers.filter(i => i.id === socket.id).map(i => i.room);
        // rm user
        connectedUsers = connectedUsers.filter(i => i.id !== socket.id);

        // send the socket events
        roomsToEmitDisconnectEvent.forEach(roomName => {
            socket.leave(roomName);
            io.to(roomName).emit('leaved', {socketId: socket.id});
        });
    });

    // user completes the game
    socket.on('update-progress', ({ raceId, userAddress, property, value }) => {
        const roomName = `race-${raceId}`;
        let rProgress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);

        console.log(roomName, userAddress, rProgress);
        if (!rProgress) {
            console.log("No progress was found, setting new")
            rProgress = {
                room: roomName, 
                userAddress,
                progress: {
                    countdown: false,
                    game1: {
                        isDistributed: false,
                        completed: 0,
                        of: 0,
                    },
                    board1: false,
                    game2: {
                        isCompleted: false,
                        stage: 0,
                        fuel: 0,
                    },
                }
            }

            racesProgresses.push(rProgress);
        }


        switch (property) {
            case "countdown":
                rProgress.progress.countdown = true;
                break;
            case "board1":
                rProgress.progress.board1 = true;
                break;
            case "game1++":
                rProgress.progress.game1 = {
                    ...rProgress.progress.game1,
                    completed: rProgress.progress.game1.completed + 1,
                    of: value.of,
                }
                break;
            case "game1-distribute":
                rProgress.progress.game1 = {
                    ...rProgress.progress.game1,
                    isDistributed: true,
                }
                break;
            case "game2++":
                break;
            default:
                break;
        }     
          
        /*
        racesProgresses = racesProgresses.map(i => {
            if (i => i.room === roomName && i.userAddress === userAddress) {
                i = rProgress;
            }
            return i;
        });
        */

        console.log("UPDATED PROGRESSES", racesProgresses.map(i => i.progress.game1));

        io.to(roomName).emit('progress-updated', {raceId, property});
        
    });

    // get amount completed by raceId game gameId
    socket.on('get-progress', ({ raceId, userAddress }) => {
        const roomName = `race-${raceId}`;
        const progress = racesProgresses.find(i => i?.room === roomName && i?.userAddress === userAddress);
        io.to(socket.id).emit('race-progress', { progress });
    });

    // get users amount connected to the game 
    socket.on('get-connected', async({ raceId }) => {
        const roomName = `race-${raceId}`;
        const sockets = await io.in(roomName).fetchSockets();
        io.to(socket.id).emit('amount-of-connected', { amount: sockets.length, raceId });
    });
});

httpServer.listen(process.env.PORT);