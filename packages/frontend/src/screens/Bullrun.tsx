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
import { getRaceById } from "../utils/contract-functions";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";

export type BullrunPerks = "shield" | "swords" | "run";

const BullrunRulesGGridModal = () => {
    return (
        <div className=""></div>
    );
}

export default function Bullrun() {
    const {smartAccountAddress} = useSmartAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const {raceId} = useParams();
    const [selectedPerk, setSelectedPerk] = useState<undefined | BullrunPerks>(undefined);
    const refLeftCurtain = useRef<HTMLDivElement>(null);
    const refRightCurtain = useRef<HTMLDivElement>(null);
    const [rulesModalIsOpened, setRulesModalIsOpened] = useState(false);
    const [raceModalISOpened, setRaceModalIsOpened] = useState(false);
    const [waitingModalIsOpened, setWaitingModalIsOpened] = useState(false);
    const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
    const [amountOfConnected, setAmountOfConnected] = useState(0);

    const [status, setStatus] = useState('waiting'); // 'waiting', 'playing', 'finished'
    const [matches, setMatches] = useState<any[]>([]); // Current round matches
    const [round, setRound] = useState(1); // Current round number
    const [gamesPlayed, setGamesPlayed] = useState({}); // Track games played per player
    const [waiting, setWaiting] = useState(false);


    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, start, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("Time expired.")
            closeCurtains();
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

                const time = new Date();
                time.setSeconds(time.getSeconds() + 10);
                restart(time);
            }, 6000);
        }
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


    useEffect(() => {
        if (String(raceId).length) {
            // Join the game
            socket.emit('bullrun-join-game', { raceId });

            // Listen for new round pairings
            socket.on('bullrun-new-round', (roundPairs) => {
                setMatches(roundPairs);
                setStatus('playing');
                setRound(prev => prev + 1);
            });

            // Listen for game start
            socket.on('bullrun-game-start', ({ message }) => {
                setStatus('playing');
                setWaiting(false);
            });

            // Listen for waiting
            socket.on('bullrun-waiting', ({ message }) => {
                setStatus('waiting');
                setWaiting(true);
            });

            // Listen for game completion
            socket.on('bullrun-game-complete', ({ message }) => {
                setStatus('finished');
            });

            return () => {
                socket.off('bullrun-new-round');
                socket.off('bullrun-game-start');
                socket.off('bullrun-waiting');
                socket.off('bullrun-game-complete');
            };
        }
    }, [raceId]);

    function endGame() {
        socket.emit('bullrun-game-end', { raceId });
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
                <div className="w-16 h-16 z-50 flex flex-row gap-2 justify-center absolute top-[50%] mt-24">
                    <div className="w-16 h-16">
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
                <div className="w-16 h-16 z-50 flex flex-row gap-2 justify-center absolute top-[50%] mt-24">
                    <p className="font-bold text-2xl w-full text-center">+X</p>
                    <div className="w-16 h-16">
                        { selectedPerk === "run" && <img src={BullHead} alt="bullhead"/> }
                        { selectedPerk === "shield" && <img src={Shield} alt="shield"/> }
                        { selectedPerk === "swords" && <img src={Swords} alt="swords"/> }
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
                        0xioaJHDI8WUAKLD
                    </div>

                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
                    <div className="flex items-center justify-center border-[1px] border-black">X</div>
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
                    onClick={() => setSelectedPerk("swords")}
                />
                <img 
                    src={Shield} alt="shield" 
                    className={`w-16 h-16 ${selectedPerk === "shield" && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'}`}
                    onClick={() => setSelectedPerk("shield")}
                />
                <img 
                    src={BullHead} alt="run"  
                    className={`w-16 h-16 ${selectedPerk === "run" && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'}`}
                    onClick={() => setSelectedPerk("run")}
                />
            </div>
        </div>
    );
}