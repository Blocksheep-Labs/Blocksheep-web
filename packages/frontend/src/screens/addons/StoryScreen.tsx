import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import generateLink from "../../utils/linkGetter";
import StoryVideo from "../../assets/stories/sh.mp4";

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
                    redirectLink = generateLink("RACE_START", Number(raceId)); break;
                case "part1": 
                    redirectLink = generateLink("RABBIT_HOLE_PREVIEW", Number(raceId)); break;
                case "part2": 
                    redirectLink = generateLink("BULL_RUN_PREVIEW", Number(raceId)); break;
                case "part3": 
                    redirectLink = generateLink("RABBIT_HOLE_V2_PREVIEW", Number(raceId)); break;
                case "part4":
                    redirectLink = generateLink("STORY_CONCLUSION", Number(raceId)); break;
                case "conclusion":
                    redirectLink = generateLink("PODIUM", Number(raceId)); break;
                default:
                    break;
            }
            
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
        if (smartAccountAddress && location.state) {
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

            socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket) {
                    console.log("JOINED++")
                    setAmountOfConnected(amountOfConnected + 1);
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                }
            });

            socket.on('leaved', () => {
                console.log("LEAVED")
                setAmountOfConnected(amountOfConnected - 1);
                if (!modalIsOpen) {
                    setModalIsOpen(true);
                }
                setModalType("waiting");
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, location.state]);

    useEffect(() => {
        setModalIsOpen(true);
        setModalType("waiting");
        if (smartAccountAddress && location.state) {
            socket.emit("get-connected", { raceId });
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, location.state]);

    return (
        <div className="bg-white h-full relative">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 16.66}%`}}></div>
            </div>
            <video autoPlay muted className="asbolute w-full h-full object-cover">
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
                modalIsOpen && modalType === "waiting" && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
            }
        </div>
    );
}