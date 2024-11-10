//import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
//import RibbonLabel from "../../components/RibbonLabel";
//import Rule from "../../components/Rule";
import { useEffect, useState } from "react";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink from "../../utils/linkGetter";
import Timer from "../../components/Timer";
import UserCount from "../../components/UserCount";
import BigDesk from "../../assets/rabbit-hole/signage-instructions.png";
import AnimatedLever from "../../assets/rabbit-hole/level-rules.gif";
import BG_Carrots from "../../assets/rabbit-hole/backgroundcarrot.jpg";
import BG_Tunnel_light from "../../assets/rabbit-hole/tunnel-light.png";
import Rabbit_Head from "../../assets/rabbit-hole/rabbit.png";
import InstructionsOne from "../../assets/rabbit-hole/screen-instructions1.png";
import InstructionsTwo from "../../assets/rabbit-hole/screen-instructions2.png";
import SmallDesk from "../../assets/rabbit-hole/signage-instructions-small.png";
import NewLabel from "../../assets/rabbit-hole/new.png";
import TopPageTimer from "../../components/top-page-timer/TopPageTimer";

export default function RabbitHoleRules() {
    const navigate = useNavigate();
    const {raceId, version} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const [secondsVisual, setSecondsVisual] = useState(1000);

    const timeRemaining = version == "v1" ? (4 + 5) : (4 + 5 + 7)
    const time = new Date();
    time.setSeconds(time.getSeconds() + timeRemaining);

    const { totalSeconds, restart, pause, seconds } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
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

            
            socket.emit('minimize-live-game', { part: 'RABBIT_HOLE_RULES', raceId });
            navigate(redirectLink, {
                state: location.state,
                
            });
            
        },
        autoStart: true
    });


    useEffect(() => {
        if (location.state && amountOfConnected >= location.state.amountOfRegisteredUsers) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + timeRemaining);
            restart(time);
            setSecondsVisual(timeRemaining);
        } else {
            pause();
        }
    }, [amountOfConnected, location.state]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && location.state) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount, rquiredByState: location.state.amountOfRegisteredUsers})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    if (amount >= location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket && part == "RABBIT_HOLE_RULES") {
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
                if (part == "RABBIT_HOLE_RULES" && raceIdSocket == raceId && !movedToNext) {
                    console.log("LEAVED")
                    setAmountOfConnected(amountOfConnected - 1);
                    if (!modalIsOpen) {
                        setModalIsOpen(true);
                    }
                    setModalType("waiting");
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
    }, [socket, raceId, smartAccountAddress, amountOfConnected, location.state]);

    useEffect(() => {
        setModalIsOpen(true);
        setModalType("waiting");
        if (smartAccountAddress && location.state) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, location.state]);


    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "RABBIT_HOLE_RULES" });
        }
    }, [smartAccountAddress, socket, raceId]);


    return (
        <div className="mx-auto justify-start h-screen w-full bg-cover bg-bottom relative">
            <TopPageTimer duration={secondsVisual * 1000} />
            <div className="absolute w-full py-6 z-10 bg-black">
                <Timer seconds={10} />
                <div className="absolute right-4 top-6">
                    <UserCount currentAmount={9} requiredAmount={9}/>
                </div>
            </div>
            
                <img src={BG_Carrots} className="scale-[140%]"/>

                {
                    (() => {
                        // first rule
                        if (timeRemaining - seconds <= 4) {
                            return (
                                <div className="z-30 relative flex flex-col justify-center items-center">
                                    <img src={BG_Tunnel_light} className="z-30 opacity-30"/>
                                    <img src={Rabbit_Head} className="z-30 -right-48 absolute -top-28 w-80 opacity-30"/>
                                    <img src={AnimatedLever} alt="lever" className="w-80 z-50 -mt-20"/>
                                </div>
                            );
                        }

                        // second rule
                        if (timeRemaining - seconds <= 4 + 5) {
                            return (
                                <div className="z-30 relative flex flex-col justify-center items-center">
                                    <img src={InstructionsOne} className="z-30"/>
                                    <img src={AnimatedLever} alt="lever" className="w-80 z-30 opacity-50 -mt-10"/>
                                </div>
                            );
                        }

                        // third rule (on rh-v2)
                        if (timeRemaining - seconds <= 4 + 5 + 7) {
                            return ( 
                                <div className="z-30 relative flex flex-col justify-center items-center">
                                    <img src={InstructionsTwo} className="z-30"/>
                                    <img src={AnimatedLever} alt="lever" className="w-80 z-30 opacity-50 -mt-10"/>
                                </div>
                            );
                        }

                    })()
                }
                

                <div className="absolute top-0 z-20 w-screen h-screen bg-black bg-opacity-70"></div>


                <div style={{
                    fontFamily: "Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: '32px',
                    WebkitTextStroke: '1.1px white',
                    color: 'transparent',
                    textAlign: 'center',
                    lineHeight: 1,
                    textShadow: `
                        3px 3px 3px #8B5E3C,
                        -3px 3px 3px #8B5E3C,
                        3px -3px 3px #8B5E3C,
                        -3px -3px 3px #8B5E3C
                    `,
                    fontStretch: 'condensed',
                }} className="w-full flex flex-col absolute h-screen top-0">
                    {
                        
                        (() => {
                            // first rule overlay
                            if (timeRemaining - seconds <= 4) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-44 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <img src={BigDesk} alt="desk"/>
                                            <span className="absolute max-w-72 text-center self-center text-[40px]">SETUP YOUR SPEED</span>
                                            <p className="absolute max-w-64 text-center text-lg mt-40">MORE SPEED = MORE FUEL CONSUMED</p>
                                        </div>
                                    </div>
                                );
                            }

                            // second rule overlay
                            if (timeRemaining - seconds <= 4 + 5) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-16 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <img src={BigDesk} alt="desk"/>
                                            <span className="-mt-20 absolute max-w-72 text-center text-3xl self-center">SURVIVE!</span>
                                            <span className="mt-6 absolute max-w-72 text-center text-3xl self-center">YOU ARE ELIMINATED IF...</span>
                                            <p className="absolute max-w-64 text-center text-xl mt-40">1) YOU ARE THE LAST ONE (SPEED TOO LOW)</p>
                                        </div>
                                        
                                        <div className="absolute bottom-3 flex items-center justify-center">
                                            <img src={SmallDesk} alt="lever" className="w-72 z-20"/>
                                            <p className="absolute max-w-56 text-center text-lg z-20 mt-2">2) YOU RUN OUT OF FUEL</p>
                                        </div>
                                       
                                    </div>
                                );
                            }

                            // third rule overlay (on rh-v2)
                            if (timeRemaining - seconds <= 4 + 5 + 7) {
                                return (
                                    <div className="relative w-full h-screen flex flex-col items-center mt-16 z-30">
                                        <div className="relative flex items-center justify-center">
                                            <img src={NewLabel} className="absolute right-0 top-5 z-20 w-12" />
                                            <img src={BigDesk} alt="desk"/>
                                            <span className="-mt-28 absolute max-w-56 text-center text-lg self-center">IF YOU'RE LAST AND</span>
                                            <span className="mt-6 absolute max-w-56 text-center text-lg self-center">YOUR SPEED IS 4+ POINTS SLOWER THAN THE SECOND-TO-LAST PLAYER:</span>
                                            <p className="absolute max-w-48 text-center text-lg mt-48">YOU SURVIVE AND GAIN +3 FUEL</p>
                                        </div>
                                        
                                        <div className="absolute bottom-3 flex items-center justify-center">
                                            <img src={NewLabel} className="absolute right-0 -top-3 z-30 w-12" />
                                            <img src={SmallDesk} alt="lever" className="w-72 z-20"/>
                                            <p className="absolute max-w-56 text-center text-lg z-20 mt-2">SECOND TO LAST ONE DOESN'T CONSUME FUEL</p>
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
