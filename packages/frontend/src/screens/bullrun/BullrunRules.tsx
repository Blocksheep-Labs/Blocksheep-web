import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
import { useEffect, useState } from "react";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import RibbonLabel from "../../components/RibbonLabel";
import Rule from "../../components/Rule";
import BullrunRulesGrid from "../../components/BullrunRulesGrid";
import { BULLRUN_getPerksMatrix } from "../../utils/contract-functions";


export default function BullrunRules() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const [pointsMatrix, setPointsMatrix] = useState<number[][]>([[0,0,0], [0,0,0], [0,0,0]]);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: smartAccountAddress,
                property: "game3-rules-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: "game3-rules-complete",
            });
            
            navigate(`/race/${raceId}/bullrun`, {
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

    // fetch points matrix
    useEffect(() => {
        if (String(raceId).length) {
            BULLRUN_getPerksMatrix(Number(raceId)).then(data => {
                setPointsMatrix(data as number[][]);
            });
        }
    }, [raceId]);

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
        <div className="mx-auto flex h-dvh w-full flex-col bg-bullrun_rules_bg bg-cover bg-bottom items-center">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 10}%`}}></div>
            </div>
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="HOW TO PLAY"/>
            </div>
            <div className="h-fit flex flex-col gap-3 px-10 mt-4">
                <Rule text="1 VS 1 AGAINST OTHER PLAYERS"/>
                <Rule text="FIGHT - DEFEND - RUN"/>
            </div>
            <BullrunRulesGrid pointsMatrix={pointsMatrix}/>
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