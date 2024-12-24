//import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
//import RibbonLabel from "../../components/RibbonLabel";
//import Rule from "../../components/Rule";
import { useEffect, useState } from "react";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink from "../../utils/linkGetter";
import AnimatedLever from "../../assets/rabbit-hole/level-rules.gif";
import BG_Rules_Slide from "../../assets/rabbit-hole/rules-slide.png";
import InstructionsOne from "../../assets/rabbit-hole/screen-instructions1.png";
import InstructionsTwo from "../../assets/rabbit-hole/screen-instructions2.png";
import TopPageTimer from "../../components/top-page-timer/TopPageTimer";
import { useGameContext } from "../../utils/game-context";
import RibbonLabel from "../../components/RibbonLabel";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "./utils/getGamePart";

export default function RabbitHoleRules() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const {gameState} = useGameContext();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
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
                    if (amount) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
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
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
            socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "rules") });
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
                    property: "game2-rules-complete",
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
        <div className="mx-auto justify-start w-full bg-cover bg-bullrun_rules_bg bg-bottom relative" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={secondsVisual * 1000} />

                <div className="flex w-full justify-center z-50 absolute top-16">
                    <RibbonLabel text="HOW TO PLAY"/>
                </div>
            
                <img src={BG_Rules_Slide} className="w-72 absolute z-10 left-[50%]" style={{ transform: 'translate(-50%, 25%)' }}/>

                <div style={{
                    fontWeight: 700,
                    fontSize: '32px',
                    textAlign: 'center',
                    lineHeight: 1,
                }} className="w-full flex flex-col absolute h-screen top-0">
                    {
                        
                        (() => {
                            // first rule overlay
                            if (timeRemaining - seconds <= 5) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-64 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <span className="absolute max-w-72 text-center self-center text-[40px]">SETUP YOUR SPEED</span>
                                            <p className="absolute w-56 text-center text-[20px] mt-72">MORE SPEED = MORE FUEL CONSUMED</p>
                                            <div className="absolute w-56">
                                                <img src={AnimatedLever} alt="lever" className="w-56 mt-[500px]"/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // second rule overlay
                            if (timeRemaining - seconds <= 5 + 7) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-64 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <span className="absolute max-w-72 text-center self-center text-[40px]">SURVIVE!</span>
                                            <p className="absolute w-56 text-center text-[18px] mt-32">YOU ARE ELIMINATED IF...</p>
                                            <p className="absolute w-56 text-center text-[18px] mt-52">1) YOU ARE THE LAST ONE (SPEED TOO LOW)</p>
                                            <p className="absolute w-56 text-center text-[18px] mt-72">2) YOU RUN OUT OF FUEL</p>
                                            <div className="absolute w-56">
                                                <img src={InstructionsOne} alt="lever" className="w-56 mt-[500px]"/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // third rule overlay (on rh-v2)
                            if (timeRemaining - seconds <= 5 + 7 + 10) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-64 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <span className="absolute w-56 text-center self-center text-[30px] -mt-7">IF YOU'RE LAST AND</span>
                                            <p className="absolute w-56 text-center text-[16px] mt-32">YOUR SPEED IS 4+ POINTS SLOWER THAN THE SECOND-TO-LAST PLAYER:</p>
                                            <p className="absolute w-56 text-center text-[16px] mt-56">YOU SURVIVE AND GAIN +3 FUEL</p>
                                            <p className="absolute w-56 text-center text-[16px] mt-[300px]">SECOND TO LAST ONE DOESN'T CONSUME FUEL</p>
                                            <div className="absolute w-56">
                                                <img src={InstructionsTwo} alt="lever" className="w-56 mt-[500px]"/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })()   
                    }
                </div>
        </div>
    );
}




// OLD RULES

/*
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
    modalIsOpen && modalType === "waiting" && location?.state?.amountOfRegisteredUsers != amountOfConnected &&
    <WaitingForPlayersModal 
        numberOfPlayers={amountOfConnected} 
        numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
    />
}
*/
