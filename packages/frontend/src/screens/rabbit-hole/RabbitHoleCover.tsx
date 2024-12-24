import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
import { useEffect, useState } from "react";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink from "../../utils/linkGetter";
import TopPageTimer from "../../components/top-page-timer/TopPageTimer";
import { useGameContext } from "../../utils/game-context";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "./utils/getGamePart";

export default function RabbitHoleCover() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const { smartAccountAddress } = useSmartAccount();
    const { gameState } = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const [secondsVisual, setSecondsVisual] = useState(1000);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 3);

    const handleExpire = () => {
        console.log("UPDATE PROGRESS", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-preview-complete",
            version
        });
        
        socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-preview-complete",
            version
        });

        let redirectLink = '/';

        switch (version) {
            case "v1":
                redirectLink = generateLink("RABBIT_HOLE_RULES", Number(raceId)); break;
            case "v2": 
                redirectLink = generateLink("RABBIT_HOLE_V2_RULES", Number(raceId)); break;
            default:
                break;
        }

        socket.emit('minimize-live-game', { part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "preview"), raceId });
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
            time.setSeconds(time.getSeconds() + 3);
            restart(time);
            setSecondsVisual(3);
        }
    }, [gameState]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && gameState) {
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

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket && ["RABBIT_HOLE_PREVIEW", "RABBIT_HOLE_V2_PREVIEW"].includes(part)) {
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

            socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
                if (["RABBIT_HOLE_PREVIEW", "RABBIT_HOLE_V2_PREVIEW"].includes(part) && raceIdSocket == raceId && !movedToNext) {
                    if (!movedToNext) {
                        console.log("LEAVED")
                        setAmountOfConnected(amountOfConnected - 1);
                    } else {
                        handleExpire();
                    }
                    /*
                    if (!modalIsOpen) {
                        setModalIsOpen(true);
                    }
                    setModalType("waiting");
                    */
                }
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
    }, [socket, raceId, smartAccountAddress, amountOfConnected, gameState]);

    useEffect(() => {
        setModalIsOpen(true);
        setModalType("waiting");
        if (smartAccountAddress && gameState) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, gameState]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "preview") });
            socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "preview") });
        }
    }, [smartAccountAddress, socket, raceId]);

    useEffect(() => {
        if (raceId && socket) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                socket.emit('update-progress', {
                    raceId,
                    userAddress: smartAccountAddress,
                    property: "game2-preview-complete",
                    version
                });
                
                navigate(generateLink(screen, Number(raceId)));
            });
    
            return () => {
                socket.off('screen-changed');
            }
        }
    }, [raceId, socket]);


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
        <>
            <TopPageTimer duration={secondsVisual * 1000} />
            <div className="mx-auto rounded-none flex w-full flex-col bg-rabbit_hole_cover_bg bg-cover bg-top" style={{ height: `${window.innerHeight}px` }}>
                {
                    /*
                    modalIsOpen && modalType === "waiting" && 
                    <WaitingForPlayersModal 
                        numberOfPlayers={amountOfConnected} 
                        numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                    />
                    */
                }
            </div>
        </>
    );
}