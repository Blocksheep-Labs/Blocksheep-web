import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "@/utils/socketio";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import generateLink from "@/utils/linkGetter";
import StoryVideo from "@/assets/stories/sh.mp4";
import { httpGetRaceDataById } from "@/utils/http-requests";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import storiesData from "@/config/stories.json";


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
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const [storyKey, setStoryKey] = useState<number | undefined>(undefined);
    const [seconds, setSeconds] = useState(1000);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 6);

    const handleExpire = () => {
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

        let redirectLink = "/";
     
        switch (part) {
            case "intro":
                redirectLink = generateLink("RACE_START", Number(raceId)); 
                break;
            case "part1": 
                redirectLink = generateLink("UNDERDOG_PREVIEW", Number(raceId)); 
                break;
            case "part2": 
                redirectLink = generateLink("BULL_RUN_PREVIEW", Number(raceId)); 
                break;
            case "part3": 
                // redirectLink = generateLink("RABBIT_HOLE_V2_PREVIEW", Number(raceId)); 
                redirectLink = generateLink("RATE", Number(raceId));
                break;
            case "part4":
                redirectLink = generateLink("RATE", Number(raceId));
                break;
            case "conclusion":
                redirectLink = generateLink("PODIUM", Number(raceId));
                break;
            default:
                break;
        }
   
        
        socket.emit('minimize-live-game', { part: getStoryPart(part as string), raceId });
        navigate(redirectLink);
    }

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: handleExpire,
        autoStart: true
    });


    useEffect(() => {
        if (gameState) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + 6);
            setSeconds(6);
            restart(time);
        }
    }, [gameState]);

    // handle socket events
    useEffect(() => {
        console.log("EFFECT >>>>", {smartAccountAddress, gameState, part});
        if (smartAccountAddress && gameState && part) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    if (amount === gameState.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
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
                        handleExpire();
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
        if (raceId && socket) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                socket.emit('update-progress', {
                    raceId,
                    userAddress: smartAccountAddress,
                    property: `story-${part}`,
                });
                navigate(generateLink(screen, Number(raceId)));
            });
            
            socket.on('latest-screen', ({ screen }) => {
                if (screen !== getStoryPart(part as string)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: `story-${part}`,
                    });
                    navigate(generateLink(screen, Number(raceId)));
                }
            });
            
            return () => {
                socket.off('screen-changed');
                socket.off('latest-screen');
            }
        }
    }, [raceId, socket]);
    
    useEffect(() => {
        if(smartAccountAddress && String(raceId).length && part) {
            httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
                console.log("RACE DATA:", data);
                setStoryKey(data?.race?.storyKey || 0);
            });
            setModalIsOpen(true);
            setModalType("waiting");
            if (!socket.connected) {
                console.log("Not conencted, trying to reconnect")
                socket.connect();
            }
            setTimeout(() => {
                console.log("Emitting connect live game event...");
                socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getStoryPart(part) });
                socket.emit("get-latest-screen", { raceId, part: getStoryPart(part) });
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
                storyKey != undefined &&
                <video autoPlay muted className="asbolute w-full h-full object-cover" autoFocus={false} playsInline>
                    <source src={videos[storyKey]} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            }

            <div className="absolute bottom-5 bg-black bg-opacity-50 p-5">
                <p className="text-lg text-center text-white">
                    { storyKey != undefined && getStoryText(part as string, storyKey) }
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