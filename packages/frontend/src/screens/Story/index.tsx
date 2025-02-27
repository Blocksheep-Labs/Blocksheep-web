import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "@/utils/socketio";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import StoryVideo from "@/assets/stories/sh.mp4";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import storiesData from "@/config/stories.json";
import { useRaceById } from "@/hooks/useRaceById";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";
import { getRaceScreens } from "@/utils/getRaceScreens";


const videos = [
    StoryVideo,
    StoryVideo,
    StoryVideo,
    StoryVideo,
    StoryVideo
];


const getStoryText = (part: string, pos: number) => {
    // @ts-ignore
    return storiesData[part][pos];
}


const getStoryPart = (part: string) => {
    let story_part = "";
    switch (part) {
        case "intro": story_part = "STORY_INTRO"; break;
        case "part1": story_part = "STORY_PART_1"; break;
        case "part2": story_part = "STORY_PART_2"; break;
        case "part3": story_part = "STORY_PART_3"; break;
        case "part4": story_part = "STORY_PART_4"; break;
        case "conclusion": story_part = "STORY_CONCLUSION"; break;
        default:
            break;
    }

    return story_part;
}

export default function StoryScreen() {
    const navigate = useNavigate();
    const {raceId, part} = useParams();
    const { gameState } = useGameContext();
    const {smartAccountAddress} = useSmartAccount();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [seconds, setSeconds] = useState(1000);
    const { race } = useRaceById(Number(raceId));
    const [readyToNavigateNext, setReadyToNavigateNext] = useState(false);


    const SCREEN_NAME = getStoryPart(part as string);

    // navigator
    useEffect(() => {
        if (race && readyToNavigateNext && smartAccountAddress && raceId != undefined) {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: smartAccountAddress,
                property: `story-${part}`,
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: `story-${part}`,
            });

            const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;
            socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
            navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
        }
    }, [race, readyToNavigateNext, SCREEN_NAME, smartAccountAddress, raceId]);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: new Date(),
        onExpire: () => setReadyToNavigateNext(true),
        autoStart: false
    });

    // setups the timer
    useEffect(() => {
        if (race && SCREEN_NAME) {
            httpGetRaceDataById(`race-${race.id}`)
                .then(({data}) => {
                    const time = new Date();
                    const expectedTime = getScreenTime(data, SCREEN_NAME);
                    time.setSeconds(time.getSeconds() + expectedTime);
                    
                    setSeconds(expectedTime);
                    restart(time);
                });
        }
    }, [race, SCREEN_NAME]);


    // handle socket events
    useEffect(() => {
        console.log("EFFECT >>>>", {smartAccountAddress, gameState, part});
        if (smartAccountAddress && gameState && part) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
                console.log("JOINED", raceIdSocket, raceId);
                if (raceId == raceIdSocket && socketPart == getStoryPart(part) ) {
                    console.log("JOINED++")
                    /*
                    setAmountOfConnected(amountOfConnected + 1);
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    */
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part: partSocket, raceId: raceIdSocket, movedToNext }) => {
                if (partSocket == getStoryPart(part) && raceId == raceIdSocket) {
                    if (!movedToNext) {
                        console.log("LEAVED")
                        setAmountOfConnected(amountOfConnected - 1);
                        /*
                        if (!modalIsOpen) {
                            setModalIsOpen(true);
                        }
                        setModalType("waiting");
                        */
                    } else {
                        setReadyToNavigateNext(true);
                    }
                }
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, gameState, part]);

    
    useEffect(() => {
        if (raceId && socket && race && SCREEN_NAME) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: `story-${part}`,
                    });
                    // alert(`screen-changed = ${screen}`)
                    navigate(generateLink(screen, Number(raceId)));
                }
            });
            
            
            socket.on('latest-screen', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: `story-${part}`,
                    });
                    // alert(`latest-screen = ${screen}`)
                    navigate(generateLink(screen, Number(raceId)));
                }
            });
            
            
            return () => {
                socket.off('screen-changed');
                socket.off('latest-screen');
            }
        }
    }, [raceId, socket, race, SCREEN_NAME]);
    
    useEffect(() => {
        if(smartAccountAddress && String(raceId).length && part) {
            if (!socket.connected) {
                console.log("Not conencted, trying to reconnect")
                socket.connect();
            }
            setTimeout(() => {
                console.log("Emitting connect live game event...");
                socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getStoryPart(part) });
                // socket.emit("get-latest-screen", { raceId, part: getStoryPart(part) });
            }, 700);
        }
    }, [smartAccountAddress, socket, raceId, part]);
    
    // kick player if page chnages (closes)
    useEffect(() => {
        const handleTabClosing = (e: any) => {
            e.preventDefault();
            socket.disconnect();
        }
        window.addEventListener('unload', handleTabClosing);
        return () => {
            window.removeEventListener('unload', handleTabClosing);
        }
    }, [socket, smartAccountAddress, raceId]);

    return (
        <div className="bg-white relative" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={seconds * 1000} />
            {
                race &&
                <video autoPlay muted className="asbolute w-full h-full object-cover" autoFocus={false} playsInline>
                    <source src={videos[race.storyKey]} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            }

            <div className="absolute bottom-5 bg-black bg-opacity-50 p-5">
                <p className="text-lg text-center text-white">
                    { race && getStoryText(part as string, race.storyKey) }
                </p>
            </div>

            {
                /*
                location.state.amountOfRegisteredUsers > amountOfConnected && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
                */
            }
        </div>
    );
}