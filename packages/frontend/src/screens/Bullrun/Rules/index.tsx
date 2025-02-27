import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../../utils/socketio";
import { useEffect, useState } from "react";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "../../../utils/linkGetter";
import TopPageTimer from "../../../components/top-page-timer/TopPageTimer";
import { useGameContext } from "../../../utils/game-context";
import BRule1 from "./components/rule-1";
import BRule2 from "./components/rule-2";
import BRule3 from "./components/rule-3";
import BRule4 from "./components/rule-4";
import { useRaceById } from "@/hooks/useRaceById";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";

const SCREEN_NAME = "BULLRUN_RULES";

export default function BullrunRules() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const {gameState} = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [secondsVisual, setSecondsVisual] = useState(1000);
    const {race} = useRaceById(Number(raceId));
    const [readyToNavigateNext, setReadyToNavigateNext] = useState(false);


    const { totalSeconds, restart, pause } = useTimer({
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
                property: "bullrun-rules-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: "bullrun-rules-complete",
            });

            const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;
            socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
            navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
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
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    /*
                    if (amount === gameState.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    */
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket && part == SCREEN_NAME) {
                    console.log("JOINED++")
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
                if (part == SCREEN_NAME && raceId == raceIdSocket && !movedToNext) {
                    if (!movedToNext) {
                        console.log("LEAVED")
                        setAmountOfConnected(amountOfConnected - 1);
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
        //setModalIsOpen(true);
        //setModalType("waiting");
        if (smartAccountAddress && gameState) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, gameState]);
    
    useEffect(() => {
        if (raceId && socket && race) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "game3-rules-complete",
                    });
                    navigate(generateLink(screen, Number(raceId)));
                }
            });
            
            socket.on('latest-screen', ({ screen }) => {
                if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "game3-rules-complete",
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
            //socket.emit("get-latest-screen", { raceId, part: SCREEN_NAME });
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
        <div className="mx-auto flex w-full flex-col bg-bullrun_cover_bg bg-cover bg-bottom items-center justify-center" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={secondsVisual * 1000} />

            <div className="px-12 pt-4">
                <BRule1/>
            </div>

            <div className="px-12 pt-4">
                <BRule2/>
            </div>
        
            <div className="px-12 pt-4">
                <BRule3/>
            </div>

            <div className="px-12 pt-4">
                <BRule4/>
            </div>
        </div>
    );
}