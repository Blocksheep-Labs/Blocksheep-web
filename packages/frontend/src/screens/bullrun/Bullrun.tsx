import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import Shield from "../../assets/bullrun/defence.png";
import Swords from "../../assets/bullrun/fight.png";
import BullHead from "../../assets/bullrun/run.png";
import WhiteSheep from "../../assets/bullrun/sheeepy.png";
import BlackSheep from "../../assets/bullrun/blacksheep.png";
import Horns from "../../assets/bullrun/bullhorns.png";
import Timer from "../../components/Timer";
import LeftCurtain from "../../assets/bullrun/bullrun-next-round-bg-left.png";
import RightCurtain from "../../assets/bullrun/bullrun-next-round-bg-right.png";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-hook";
import BullrunRulesModal from "../../components/BullrunRulesModal";
import { BULLRUN_distribute, BULLRUN_getPerksMatrix, BULLRUN_getUserChoicesIndexes, BULLRUN_getWinnersPerGame, BULLRUN_makeChoice, getRaceById } from "../../utils/contract-functions";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import shortenAddress from "../../utils/shortenAddress";
import WinModal from "../../components/modals/WinModal";
import { httpGetRaceDataById } from "../../utils/http-requests";
import generateLink from "../../utils/linkGetter";
import { txAttempts } from "../../utils/txAttempts";
import { useGameContext } from "../../utils/game-context";

export type BullrunPerks = "shield" | "swords" | "run";


export default function Bullrun() {
    const {smartAccountAddress, smartAccountClient} = useSmartAccount();
    const navigate = useNavigate();
    const { gameState } = useGameContext();
    const {raceId} = useParams();
    const [selectedPerk, setSelectedPerk] = useState<undefined | number>(-1);

    const refLeftCurtain = useRef<HTMLDivElement>(null);
    const refRightCurtain = useRef<HTMLDivElement>(null);
    const [rulesModalIsOpened, setRulesModalIsOpened] = useState(false);
    const [waitingModalIsOpened, setWaitingModalIsOpened] = useState(false);
    const [winModalIsOpened, setWinModalIsOpened] = useState(false);
    const [amountOfPending, setAmountOfPending] = useState(0);
    const [roundStarted, setRoundStarted] = useState(false);
    const [pointsMatrix, setPointsMatrix] = useState<number[][]>([[0,0,0], [0,0,0], [0,0,0]]);
    const [perksLocked, setPerksLocked] = useState(false);
    const [raceData, setRaceData] = useState<any>(undefined);

    const [status, setStatus] = useState('waiting'); // could be 'playing', 'waiting', or 'finished'
    const [opponent, setOpponent] = useState<{id: string, userAddress: string} | undefined>(undefined);
    const [gamesPlayed, setGamesPlayed] = useState(1);
    const [yourLastPerk, setYourLastPerk] = useState(-1);
    const [lastOpponentPerk, setLastOpponentPerk] = useState(-1);
    const [listOfPreviousPerksByOpponent, setListOfPreviousPerksByOpponent] = useState<any[]>([]);
    const [preloadedScore, setPreloadedScore] = useState(0);
    const [users, setUsers] = useState<any[]>([]);
    const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
    //const [players, setPlayers] = useState([]);


    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, start, pause, resume } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("Time expired.")
            setRoundStarted(true);
        },
        autoStart: false,
    });

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
                
                const time = new Date();
                time.setSeconds(time.getSeconds() + 10);
                restart(time);

                setTimeout(() => {
                    setSelectedPerk(-1);
                    setYourLastPerk(-1);
                    setLastOpponentPerk(-1);
                    setPerksLocked(false);
                    //setOpponent(undefined);
                }, 1500);
            }, 6000);
        }
    }

    

    useEffect(() => {
        if (amountOfPending == 0 && roundStarted) {
            setRoundStarted(false);
            setWaitingModalIsOpened(true);
            console.log("ITS TIME TO FETCH DATA FROM THE CONTRACT!!!")

            txAttempts(
                10,
                async () => {
                    return await BULLRUN_distribute(
                        smartAccountClient,
                        Number(raceId),
                        opponent?.userAddress as string,
                    ).then(() => {
                        console.log("POINTS DISTRIBUTED");
                    })
                },
                3000
            )
            .catch(console.log)
            .finally(() => {
                Promise.all([
                    BULLRUN_getUserChoicesIndexes(smartAccountAddress as string, Number(raceId)),
                    BULLRUN_getUserChoicesIndexes(opponent?.userAddress as string, Number(raceId))
                ]).then((data: any[]) => {
                    console.log({
                        perk1: data[0][data[0].length - 1],
                        perk2: data[1][data[1].length - 1]
                    })
                    setYourLastPerk(Number(data[0][data[0].length - 1]));
                    setLastOpponentPerk(Number(data[1][data[1].length - 1]));
                    closeCurtains();
                    setWaitingModalIsOpened(false);
                    console.log(pointsMatrix)
                });
            });
        }
    }, [amountOfPending, smartAccountAddress, raceId, roundStarted, opponent]);

    const setPending = (isPending: boolean) => {
        socket.emit('bullrun-set-pending', {
            id: socket.id,
            opponentId: opponent?.id,
            raceId,
            userAddress: smartAccountAddress,
            isPending,
        });
    }

    const handlePerkChange = (perk: number) => {
        if (status !== "playing") return;

        pause();
        setPerksLocked(true);
        setPending(true);
        setSelectedPerk(perk);

        txAttempts(
            5,
            async () => {
                return await BULLRUN_makeChoice(
                    smartAccountClient,
                    Number(raceId), 
                    perk,
                    opponent?.userAddress as string
                );
            },
            3000
        )
        .catch(console.log)
        .finally(() => {
            setPending(false);
            resume();
        });
    }

    const handleMoveToNextGame = () => {
        setRulesModalIsOpened(false);
        setWinModalIsOpened(false);
        socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game3-complete",
        });
    }

    // fetch socket data and start timer
    useEffect(() => {
        if (smartAccountAddress && String(raceId).length) {
            httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
                setUsers(data?.race?.users || []);
            });
        }
        start();
    }, [smartAccountAddress, raceId]);

    useEffect(() => {
        if (String(raceId).length && smartAccountAddress) {

            BULLRUN_getPerksMatrix(Number(raceId)).then(data => {
                setPointsMatrix(data as number[][]);
            });
            getRaceById(Number(raceId), smartAccountAddress).then(data => {
                setRaceData(data);
                // On mount, join the game
                // amount of games per player is (N) players - 1: (n - 1);
                socket.emit('bullrun-join-game', { 
                    raceId, 
                    userAddress: smartAccountAddress, 
                    amountOfGamesRequired: Number(data.numberOfPlayersRequired) - 1 
                });
        
                socket.on('bullrun-game-start', ({ opponent }) => {                    
                    // Check if opponent exists
                    if (opponent) {
                        BULLRUN_getUserChoicesIndexes(opponent?.userAddress as string, Number(raceId)).then(data => {
                            setListOfPreviousPerksByOpponent(data as any[]);
                            const time = new Date();
                            time.setSeconds(time.getSeconds() + 10);
                            restart(time);
                    
                            setStatus('playing');
                            setOpponent(opponent);
                            console.log("START: Playing against", opponent);
                        });
                    } else {
                        console.log("START: Waiting for an opponent...");
                        setStatus('waiting');
                        setOpponent(undefined);
                        pause();
                    }
                });

                // Listen for waiting
                socket.on('bullrun-waiting', ({ message }) => {
                    console.log({message});
                    setStatus('waiting');
                    pause();
                });
        
                socket.on('bullrun-game-complete', ({ message }) => {
                    console.log({message});
                    setStatus('finished');
                    pause();
                });

                socket.on('bullrun-game-continue', ({ message }) => {
                    console.log({message});
                    socket.emit('bullrun-join-game', { 
                        raceId, 
                        userAddress: smartAccountAddress, 
                        amountOfGamesRequired: Number(data.numberOfPlayersRequired) - 1 
                    });
                });
        
                socket.on('amount-of-connected', ({ amount, raceId }) => {
                    console.log(`Players connected: ${amount} ${raceId}`);
                });
            });

            return () => {
                socket.off('amount-of-connected');
                socket.off('bullrun-game-complete');
                socket.off('bullrun-waiting');
                socket.off('bullrun-game-start');
                socket.off('bullrun-game-continue');
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
                    if (amountOfPending - 1 >= 0) {
                        setAmountOfPending(prev => prev - 1);
                    }

                    if (amountOfPending - 1 == 0) {
                        console.log("Round ended!")
                        setRoundStarted(false);
                    }
                }
            });

            socket.on('leaved', ({socketId, userAddress, part, raceId: raceIdSocket, movedToNext}) => {
                if (opponent && opponent.id == socketId && part == "BULL_RUN" && raceId == raceIdSocket && !movedToNext) {
                    console.log("OPPONENT LEAVED");
                    if (amountOfPending > 1) {
                        setAmountOfPending(prev => prev - 1);
                    }
                }
            });

            socket.on("progress-updated", async(progress) => {
                console.log("PROGRESS UPDATED SOCKET EVENT:", progress)
                if (progress.property === "game3-complete") {
                  setAmountOfPlayersCompleted(amountOfPlayersCompleted + 1);
                  if (raceData.numberOfPlayersRequired <= amountOfPlayersCompleted + 1) {
                    
                    navigate(generateLink("RACE_UPDATE_3", Number(raceId)));
                  }
                }
            });

            socket.on('bullrun-amount-of-completed-games', ({ gameCompletesAmount }) => {
                console.log({gameCompletesAmount})
                // check if all users completed all the games  [required amount of games per user] * [players amount]
                if (gameCompletesAmount >= Number(raceData?.numberOfPlayersRequired)) {
                    BULLRUN_getWinnersPerGame(Number(raceId)).then((data) => {
                        console.log("Winners data:", data)

                        if (data.firstPlaceUser == smartAccountAddress) {
                            setPreloadedScore(3);
                        }

                        if (data.secondPlaceUser == smartAccountAddress) {
                            setPreloadedScore(2);
                        }

                        if (data.thirdPlaceUser == smartAccountAddress) {
                            setPreloadedScore(1);
                        }

                        setWinModalIsOpened(true);
                    });
                }
            });

            socket.on('joined', ({socketId, userAddress, part, raceId: raceIdSocket, movedToNext}) => {
                if (opponent && opponent.id == socketId && part == "BULL_RUN" && raceId == raceIdSocket && !movedToNext) {
                    console.log("OPPONENT JOINED");
                    setAmountOfPending(prev => prev + 1);
                }
            });

            return () => {
                socket.off('bullrun-pending');
                socket.off('leaved');
                socket.off('bullrun-amount-of-completed-games');
            }
        }
    }, [raceId, smartAccountAddress, opponent, amountOfPending, raceData, amountOfPlayersCompleted]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length && raceData) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "BULL_RUN" });
        }
    }, [smartAccountAddress, socket, raceId, raceData]);


    function endGame() {
        console.log("NEXT OPPONENT >>>>")
        socket.emit('bullrun-game-end', { raceId });
    
        setGamesPlayed(prev => prev + 1);
    
        if (gamesPlayed >= raceData.numberOfPlayersRequired - 1) {
            pause();
            setStatus('finished');
        }
    }

    return (
        <div className="mx-auto flex h-screen w-full flex-col bg-bullrun_bg bg-cover bg-no-repeat bg-center justify-center items-center gap-4 relative">
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
                    replacedText="..."
                    numberOfPlayers={0} 
                    numberOfPlayersRequired={gameState?.amountOfRegisteredUsers || 9}
                />
            }
            {
                winModalIsOpened && 
                <WinModal handleClose={handleMoveToNextGame} raceId={Number(raceId)} preloadedScore={preloadedScore} gameName="bullrun"/>
            }

            <div ref={refLeftCurtain} className="h-full w-[50%] absolute top-0 left-[-50%] z-20">
                <p className="bg-black p-2 opacity-80 text-white z-30 absolute top-[30%] left-0 rounded-l-rone rounded-r-2xl">
                    {users.length && users.find(i => i.address == smartAccountAddress)?.name}
                </p>
                <div className="w-20 h-10 z-50 flex flex-row gap-0 justify-center absolute top-[50%] mt-[85px] right-14 p-2">
                    <div className="w-20 h-10">
                        { yourLastPerk === 2 && <img src={BullHead} alt="bullhead"/> }
                        { yourLastPerk === 1 && <img src={Shield}   alt="shield"/>   }
                        { yourLastPerk === 0 && <img src={Swords}   alt="swords"/>   }
                    </div>
                    <p className="font-bold text-2xl w-full text-center">{yourLastPerk >= 0 ? Number(pointsMatrix[yourLastPerk][lastOpponentPerk]) : "---"}</p>
                </div>
                <div className="h-full w-[100%] bg-black/30 absolute top-0 backdrop-blur-lg"></div>
                <div className="h-full flex items-center justify-end absolute">
                    <img src={LeftCurtain} alt="left-curtain" className="asbolute bottom-0 left-0"/>
                </div>
            </div>
            <div ref={refRightCurtain} className="h-full w-[50%] absolute top-0 right-[-50%] z-20">
                <p className="bg-black p-2 opacity-80 text-white z-30 absolute top-[30%] right-0 rounded-r-rone rounded-l-2xl">
                    {users.length && opponent && users.find(i => i.address == opponent?.userAddress)?.name}
                </p>
                <div className="w-20 h-10 z-50 flex flex-row gap-0 justify-center absolute top-[50%] mt-[85px] left-14 p-2">
                    <p className="font-bold text-2xl w-full text-center">{lastOpponentPerk >= 0 ? Number(pointsMatrix[lastOpponentPerk][yourLastPerk]) : "---"}</p>
                    <div className="w-20 h-10">
                        { lastOpponentPerk === 2 && <img src={BullHead} alt="bullhead"/> }
                        { lastOpponentPerk === 1 && <img src={Shield}   alt="shield"/> }
                        { lastOpponentPerk === 0 && <img src={Swords}   alt="swords"/> }
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

                                if (status === "waiting") {
                                    return "Waiting for player..."
                                }

                                if (opponent?.userAddress) {
                                    return users.length ? users.find(i => i.address == opponent.userAddress)?.name : shortenAddress(opponent.userAddress);
                                }
                            })()
                        }
                    </div>
                    
                    {
                        status === "playing" && listOfPreviousPerksByOpponent.map((i, key) => {
                            return <div key={key} className="flex items-center justify-center border-[1px] border-black p-1">
                                { Number(i) === 2 && <img src={BullHead} alt="bullhead"/> }
                                { Number(i) === 1 && <img src={Shield} alt="shield"/> }
                                { Number(i) === 0 && <img src={Swords} alt="swords"/> }
                            </div>
                        })
                    }
                </div>
            </div>
                
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
                    className={`w-16 h-16 ${selectedPerk === 0 && `bg-green-400 p-2 rounded-lg border-[1px] border-black`} ${(perksLocked || status !== "playing") && 'opacity-50'}`}
                    onClick={!perksLocked ? () => handlePerkChange(0) : undefined}
                />
                <img 
                    src={Shield} alt="shield" 
                    className={`w-16 h-16 ${selectedPerk === 1 && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'} ${(perksLocked || status !== "playing") && 'opacity-50'}`}
                    onClick={!perksLocked ? () => handlePerkChange(1) : undefined}
                />
                <img 
                    src={BullHead} alt="run"  
                    className={`w-16 h-16 ${selectedPerk === 2 && 'bg-green-400 p-2 rounded-lg border-[1px] border-black'} ${(perksLocked || status !== "playing") && 'opacity-50'}`}
                    onClick={!perksLocked ? () => handlePerkChange(2) : undefined}
                />
            </div>
        </div>
    );
}

