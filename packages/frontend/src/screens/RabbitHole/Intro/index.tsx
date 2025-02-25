import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "@/utils/socketio";
import { useEffect, useState } from "react";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "../utils/getGamePart";
import { useRaceById } from "@/hooks/useRaceById";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";


export default function RabbitHoleCover() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const { smartAccountAddress } = useSmartAccount();
    const { gameState } = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [secondsVisual, setSecondsVisual] = useState(1000);
    const { race } = useRaceById(Number(raceId));

    const SCREEN_NAME = rabbitholeGetGamePart(version as TRabbitholeGameVersion, "preview");

    const handleExpire = () => {
        console.log("UPDATE PROGRESS", {
            raceId,
            userAddress: smartAccountAddress,
            property: "rabbithole-preview-complete",
            version
        });
        
        socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: "rabbithole-preview-complete",
            version
        });


        /*
        switch (version) {
            case "v1":
                redirectLink = generateLink("RABBIT_HOLE_RULES", Number(raceId)); break;
            case "v2": 
                redirectLink = generateLink("RABBIT_HOLE_V2_RULES", Number(raceId)); break;
            default:
                break;
        }
        */


        const introPart = SCREEN_NAME;

        const currentScreenIndex = race?.screens.indexOf(introPart) as number;
        const redirectLink = generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId));
        socket.emit('minimize-live-game', { part: introPart, raceId });
        navigate(redirectLink);
    }

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: new Date(),
        onExpire: handleExpire,
        autoStart: false
    });

    useEffect(() => {
        if (race && SCREEN_NAME) {    
            httpGetRaceDataById(`race-${race.id}`)
                .then(({data}) => {
                    const time = new Date();
                    const expectedTime = getScreenTime(data, SCREEN_NAME);
                    time.setSeconds(time.getSeconds() + expectedTime);
                    restart(time);
                    setSecondsVisual(expectedTime);
                });
        }
    }, [race, SCREEN_NAME]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && gameState) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
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
        if (smartAccountAddress && gameState) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, gameState]);

    
    useEffect(() => {
        if (raceId && socket) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                socket.emit('update-progress', {
                    raceId,
                    userAddress: smartAccountAddress,
                    property: "rabbithole-preview-complete",
                    version
                });
                
                navigate(generateLink(screen, Number(raceId)));
            });
            
            socket.on('latest-screen', ({ screen }) => {
                if (screen !== SCREEN_NAME) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "rabbithole-preview-complete",
                        version
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
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: SCREEN_NAME });
            // socket.emit("get-latest-screen", { raceId, part: SCREEN_NAME });
        }
    }, [smartAccountAddress, socket, raceId]);
    
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