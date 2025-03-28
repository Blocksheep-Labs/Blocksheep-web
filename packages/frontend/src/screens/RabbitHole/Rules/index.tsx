import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "@/utils/socketio";
import { useEffect, useState } from "react";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "../utils/getGamePart";
import RHRule1 from "./components/rule-1";
import RHRule2 from "./components/rule-2";
import RHRule3 from "./components/rule-3";
import RHRule4 from "./components/rule-4";
import { useRaceById } from "@/hooks/useRaceById";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";


export default function RabbitHoleRules() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const {gameState} = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [secondsVisual, setSecondsVisual] = useState(1000);
    const { race } = useRaceById(Number(raceId));
    const [readyToNavigateNext, setReadyToNavigateNext] = useState(false);


    const SCREEN_NAME = rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules");


    const { totalSeconds, restart, pause, seconds } = useTimer({
        expiryTimestamp: new Date(),
        onExpire: () => setReadyToNavigateNext(true),
        autoStart: false
    });
    

    // navigator
    useEffect(() => {
        if (race && readyToNavigateNext && smartAccountAddress && raceId != undefined) {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: smartAccountAddress,
                property: "rabbithole-rules-complete",
                version
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: "rabbithole-rules-complete",
                version
            });

            const rulesPart = rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules");

            const currentScreenIndex = race?.screens.indexOf(rulesPart) as number;
            const redirectLink = generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId));
            socket.emit('minimize-live-game', { part: rulesPart, raceId });
            navigate(redirectLink);
        }
    }, [race, readyToNavigateNext, SCREEN_NAME, smartAccountAddress, raceId]);


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
                console.log({amount, rquiredByState: gameState.amountOfRegisteredUsers})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket && ["RABBIT_HOLE_RULES", "RABBIT_HOLE_V2_RULES"].includes(part)) {
                    console.log("JOINED++")
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext, connectedCount }) => {
                if (["RABBIT_HOLE_RULES", "RABBIT_HOLE_V2_RULES"].includes(part) && raceIdSocket == raceId && !movedToNext) {
                    if (!movedToNext) {
                        console.log("LEAVED")
                        setAmountOfConnected(connectedCount);
                    } else {
                        setReadyToNavigateNext(true);
                    }
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
        if (raceId && socket && race && SCREEN_NAME) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "game2-rules-complete",
                        version
                    });
                    
                    navigate(generateLink(screen, Number(raceId)));
                }
            });

            socket.on('latest-screen', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "game2-rules-complete",
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
    }, [raceId, socket, race, SCREEN_NAME]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
            // socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
        }
    }, [smartAccountAddress, socket, raceId]);


    
    // kick player if page chnages (closes)
    useEffect(() => {
        const handleTabClosing = (e: any) => {
            e.preventDefault();
            socket.disconnect();
        }
        if (smartAccountAddress) {
            window.addEventListener('unload', handleTabClosing);
            return () => {
                window.removeEventListener('unload', handleTabClosing);
            }
        }
    }, [socket, smartAccountAddress, raceId]);
    


    return (
        <div className="mx-auto flex flex-col justify-center items-center w-full bg-cover bg-rabbit_hole_cover_bg bg-bottom relative" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={secondsVisual * 1000} />

            <div className="px-12 pt-4">
                <RHRule1/>
            </div>
            
            <div className="px-12 pt-3">
                <RHRule2/>
            </div>

            <div className="px-12 pt-3">
                <RHRule3/>
            </div>

            <div className="px-12 pt-3">
                <RHRule4/>
            </div>
        </div>
    );
}

