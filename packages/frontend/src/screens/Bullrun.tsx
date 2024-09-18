import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import { useSmartAccount } from "../hooks/smartAccountProvider";
import Shield from "../assets/bullrun/defence.png";
import Swords from "../assets/bullrun/fight.png";
import BullHead from "../assets/bullrun/run.png";
import WhiteSheep from "../assets/bullrun/sheeepy.png";
import BlackSheep from "../assets/bullrun/blacksheep.png";
import Horns from "../assets/bullrun/bullhorns.png";
import Timer from "../components/Timer";
import LeftCurtain from "../assets/bullrun/bullrun-next-round-bg-left.png";
import RightCurtain from "../assets/bullrun/bullrun-next-round-bg-right.png";
import { LegacyRef, MutableRefObject, useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-hook";
import BullrunRulesModal from "../components/BullrunRulesModal";
import RaceModal from "../components/RaceModal";
import { BULLRUN_getPerksMatrix, BULLRUN_makeChoice, getRaceById } from "../utils/contract-functions";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import shortenAddress from "../utils/shortenAddress";

export type BullrunPerks = "shield" | "swords" | "run";


export default function Bullrun() {
    const {smartAccountAddress, smartAccountClient} = useSmartAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const {raceId} = useParams();
    const [selectedPerk, setSelectedPerk] = useState<undefined | BullrunPerks>("shield");
    const [opponentsSelectedPerk, setOpponentsSelectedPerk] = useState<undefined | BullrunPerks>(undefined);

    const refLeftCurtain = useRef<HTMLDivElement>(null);
    const refRightCurtain = useRef<HTMLDivElement>(null);
    const [rulesModalIsOpened, setRulesModalIsOpened] = useState(false);
    const [raceModalISOpened, setRaceModalIsOpened] = useState(false);
    const [waitingModalIsOpened, setWaitingModalIsOpened] = useState(false);
    const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [amountOfPending, setAmountOfPending] = useState(0);
    const [sendingTX, setSendingTX] = useState(false);
    const [roundStarted, setRoundStarted] = useState(false);
    const [pointsMatrix, setPointsMatrix] = useState<number[][]>([[0,0,0], [0,0,0], [0,0,0]]);

    const [status, setStatus] = useState('waiting'); // could be 'playing', 'waiting', or 'finished'
    const [opponent, setOpponent] = useState<{id: string, userAddress: string} | undefined>(undefined);
    const [gamesPlayed, setGamesPlayed] = useState(1);
    const [waiting, setWaiting] = useState(false);
    //const [players, setPlayers] = useState([]);


    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, start, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("Time expired.")
            setSendingTX(true);
            setRoundStarted(true);
        },
        autoStart: false,
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

    const closeCurtains = () => {
        if (refLeftCurtain.current && refRightCurtain.current) {
            const leftCurtain = refLeftCurtain.current;
            const rightCurtain = refRightCurtain.current;

            leftCurtain.style.transition = 'all 1s ease-out';
            leftCurtain.style.left = "0px";

            rightCurtain.style.transition = 'all 1s ease-out';
            rightCurtain.style.right = "0px";


            setTimeout(() => {
                leftCurtain.style.left = "-50%";
                rightCurtain.style.right = "-50%";
                
                endGame();
                if (gamesPlayed !== 3) {
                    const time = new Date();
                    time.setSeconds(time.getSeconds() + 10);
                    restart(time);
                }
            }, 6000);
        }
    }

    useEffect(() => {
        if (amountOfPending == 0 && roundStarted) {
            setRoundStarted(false);

            socket.emit('bullrun-set-pending', {
                id: socket.id,
                opponentId: opponent?.id,
                raceId,
                userAddress: smartAccountAddress,
                isPending: true,
                selectedPerk,
            });

            BULLRUN_makeChoice(
                smartAccountClient,
                Number(raceId), 
                selectedPerk as string, 
                0
            ).then(data => {
                setSendingTX(false);
                console.log("MADE CHOICE:", data);
                socket.emit('bullrun-set-pending', {
                    id: socket.id,
                    opponentId: opponent?.id,
                    raceId,
                    userAddress: smartAccountAddress,
                    isPending: false,
                    selectedPerk,
                });

                closeCurtains();
            });
        }
    }, [amountOfPending, smartAccountAddress, raceId, roundStarted, opponent, selectedPerk]);

    const handlePerkChange = (perk: BullrunPerks) => {
        socket.emit('bullrun-set-perk', {
            id: socket.id,
            opponentId: opponent?.id,
            raceId,
            userAddress: smartAccountAddress,
            selectedPerk,
        });
        setSelectedPerk(perk);
    }

    const handleNavigate = () => {
        socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game3-complete",
        });
        navigate(`/race/${raceId}/stats`);
    }

    const fetchRaceData = () => {
        getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
            if (data) {
                let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
                    return { curr: Number(i.progress), delta: 0, address: i.user };
                });
                setProgress(newProgress);
            }
        });
    }

    const handleFinish = () => {
        fetchRaceData();
        setRaceModalIsOpened(true);
    }

    // fetch socket data and start timer
    useEffect(() => {
        // TODO fetch socket data
        start();
    }, []);

    useEffect(() => {
        if (String(raceId).length && smartAccountAddress) {
            BULLRUN_getPerksMatrix(Number(raceId)).then(data => {
                setPointsMatrix(data as number[][]);
            });
            // On mount, join the game
            socket.emit('bullrun-join-game', { raceId, userAddress: smartAccountAddress });
    
            socket.on('bullrun-game-start', ({ opponent }) => {
                const myId = socket.id;
                
                // Check if opponent exists
                if (opponent) {
                    const time = new Date();
                    time.setSeconds(time.getSeconds() + 10);
                    restart(time);
            
                    setStatus('playing');
                    setOpponent(opponent);
                    console.log("START: Playing against", opponent);
                } else {
                    console.log("START: Waiting for an opponent...");
                    setStatus('waiting');
                    setOpponent(undefined);
                }
            });
    
            // Listen for waiting
            socket.on('bullrun-waiting', ({ message }) => {
                console.log("WAITING");
                setStatus('waiting');
                setWaiting(true);
                pause();
                console.log({message});
            });
    
            socket.on('bullrun-game-complete', ({ message }) => {
                console.log("FINSIHED");
                setStatus('finished');
                pause();
                console.log({message});
            });
    
            socket.on('amount-of-connected', ({ amount, raceId }) => {
                console.log(`Players connected: ${amount} ${raceId}`);
            });
    
            return () => {
                socket.off('amount-of-connected');
                socket.off('bullrun-game-complete');
                socket.off('bullrun-waiting');
                socket.off('bullrun-game-start');
            };
        }
    }, [raceId, smartAccountAddress]);

    // handle pending events
    useEffect(() => {
        if (String(raceId).length && smartAccountAddress && opponent) {
            socket.on('bullrun-pending', ({ isPending }) => {
                if (isPending) {
                    console.log("PENDING++", amountOfPending + 1);
                    setAmountOfPending(prev => prev + 1);
                } else {
                    console.log("PENDING--", amountOfPending - 1);
                    setAmountOfPending(prev => prev - 1);

                    if (amountOfPending - 1 == 0) {
                        console.log("Round ended!")
                        setRoundStarted(false);
                    }
                }
            });

            socket.on('bullrun-perk-set', ({ id, opponentId, userAddress, raceId, selectedPerk }) => {
                console.log({id, socketId: socket.id})
                console.log("OPPONENT SELECTED PERK", selectedPerk)
                setOpponentsSelectedPerk(selectedPerk);
            });

            return () => {
                socket.off('bullrun-pending');
                socket.off('bullrun-perk-set');
            }
        }
    }, [raceId, smartAccountAddress, opponent, amountOfPending]);

    function endGame() {
        console.log("NEXT OPPONENT >>>>")
        socket.emit('bullrun-game-end', { raceId });
    
        setGamesPlayed(prev => prev + 1);
    
        if (gamesPlayed >= 7) {
            setStatus('finished');
        }
    }

    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-bullrun_bg bg-cover bg-no-repeat bg-center justify-center items-center gap-4 relative">
            {
                raceModalISOpened
                &&
                <RaceModal
                    disableBtn={false}
                    progress={progress}
                    handleClose={handleNavigate}
                />
            }
            { 
                rulesModalIsOpened 
                && 
                <BullrunRulesModal 
                    pointsMatrix={pointsMatrix}
                    handleClose={() => setRulesModalIsOpened(false)} 
                    timeToStart={totalSeconds.toString()}
                />
            }
            {
                waitingModalIsOpened && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
            }

            <div ref={refLeftCurtain} className="h-full w-[50%] absolute top-0 left-[-50%] z-20">
                <div className="w-20 h-10 z-50 flex flex-row gap-2 justify-center absolute top-[50%] mt-[90px] right-14">
                    <div className="w-20 h-10">
                        { selectedPerk === "run" && <img src={BullHead} alt="bullhead"/> }
                        { selectedPerk === "shield" && <img src={Shield} alt="shield"/> }
                        { selectedPerk === "swords" && <img src={Swords} alt="swords"/> }
                    </div>
                    <p className="font-bold text-2xl w-full text-center">+X</p>
                </div>
                <div className="h-full w-[100%] bg-black/30 absolute top-0 backdrop-blur-lg"></div>
                <div className="h-full flex items-center justify-end absolute">
                    <img src={LeftCurtain} alt="left-curtain" className="asbolute bottom-0 left-0"/>
                </div>
            </div>
            <div ref={refRightCurtain} className="h-full w-[50%] absolute top-0 right-[-50%] z-20 ">
                <div className="w-20 h-10 z-50 flex flex-row gap-2 justify-center absolute top-[50%] mt-[90px] left-14">
                    <p className="font-bold text-2xl w-full text-center">+X</p>
                    <div className="w-20 h-10">
                        { opponentsSelectedPerk === "run" && <img src={BullHead} alt="bullhead"/> }
                        { opponentsSelectedPerk === "shield" && <img src={Shield} alt="shield"/> }
                        { opponentsSelectedPerk === "swords" && <img src={Swords} alt="swords"/> }
                    </div>
                </div>
                <div className="h-full w-[100%] bg-black/30 absolute top-0 backdrop-blur-lg"></div>
                <div className="h-full relative flex items-center justify-end">
                    <img src={RightCurtain} alt="right-curtain" className="asbolute bottom-0 right-0"/>
                </div>
            </div>
            <div className="absolute top-4 w-full flex justify-center flex-col items-center gap-3">
                <Timer seconds={totalSeconds} />

                <div className="bg-white grid grid-cols-8 grid-rows-[50px_24px] w-[54%]">
                    <div className="col-span-2  border-[1px] border-black flex items-center justify-center">
                        <div className="bg-[#eec245] w-10 h-10 rounded-full flex items-center justify-center border-black border-[1px]">1</div>
                    </div>
                    <div className="col-span-6 flex items-center justify-center border-black border-[1px]">
                        {
                            (() => {
                                if (status === "finished") {
                                    return "Finished";
                                }

                                if (opponent?.userAddress) {
                                    return shortenAddress(opponent.userAddress);
                                } else {
                                    return "Waiting for player..."
                                }
                            })()
                        }
                    </div>
                    
                    {

                        //Array(gamesPlayed).fill(0).map((i, key) => {
                        //    return <div key={key} className="flex items-center justify-center border-[1px] border-black">X</div>
                        //})
                    }
                </div>
            </div>
            
            <button 
                onClick={handleFinish}
                className="absolute top-0 right-0 bg-[#eec245] w-28 border-[1px] border-black rounded-xl text-2xl"
            >
                NEXT
            </button>
                
            <div className="absolute top-[45%] right-0 cursor-pointer bg-[#eec245] p-2 rounded-l-full z-10 flex items-center justify-center" onClick={() => setRulesModalIsOpened(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
            </div>

            <div className="relative flex items-center flex-col w-full h-44">
                <img src={Horns} alt="horns" className="w-[80px] top-[30px] absolute"/>
                <img src={WhiteSheep} alt="whitesheep" className="w-10 top-[60px] absolute"/>
            </div>

            <div className="absolute bottom-28 flex w-full">
                <div className="relative flex items-center flex-col w-full h-44">
                    <img src={Horns} alt="horns" className="w-[180px] top-[0px] absolute"/>
                    <img src={BlackSheep} alt="whitesheep" className="w-32 top-[60px] absolute"/>
                </div>
            </div>

            <div className="bottom-2 absolute flex flex-row gap-3 items-center justify-center">
                <img 
                    src={Swords} alt="swords" 
                    className={`w-16 h-16 ${selectedPerk === "swords" && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'}`}
                    onClick={() => handlePerkChange("swords")}
                />
                <img 
                    src={Shield} alt="shield" 
                    className={`w-16 h-16 ${selectedPerk === "shield" && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'}`}
                    onClick={() => handlePerkChange("shield")}
                />
                <img 
                    src={BullHead} alt="run"  
                    className={`w-16 h-16 ${selectedPerk === "run" && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'}`}
                    onClick={() => handlePerkChange("run")}
                />
            </div>
        </div>
    );
}



/*
    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && location.state) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    if (amount === location.state.amountOfRegisteredUsers) {
                        setWaitingModalIsOpened(false);
                    }
                }
            });

            socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
                console.log("JOINED", raceIdSocket, raceId);

                if (raceId == raceIdSocket) {
                    console.log("JOINED++")
                    setAmountOfConnected(amountOfConnected + 1);
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
                        setWaitingModalIsOpened(false);
                    }
                }
            });

            socket.on('leaved', () => {
                console.log("LEAVED")
                setAmountOfConnected(amountOfConnected - 1);
                setWaitingModalIsOpened(true);
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
        setWaitingModalIsOpened(true);
        if (smartAccountAddress && location.state) {
            socket.emit("get-connected", { raceId });
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
            
        }
    }, [socket, raceId, smartAccountAddress, location.state]);
*/