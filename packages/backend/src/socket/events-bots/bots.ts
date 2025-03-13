import {disconnectBotsFromRace, registerBotAtRace} from "../../models/bots/bots.model";

export default (socket: any, io: any): void => {
    // this should be called by a user who is currently waiting in a race
    socket.on('bot-request-connection', async({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;

        try {
            const bot = await registerBotAtRace(raceId);
            io.to(roomName).emit('bot-connected', {
                botAddress: bot?.address
            });
        } catch (error) {
            io.to(roomName).emit('bot-connection-error', {
                message: error,
            });
        }
    });

    socket.on('bot-disconnect-all', async({ raceId }: { raceId: string }) => {
        const roomName = `race-${raceId}`;

        try {
            await disconnectBotsFromRace(raceId);
            io.to(roomName).emit('bot-disconnected', {
                raceId
            });
        } catch (error) {
            io.to(roomName).emit('bot-disconnection-error', {
                message: error,
            });
        }
    });
}
