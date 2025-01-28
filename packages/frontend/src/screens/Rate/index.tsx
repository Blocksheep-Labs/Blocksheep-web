import { useEffect, useState } from "react";
import RibbonLabel from "@/components/RibbonLabel";
import { useNavigate, useParams } from "react-router-dom";
import generateLink from "@/utils/linkGetter";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { socket } from "@/utils/socketio";
import { useTimer } from "react-timer-hook";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";

const Rating = ({
    handleChange,
    amount
}: {
    handleChange: (value: number) => void;
    amount: number;
}) => {
    return (
        <div className="flex items-center">
            <svg onClick={() => handleChange(1)} className={`w-8 h-8 ms-3 ${amount >= 1 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(2)} className={`w-8 h-8 ms-3 ${amount >= 2 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(3)} className={`w-8 h-8 ms-3 ${amount >= 3 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(4)} className={`w-8 h-8 ms-3 ${amount >= 4 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(5)} className={`w-8 h-8 ms-3 ${amount >= 5 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
        </div>
    );
}

export default function RateScreen() {
    const [underdogRate, setUnderdogRate] = useState(3);
    const [rabbitHoleRate, setRabbitHoleRate] = useState(3);
    const [bullRunRate, setBullruneRate] = useState(3);
    const navigate = useNavigate();
    const {gameState} = useGameContext();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [secondsVisual, setSecondsVisual] = useState(1000);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const handleExpire = () => {
        console.log("UPDATE PROGRESS", {
            raceId,
            userAddress: smartAccountAddress,
            property: `rate`,
        });
        socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: `rate`,
        });

        socket.emit('minimize-live-game', { part: "RATE", raceId });
        navigate(generateLink("STORY_CONCLUSION", Number(raceId)));
    }

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: handleExpire,
        autoStart: true
    });


    useEffect(() => {
        if (gameState) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
            setSecondsVisual(10);
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
                    /*
                    if (amount) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    */
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
                console.log("JOINED", raceIdSocket, raceId);
                if (raceId == raceIdSocket && socketPart == "RATE" ) {
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

            socket.on('leaved', ({ part: partSocket, raceId: raceIdSocket, movedToNext }) => {
                console.log({ part: partSocket, raceId: raceIdSocket, movedToNext });
                if (partSocket == "RATE" && raceId == raceIdSocket) {
                    if (!movedToNext) {
                        console.log("LEAVED")
                        setAmountOfConnected(amountOfConnected - 1);
                        /*
                        if (!modalIsOpen) {
                            setModalIsOpen(true);
                        }
                        setModalType("waiting");
                        */
                    } else {
                        handleExpire();
                    }
                }
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, gameState]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            // setModalIsOpen(true);
            // setModalType("waiting");
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "RATE" });
            socket.emit("get-latest-screen", { raceId, part: "RATE" });
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
                    property: `rate`,
                });
                
                navigate(generateLink(screen, Number(raceId)));
            });

            socket.on('latest-screen', ({ screen }) => {
                if (screen !== "RATE") {
                    socket.emit('update-progress', {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: `rate`,
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
        <div className="relative mx-auto flex w-full flex-col bg-race_bg bg-cover bg-bottom items-center" style={{ height: `${window.innerHeight}px` }}>
            <TopPageTimer duration={secondsVisual * 1000} />
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="RATE THE FUN" smallerText/>
            </div>

            <div className="flex flex-col gap-3 mt-5">
                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">UNDERDOG</p>
                    <Rating handleChange={(value: number) => setUnderdogRate(value)} amount={underdogRate}/>
                </div>

                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">RABBIT HOLE</p>
                    <Rating handleChange={(value: number) => setRabbitHoleRate(value)} amount={rabbitHoleRate}/>
                </div>

                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">BULL RUN</p>
                    <Rating handleChange={(value: number) => setBullruneRate(value)} amount={bullRunRate}/>
                </div>
            </div>

            {
                /*
                location.state.amountOfRegisteredUsers > amountOfConnected && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
                */
            }
        </div>
    );
}