import { Socket, Server } from 'socket.io';
import module from '../../models/games-socket/index';
import handleUserChoiceWithBot from "../events-bots/game-handlers";


const { QuestionsState } = module.underdog;


interface QuestionsStateData {
    room: string;
    index: number;
    secondsLeft: number;
    state: string;
}

const questionsGameStates = [["answering", "submitting"], ["distributing", "distributed"]];

export default (socket: Socket, io: Server): void => {
    socket.on('underdog-set-questions-state', async ({ raceId, newIndex, secondsLeft, state }: { raceId: number, newIndex: number, secondsLeft: number, state: string }) => {
        const roomName = `race-${raceId}`;
        let currData = await QuestionsState.findOne({ room: roomName }) as QuestionsStateData | null;
    
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
    
        const newStateLevel = questionsGameStates.findIndex(i => i.includes(state));
        const currStateLevel = questionsGameStates.findIndex(i => i.includes(currData.state));
        if (newStateLevel >= currStateLevel) {
            currData.state = state;
        }
    
        // Update the state in MongoDB
        await QuestionsState.updateOne(
            { room: roomName },
            { $set: { index: currData.index, secondsLeft: currData.secondsLeft, state } }
        );

        if (state == "distributing") {
            // make all bots send distribute tx
            handleUserChoiceWithBot({
                type: "distribute",
                game: "UNDERDOG",
                raceId,
                data: null
            }).catch(err => {
               console.log("Bot distribute error:", err);
            });
        }
    
        io.to(roomName).emit('underdog-questions-state', { raceId, data: currData });
    });

    socket.on('underdog-get-questions-state', async ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        const currData = await QuestionsState.findOne({ room: roomName }) as QuestionsStateData | null;
    
        if (!currData) {
            const newState = {
                room: roomName,
                index: 0,
                secondsLeft: 10,
                state: 'answering',
            };
            await QuestionsState.create(newState);
            io.to(socket.id).emit('underdog-questions-state', { raceId, data: newState });
            return;
        }
        io.to(socket.id).emit('underdog-questions-state', { raceId, data: currData });
    });

    socket.on('underdog-underdog-results-shown', ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('underdog-results-shown-on-client', { socketId: socket.id, raceId });
    });
};
