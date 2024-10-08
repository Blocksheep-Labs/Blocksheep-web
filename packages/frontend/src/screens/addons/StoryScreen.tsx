import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import generateLink from "../../utils/linkGetter";
import StoryVideo from "../../assets/stories/sh.mp4";


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
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 6);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
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
                    redirectLink = generateLink("RABBIT_HOLE_PREVIEW", Number(raceId)); 
                    break;
                case "part2": 
                    redirectLink = generateLink("BULL_RUN_PREVIEW", Number(raceId)); 
                    break;
                case "part3": 
                    //redirectLink = generateLink("RABBIT_HOLE_V2_PREVIEW", Number(raceId)); 
                    redirectLink = generateLink("RATE", Number(raceId));
                    break;
                case "part4":
                    redirectLink = generateLink("STORY_CONCLUSION", Number(raceId)); 
                    break;
                case "conclusion":
                    redirectLink = generateLink("PODIUM", Number(raceId)); 
                    break;
                default:
                    break;
            }
            
            socket.emit('minimize-live-game', { part: getStoryPart(part as string), raceId });
            navigate(redirectLink, {
                state: location.state
            });
        },
        autoStart: true
    });

    useEffect(() => {
        if (location.state && amountOfConnected === location.state.amountOfRegisteredUsers) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + 6);
            restart(time);
        } else {
            pause();
        }
    }, [amountOfConnected, location.state]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && location.state && part) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    if (amount === location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
                console.log("JOINED", raceIdSocket, raceId);
                if (raceId == raceIdSocket && socketPart == getStoryPart(part) ) {
                    console.log("JOINED++")
                    setAmountOfConnected(amountOfConnected + 1);
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part: partSocket, raceId: raceIdSocket, movedToNext }) => {
                if (partSocket == getStoryPart(part) && raceId == raceIdSocket && !movedToNext) {
                    console.log("LEAVED")
                    setAmountOfConnected(amountOfConnected - 1);
                    if (!modalIsOpen) {
                        setModalIsOpen(true);
                    }
                    setModalType("waiting");
                }
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, location.state, part]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length && part) {
            setModalIsOpen(true);
            setModalType("waiting");
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getStoryPart(part) });
        }
    }, [smartAccountAddress, socket, raceId, part]);

    return (
        <div className="bg-white h-full relative">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 16.66}%`}}></div>
            </div>
            <video autoPlay muted className="asbolute w-full h-full object-cover" autoFocus={false}>
                <source src={StoryVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-5 bg-black bg-opacity-50 p-5">
                <p className="text-3xl text-center text-white">
                    In the silence between breaths, a signal ignites;
                    the world awakens to the hum of possibility.
                </p>
            </div>

            {
                location.state.amountOfRegisteredUsers > amountOfConnected && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
            }
        </div>
    );
}