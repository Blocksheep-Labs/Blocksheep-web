import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "@/utils/socketio";
import RibbonLabel from "@/components/RibbonLabel";
import Rule from "@/components/Rule";
import { useEffect, useState } from "react";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import { useRaceById } from "@/hooks/useRaceById";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";

const SCREEN_NAME = "UNDERDOG_RULES";

export default function UnderdogRules() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const {gameState} = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [seconds, setSeconds] = useState(1000);
    const {race} = useRaceById(Number(raceId));


    const handleExpire = () => {
        console.log("UPDATE PROGRESS", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game1-rules-complete",
        });
        socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: "game1-rules-complete",
        });

        const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;
        socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
        navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
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
                    setSeconds(expectedTime);
                    restart(time);
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

                if (raceId == raceIdSocket && part == SCREEN_NAME) {
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
                if (part == SCREEN_NAME && raceId == raceIdSocket && !movedToNext) {
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
                    property: "game1-rules-complete",
                });
                navigate(generateLink(screen, Number(raceId)));
            });
            
            socket.on('latest-screen', ({ screen }) => {
                if (screen !== SCREEN_NAME) {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "game1-rules-complete",
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
        <div className="mx-auto flex w-full flex-col bg-race_bg bg-cover bg-bottom" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={seconds * 1000} />
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="HOW TO PLAY"/>
            </div>
            <div className="h-full flex flex-col gap-3 px-10 mt-4">
                <Rule text="SWIPE LEFT OR RIGHT TO ANSWER QUESTIONS"/>
                <Rule text="WIN IF YOU ARE IN THE MINORITY GROUP"/>
                <Rule text="IS IT BETTER TO HAVE NICE OR SMART KIDS?" showExample/>
            </div>
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
    );
}