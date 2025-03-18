import { updateProgress } from "./update-progress-by-games/update-progress";

import underdogBaseState from "./update-progress-by-games/default-states-by-games/underdog";
import rabbitHoleBaseState from "./update-progress-by-games/default-states-by-games/rabbithole";
import bullrunBaseState from "./update-progress-by-games/default-states-by-games/bullrun";

import { finishRace } from "../models/users/users.model";

// games events

import initUnderdog from './events-by-games/underdog';
import initRabbithole from './events-by-games/rabbithole';
import initBullrun from './events-by-games/bullrun';
import initDrivers from "./events-default/drivers";
import initConnections from './events-default/connection';

import module from '../models/games-socket/index';


const {
    ConnectedUser,
    RaceProgress,
    Screen,
    PlayerPoints,
} = module.default;

const { 
    QuestionsState
} = module.underdog;

const {
    TunnelState
} = module.rabbithole;


export const applySocketEvents = (io) => {
    io.engine.on("connection_error", (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });

    io.on("connection", async socket => {
        // basic connection handlers
        initConnections(socket, io);

        // init games 
        initUnderdog(socket, io);
        initRabbithole(socket, io);
        initBullrun(socket, io);

        // addons
        initDrivers(socket, io);


        socket.on('get-latest-screen', async ({ raceId }) => {
            const roomName = `race-${raceId}`;

            const roomScreenData = await Screen.findOne({ raceId: raceId, room: roomName });

            let latestScreen = undefined;
            
            if (roomScreenData?.latestScreen) {
                latestScreen = roomScreenData.latestScreen;
            }
            
            /*
            if (!latestScreen) {
                latestScreen = "UNKNOWN";
                roomScreenData.latestScreen = latestScreen;
                await roomScreenData.save();
            }
            */

            io.to(socket.id).emit('latest-screen', { raceId, screen: latestScreen });
        });


        // Listen for 'update-progress' events
        socket.on('update-progress', async ({ raceId, userAddress, property, value, version }) => {
            await handleUpdateProgress({ raceId, userAddress, property, value, version });
        });



        // get amount completed by raceId game gameId
        socket.on('get-progress', async ({ raceId, userAddress }) => {
            const roomName = `race-${raceId}`;
            const progress = await RaceProgress.findOne({ room: roomName, userAddress });

            let questionsStateValue = await QuestionsState.findOne({ room: roomName });
            let tunnelStateValue = await TunnelState.findOne({ room: roomName });

            if (!questionsStateValue) {
                const newState = {
                    room: roomName,
                    index: 0,
                    secondsLeft: 10,
                    state: 'answering'
                };
                questionsStateValue = await QuestionsState.create(newState);
            }

            if (!tunnelStateValue) {
                const newState = {
                    room: roomName,
                    secondsLeft: 10,
                    roundsPlayed: 0,
                    gameState: "default",
                    isFinished: false,
                };
                tunnelStateValue = await TunnelState.create(newState);
            }

            const roomScreenData = await Screen.findOne({ raceId, room: roomName });

            io.to(socket.id).emit('race-progress', { 
                progress, 
                latestScreen: roomScreenData?.latestScreen,
                questionsState: questionsStateValue,
                tunnelState: tunnelStateValue
            });
        });
    


        // get amount completed by raceId game gameId
        socket.on('get-progress-all', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const progress = await RaceProgress.find({ room: roomName });
            io.to(socket.id).emit('race-progress-all', { progress });
        });

    
        // get users amount connected to the game
        socket.on('get-connected', async ({ raceId }) => {
            const roomName = `race-${raceId}`;
            const connectedInRoom = await ConnectedUser.find({ room: roomName });
            io.to(socket.id).emit('amount-of-connected', { 
                amount: connectedInRoom.length, 
                raceId 
            });
        });
        
        

        socket.on('player-add-points', async ({ raceId, points, userAddress }) => {
            const roomName = `room-${raceId}`;
            let playerPoints = await PlayerPoints.findOne({ userAddress, room: roomName });

            if (!playerPoints) {
                playerPoints = await PlayerPoints.create({ 
                    userAddress, room: 
                    roomName, 
                    points, 
                    finished: false 
                });
            } else {
                playerPoints.points += points;
                await playerPoints.save();
            }

            console.log({ raceId, points, userAddress });
        });




        socket.on('race-finish', async ({raceId, userAddress}) => {
            const roomName = `room-${raceId}`;

            const playersPointsData = await PlayerPoints.find({ room: roomName });

            if (!playersPointsData || playersPointsData.length === 0) {
                return;
            }

            // Sort players by points in descending order
            playersPointsData.sort((a, b) => a.userAddress.localeCompare(b.userAddress));
            playersPointsData.sort((a, b) => a.points - b.points);

            const centralIndex = Math.floor(playersPointsData.length / 2);


            await Promise.all(playersPointsData.map(async (player, index) => {
                player.finished = true;
                await player.save();

                // Determine increment or decrement based on the central score
                let property = index < centralIndex ? "increment" : "decrement";

                console.log(player.userAddress, property, raceId);

                await finishRace(player.userAddress, property, raceId);
            }));
        });
    });

  console.log("[SOCKET] Events applied.");
};


export const handleUpdateProgress = async(data) => {
    const { raceId, userAddress, property, value, version } = data;
    // console.log({ raceId, userAddress, property, value, version })
    const roomName = `race-${raceId}`;

    let rProgress = await RaceProgress.findOneAndUpdate(
        {
            room: roomName,
            userAddress
        },
        {
            $setOnInsert: {
                room: roomName,
                userAddress,
                progress: {
                    countdown: false,
                    board1: false,
                    board2: false,
                    board3: false,
                    board4: false,
                    nicknameSet: false,
                    story: {
                        intro: false,
                        part1: false,
                        part2: false,
                        part3: false,
                        part4: false,
                        conclusion: false,
                    },
                    ...underdogBaseState,
                    ...rabbitHoleBaseState,
                    ...bullrunBaseState,
                }
            }
        },
        {
            new: true,
            upsert: true
        }
    );


    if (property === 'rabbithole-eliminate') {
        const racesProgresses = await RaceProgress.find({ room: roomName });
        const connectedUsers = await ConnectedUser.find({ room: roomName });

        // Set the fuel of all players who are not connected to 0
        await Promise.all(racesProgresses.map(async progress => {
            // Check if the player is not the eliminating player and is not connected
            if (progress.userAddress !== userAddress && !connectedUsers.some(user => user.userAddress === progress.userAddress)) {
                progress.progress.rabbithole[version] = {
                    ...progress.progress.rabbithole[version],
                    game: {
                        ...progress.progress.rabbithole[version].game,
                        fuel: 0, // Set fuel to 0 for players who are not connected
                    }
                };

                await progress.save();
            }
        }));

        // Set the fuel of the eliminating player to 0
        const eliminatingPlayerProgress = racesProgresses.find(progress => progress.userAddress === userAddress);
        if (eliminatingPlayerProgress) {
            eliminatingPlayerProgress.progress.rabbithole[version] = {
                ...eliminatingPlayerProgress.progress.rabbithole[version],
                game: {
                    ...eliminatingPlayerProgress.progress.rabbithole[version].game,
                    fuel: 0, // Set fuel to 0 for the eliminating player
                }
            };
            await eliminatingPlayerProgress.save();
        }
    }

    const progressToUpdate = JSON.parse(JSON.stringify(rProgress));
    const updatedProgress = updateProgress(property, value, progressToUpdate, Number(raceId), version);

    // update event sender progress
    // await updatedProgress.save();

    // Update the progress in MongoDB
    try {
        await RaceProgress.updateOne(
            { room: roomName, userAddress },
            { $set: updatedProgress },
            { upsert: true }
        );
    } catch (error) {
        console.log("[!] Update progress error", error);
    }


    io.to(roomName).emit('progress-updated', { raceId, property, value, userAddress, rProgress: updatedProgress });
}
