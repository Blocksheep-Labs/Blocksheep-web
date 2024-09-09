import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../utils/socketio";
import RibbonLabel from "../components/RibbonLabel";
import Rule from "../components/Rule";
import { useEffect, useState } from "react";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { useSmartAccount } from "../hooks/smartAccountProvider";


export default function RabbitHoleRules() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: smartAccountAddress,
                property: "game2-rules-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: "game2-rules-complete",
            });

            navigate(`/race/${raceId}/rabbit-hole`, {
                state: location.state
            });
        },
        autoStart: true
    });


    useEffect(() => {
        if (location.state && amountOfConnected === location.state.amountOfRegisteredUsers) {    
          
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
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


            socket.on('race-progress', (progress) => {
                console.log("RACE PROGRESS PER USER:", progress);
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
                socket.off('race-progress');
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
        <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5" style={{width: `${totalSeconds * 10}%`}}></div>
            </div>
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="HOW TO PLAY"/>
            </div>
            <div className="h-full flex flex-col gap-3 px-10 mt-4">
                <Rule text="SET UP YOUR SPEED BEFORE GOING INTO THE TUNNEL"/>
                <Rule text="MORE SPEED = MORE FUEL CONSUMED"/>
                <Rule text="SURVIVE! YOU ARE ELIMINATED IF..."/>
                <Rule text="1) YOU ARE THE LAST ONE (SPEED IS TOO LOW)"/>
                <Rule text="2) YOU RUN OUT FUEL"/>
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