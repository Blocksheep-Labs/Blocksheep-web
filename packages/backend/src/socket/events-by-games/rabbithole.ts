import { Socket, Server } from 'socket.io';
import module from '../../models/games-socket/index';

const { RaceProgress } = module.default;
const { TunnelState } = module.rabbithole;

interface TunnelGameState {
    room: string;
    secondsLeft: number;
    roundsPlayed: number;
    gameState: string;
    isFinished: boolean;
}

interface RaceProgressData {
    userAddress: string;
    progress: {
        game2: {
            v1: {
                game: object;
            };
        };
    };
}

const tunnelGameStates = ["reset", "default", "close", "open"];

export default (socket: Socket, io: Server): void => {
    socket.on('rabbithole-set-tunnel-state', async ({ raceId, secondsLeft, addRoundsPlayed, gameState, isFinished }: { raceId: string, secondsLeft: number, addRoundsPlayed: number, gameState?: string, isFinished: boolean }) => {
        const roomName = `race-${raceId}`;
        let currData = await TunnelState.findOne({ room: roomName }) as TunnelGameState | null;
    
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

    socket.on('rabbithole-get-tunnel-state', async ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        const currData = await TunnelState.findOne({ room: roomName }) as TunnelGameState | null;
    
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
        io.to(socket.id).emit('rabbithole-tunnel-state', { raceId, data: currData });
    });

    socket.on('rabbithole-get-all-fuel-tunnel', async ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        const progresses = await RaceProgress.find({ room: roomName }) as RaceProgressData[];
    
        io.to(socket.id).emit('rabbithole-race-fuel-all-tunnel', {
            progresses: progresses.map(i => ({
                userAddress: i.userAddress,
                ...i.progress.game2,
            })),
        });
    });

    socket.on('rabbithole-tunnel-started', ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-tunnel-started-on-client', { socketId: socket.id, raceId });
    });

    socket.on('rabbithole-results-shown', ({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;
        io.to(roomName).emit('rabbithole-results-shown-on-client', { socketId: socket.id, raceId });
    });
};
