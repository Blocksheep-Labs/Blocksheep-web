//import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../../utils/socketio";
//import RibbonLabel from "../../components/RibbonLabel";
//import Rule from "../../components/Rule";
import { useEffect, useState } from "react";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import generateLink from "../../../utils/linkGetter";
import AnimatedLever from "../../../assets/rabbit-hole/level-rules.gif";
import BG_Rules_Slide from "../../../assets/rabbit-hole/rules-slide.png";
import InstructionsOne from "../../../assets/rabbit-hole/screen-instructions1.png";
import InstructionsTwo from "../../../assets/rabbit-hole/screen-instructions2.png";
import TopPageTimer from "../../../components/top-page-timer/TopPageTimer";
import { useGameContext } from "../../../utils/game-context";
import RibbonLabel from "../../../components/RibbonLabel";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "../utils/getGamePart";
import RHRule1 from "./components/rule-1";
import RHRule2 from "./components/rule-2";
import RHRule3 from "./components/rule-3";
import RHRule4 from "./components/rule-4";

export default function RabbitHoleRules() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const {gameState} = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [secondsVisual, setSecondsVisual] = useState(1000);

    const timeRemaining = version == "v1" ? (6 + 7) : (6 + 7 + 9)
    const time = new Date();
    time.setSeconds(time.getSeconds() + timeRemaining);

    const handleExpire = () => {
        console.log("UPDATE PROGRESS", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-rules-complete",
            version
        });
        socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-rules-complete",
            version
        });

        let redirectLink = '/';

        switch (version) {
            case "v1":
                redirectLink = generateLink("RABBIT_HOLE", Number(raceId)); break;
            case "v2": 
                redirectLink = generateLink("RABBIT_HOLE_V2", Number(raceId)); break;
            default:
                break;
        }

        socket.emit('minimize-live-game', { part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules"), raceId });
        navigate(redirectLink);
    }

    const { totalSeconds, restart, pause, seconds } = useTimer({
        expiryTimestamp: time,
        onExpire: handleExpire,
        autoStart: true
    });


    useEffect(() => {
        if (gameState) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + timeRemaining);
            restart(time);
            setSecondsVisual(timeRemaining);
        }
    }, [gameState]);

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
                if (["RABBIT_HOLE_RULES", "RABBIT_HOLE_V2_RULES"].includes(part) && raceIdSocket == raceId && !movedToNext) {
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
                    property: "game2-rules-complete",
                    version
                });
                
                navigate(generateLink(screen, Number(raceId)));
            });

            socket.on('latest-screen', ({ screen }) => {
                if (screen !== rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules")) {
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
    }, [raceId, socket]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
            socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
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
        <div className="mx-auto justify-start w-full bg-cover bg-rabbit_hole_cover_bg bg-bottom relative" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={secondsVisual * 1000} />

            <div className="px-12 pt-12">
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

