import RaceSchema from "../../models/races/races.mongo";

interface IDriversSelectSheep {
    raceId: string;
    selectedSheep: number;
    userAddress: string;
}

interface IDriversSelectWarCry {
    raceId: string;
    selectedWarCry: number;
    userAddress: string;
}


export default (socket: any, io: any): void => {
    socket.on('drivers-select-sheep', async ({ raceId, selectedSheep, userAddress }: IDriversSelectSheep) => {
        const roomName = `race-${raceId}`;
    
        const race = await RaceSchema.findOne({ raceId: roomName });
    
        if (!race) return;
    
        // Check if the selectedSheep is already assigned to another user
        if (Object.values(race.usersSheeps || {}).includes(selectedSheep)) {
            io.to(socket.id).emit('drivers-sheep-selection-error', { error: "Sheep already selected by another driver", raceId, selectedSheep, userAddress });
            return;
        }
    
        // Perform atomic update
        await RaceSchema.updateOne(
            { raceId: roomName },
            { $set: { [`usersSheeps.${userAddress}`]: selectedSheep } }
        );
    
        io.to(roomName).emit('drivers-sheep-selected', { raceId, selectedSheep, userAddress });
    });
    
    socket.on('drivers-select-warcry', async ({ raceId, selectedWarCry, userAddress }: IDriversSelectWarCry) => {
        const roomName = `race-${raceId}`;
    
        const race = await RaceSchema.findOne({ raceId: roomName });
    
        if (!race) return;
    
        // Check if the selectedWarCry is already assigned to another user
        if (Object.values(race.usersWarCry || {}).includes(selectedWarCry)) {
            io.to(socket.id).emit('drivers-warcry-selection-error', { error: "Warcry already selected by another driver", raceId, selectedWarCry, userAddress });
            return;
        }
    
        // Perform atomic update
        await RaceSchema.updateOne(
            { raceId: roomName },
            { $set: { [`usersWarCry.${userAddress}`]: selectedWarCry } }
        );
    
        io.to(roomName).emit('drivers-warcry-selected', { raceId, selectedWarCry, userAddress });
    });
}