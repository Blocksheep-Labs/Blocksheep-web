const { 
    default: {
        RaceProgress,
    },
    rabbithole: {
        TunnelState,
    }
} = require('../../models/games-socket/index');

// RABBIT_HOLE
let tunnelGameStates = ["reset", "default", "close", "open"];

module.exports = (socket, io) => {
    socket.on('rabbithole-set-tunnel-state', async ({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished }) => {
        //console.log({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished })
        const roomName = `race-${raceId}`;
        let currData = await TunnelState.findOne({ room: roomName });
    
        if (!currData) {
            const newState = new TunnelState({
                room: roomName,
                secondsLeft: 10,
                roundsPlayed: addRoundsPlayed,
                gameState,
                isFinished: false,
            });
            await newState.save();
            io.to(roomName).emit('rabbithole-tunnel-state', { raceId, data: newState });
            return;
        }
    
        if (secondsLeft < currData.secondsLeft) {
            currData.secondsLeft = secondsLeft;
        }
    
        currData.roundsPlayed += addRoundsPlayed;
    
        if (gameState && tunnelGameStates.includes(gameState)) {
            currData.gameState = gameState;
        }
    
        if (isFinished) {
            currData.isFinished = true;
        }
    
        // Update the tunnel state in MongoDB
        await TunnelState.updateOne(
            { room: roomName },
            { $set: currData }
        );
    
        io.to(roomName).emit('rabbithole-tunnel-state', { raceId, data: currData });
    });
    
    
    
    
    
    socket.on('rabbithole-get-tunnel-state', async ({ raceId }) => {
        const roomName = `race-${raceId}`;
        const currData = await TunnelState.findOne({ room: roomName });
    
        if (!currData) {
            const newState = {
                room: roomName,
                secondsLeft: 10,
                roundsPlayed: 0,
                gameState: "default",
                isFinished: false,
            };
            await TunnelState.create(newState);
    
            io.to(socket.id).emit('rabbithole-tunnel-state', { raceId, data: newState });
            return;
        }
        io.to(socket.id).emit('rabbithole-tunnel-state', { raceId, data: currData })
    });
    
    
    
    // get all progresses for tunnel game
    socket.on('rabbithole-get-all-fuel-tunnel', async ({ raceId }) => {
        const roomName = `race-${raceId}`;
        const progresses = await RaceProgress.find({ room: roomName });
    
        /*
        console.log("PROGRESSES", raceId, roomName, progresses.map(i => {
            return {
                userAddress: i.userAddress,
                game2: {...i.progress.game2.v1.game}
            }
        }));
        */
        
        io.to(socket.id).emit(`rabbithole-race-fuel-all-tunnel`, {
            progresses: progresses.map(i => {
                return {
                    userAddress: i.userAddress,
                    ...i.progress.game2
                }
            }),
        });
    });
    
    
    
    socket.on('rabbithole-tunnel-started', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-tunnel-started-on-client', { socketId: socket.id, raceId });
    });
    
    
    
    
    socket.on('rabbithole-results-shown', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-results-shown-on-client', { socketId: socket.id, raceId });
    });
}