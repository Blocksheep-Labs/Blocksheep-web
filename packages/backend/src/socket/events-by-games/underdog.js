const { 
    underdog: {
        QuestionsState,
    },
} = require('../../models/games-socket/index');

// UNDERDOG
let questionsGameStates = [["answering", "submitting"], ["distributing", "distributed"]];

module.exports = (socket, io) => {
    socket.on('underdog-set-questions-state', async ({ raceId, newIndex, secondsLeft, state }) => {
        const roomName = `race-${raceId}`;
        let currData = await QuestionsState.findOne({ room: roomName });
    
        if (!currData) {
            const newState = new QuestionsState({
                room: roomName,
                index: newIndex,
                secondsLeft,
                state: 'answering',
            });
            await newState.save();
            io.to(roomName).emit('underdog-questions-state', { raceId, data: newState });
            return;
        }
    
        if (currData.index < newIndex) {
            currData.index = newIndex;
        }
    
        currData.secondsLeft = secondsLeft;
    
        const newStateLevel = questionsGameStates.indexOf(i => i.includes(state));
        const currStateLevel = questionsGameStates.indexOf(i => i.includes(currData.state));
        if (newStateLevel >= currStateLevel) {
            currData.state = state;
        }
    
        // Update the state in MongoDB
        await QuestionsState.updateOne(
            { room: roomName },
            { $set: { index: currData.index, secondsLeft: currData.secondsLeft, state } }
        );
    
        io.to(roomName).emit('underdog-questions-state', { raceId, data: currData });
    });
    
    
    
    socket.on('underdog-get-questions-state', async ({ raceId }) => {
        const roomName = `race-${raceId}`;
        const currData = await QuestionsState.findOne({ room: roomName });
    
        if (!currData) {
            const newState = {
                room: roomName,
                index: 0,
                secondsLeft: 10,
                state: 'answering'
            };
            await QuestionsState.create(newState);
            io.to(socket.id).emit('questions-state', { raceId, data: newState });
            return;
        }
        io.to(socket.id).emit('underdog-questions-state', { raceId, data: currData })
    });
    
    
    
    socket.on('underdog-underdog-results-shown', ({ raceId }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('underdog-results-shown-on-client', { socketId: socket.id, raceId });
    });
}
