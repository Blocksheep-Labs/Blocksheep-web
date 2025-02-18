// React and React-related imports
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";

// Third-party library imports
import { socket } from "../../../utils/socketio";

// Custom hooks and context
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { useGameContext } from "../../../utils/game-context";

// Components
import BullrunRulesModal from "./components/BullrunRulesModal";
import WaitingForPlayersModal from "../../../components/modals/WaitingForPlayersModal";
import WinModal from "../../../components/modals/WinModal";
import Timer from "../../../components/Timer";

// Utilities
import shortenAddress from "../../../utils/shortenAddress";
import generateLink, { TFlowPhases } from "../../../utils/linkGetter";
import { txAttempts } from "../../../utils/txAttempts";
import { httpGetRaceDataById } from "../../../utils/http-requests";

// Assets
import Shield from "../assets/defence.png";
import Swords from "../assets/fight.png";
import BullHead from "../assets/run.png";
import WhiteSheep from "../assets/sheeepy.png";
import BlackSheep from "../assets/blacksheep.png";
import Horns from "../assets/bullhorns.png";
import LeftCurtain from "../assets/bullrun-next-round-bg-left.png";
import RightCurtain from "../assets/bullrun-next-round-bg-right.png";
import { build as buildDistributeData } from "./arguments-builder/distribute";
import { build as buildMakeMoveData } from "./arguments-builder/makeMove";
import { BigNumber } from "ethers";
import { useRaceById } from "../../../hooks/useRaceById";
import { useDistribute } from "../../../hooks/useDistribute";
import { useMakeMove } from "../../../hooks/useMakeMove";
import { useGetUserPoints } from "../../../hooks/useGetPoints";
import { useGetRules } from "../../../hooks/useGetRules";
import { useGetUserChoices } from "../../../hooks/useGetUserChoices";

export type BullrunPerks = "shield" | "swords" | "run";
const REGISTERED_CONTRACT_NAME = "BULLRUN";

export default function Bullrun() {
    const navigate = useNavigate();
    const { smartAccountAddress } = useSmartAccount();
    const { gameState } = useGameContext();
    const { raceId } = useParams();
    const { race: raceData } = useRaceById(Number(raceId));

    const refLeftCurtain = useRef<HTMLDivElement>(null);
    const refRightCurtain = useRef<HTMLDivElement>(null);

    // Modal states
    const [rulesModalIsOpened, setRulesModalIsOpened] = useState(false);
    const [waitingModalIsOpened, setWaitingModalIsOpened] = useState(false);
    const [winModalIsOpened, setWinModalIsOpened] = useState(false);

    // Game state
    const [amountOfPending, setAmountOfPending] = useState(0);
    const [roundStarted, setRoundStarted] = useState(false);
    const [pointsMatrix, setPointsMatrix] = useState<number[][]>([[0,0,0], [0,0,0], [0,0,0]]);
    const [perksLocked, setPerksLocked] = useState(false);
    const [status, setStatus] = useState('waiting'); // could be 'playing', 'waiting', or 'finished'
    const [opponent, setOpponent] = useState<{id: string, userAddress: string} | undefined>(undefined);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [yourLastPerk, setYourLastPerk] = useState(-1);
    const [lastOpponentPerk, setLastOpponentPerk] = useState(-1);
    const [listOfPreviousPerksByOpponent, setListOfPreviousPerksByOpponent] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
    const [addressesCompleted, setAddressesCompleted] = useState<string[]>([]);
    const [latestInteractiveModalWasClosed, setLatestInteractiveModalWasClosed] = useState(false);

    // Connection state
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [holdToSelectWasShown, setHoldToSelectWasShown] = useState(false);
    const [showHoldTip, setShowHoldTip] = useState(false);
    const [opponentPending, setOpponentPending] = useState(false);
    const [isCurtainsClosing, setIsCurtainsClosing] = useState(false);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false); // New state to track submission status

    // Hold state
    const [showHoldText, setShowHoldText] = useState(false);
    const [holdTimeout0, setHoldTimeout0] = useState<NodeJS.Timeout | null>(null);
    const [holdTimeout1, setHoldTimeout1] = useState<NodeJS.Timeout | null>(null);
    const [holdTimeout2, setHoldTimeout2] = useState<NodeJS.Timeout | null>(null);
    const [previewPerk, setPreviewPerk] = useState<number | null>(null);

    // Main methods
    const { distribute } = useDistribute(REGISTERED_CONTRACT_NAME, Number(raceId));
    const { makeMove } = useMakeMove(REGISTERED_CONTRACT_NAME, Number(raceId));
    const { getPoints } = useGetUserPoints(REGISTERED_CONTRACT_NAME, Number(raceId), String(smartAccountAddress));
    const { getRules } = useGetRules(REGISTERED_CONTRACT_NAME, Number(raceId));
    const { getUserChoices } = useGetUserChoices(REGISTERED_CONTRACT_NAME, Number(raceId));


    const redirectToNextScreen = () => {
        const currentScreenIndex = raceData?.screens.indexOf(REGISTERED_CONTRACT_NAME) as number;
        socket.emit('minimize-live-game', { part: REGISTERED_CONTRACT_NAME, raceId });
        navigate(generateLink(raceData?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
    }


    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    // after game finish
    const { totalSeconds: totlaSecondsToMoveNext, restart: restartNextTimer, start: startNextTimer, } = useTimer({
        expiryTimestamp: time,
        autoStart: false,
        onExpire: () => {
            handleMoveToNextGame();
        }
    });

    const { totalSeconds, restart, start, pause, resume, isRunning: timerIsRunning } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("Time expired.")
            setRoundStarted(true);
        },
        autoStart: false,
    });


    const clearTimeouts = () => {
        // Clear the hold timeout if released early
        if (holdTimeout0) {
            clearTimeout(holdTimeout0);
            setHoldTimeout0(null);
        }

        if (holdTimeout1) {
            clearTimeout(holdTimeout1);
            setHoldTimeout1(null);
        }

        if (holdTimeout2) {
            clearTimeout(holdTimeout2);
            setHoldTimeout2(null);
        }
    }
    
    // Handle mouse down (start holding)
    const handleMouseDown = (perk: number) => {
        // Clear the hold timeout if released early
        clearTimeouts();

        pause();
        setShowHoldText(true); // Show text immediately

        // Start full hold timeout (1.5s) for selecting the perk
        const holdDelay = setTimeout(() => {
            handlePerkChange(perk); // Trigger perk selection
        }, 1000);

        switch (perk) {
            case 0:
                setHoldTimeout0(holdDelay);
                break;
            case 1:
                setHoldTimeout1(holdDelay);
                break;
            case 2:
                setHoldTimeout2(holdDelay);
                break;
            default:
                break;
        }
        
    };

    // Handle mouse up (release holding early)
    const handleMouseUp = () => {
        resume();
        setShowHoldText(false); // Hide text immediately

        // Clear the hold timeout if released early
        clearTimeouts();
    };


    const closeCurtains = () => {
        if (refLeftCurtain.current && refRightCurtain.current) {
            setIsCurtainsClosing(true);
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
                
                //const time = new Date();
                //time.setSeconds(time.getSeconds() + 10);
                //restart(time);
                setIsCurtainsClosing(false);
            }, 6000);
        }
    }


    useEffect(() => {
        if (previewPerk !== null && !holdToSelectWasShown) {
            setHoldToSelectWasShown(true);
            setShowHoldTip(true);
            setTimeout(() => {
                setShowHoldTip(false);
            }, 3000);
        } 
    }, [previewPerk, holdToSelectWasShown]);

    

    useEffect(() => {
        if (roundStarted && opponentPending) {
            if (!waitingModalIsOpened) {
                setWaitingModalIsOpened(true);
            }
        }
        
        if (amountOfPending == 0 && roundStarted && !opponentPending) {
            setRoundStarted(false);
            if (!waitingModalIsOpened) {
                setWaitingModalIsOpened(true);
            }

            // Prevent ghost submissions
            if (isSubmitting) return; // Exit if already submitting
            setIsSubmitting(true); // Set submitting flag

            txAttempts(
                3,
                async() => await distribute(buildDistributeData(opponent?.userAddress as string)),
                3000
            )
            .catch(console.log)
            .finally(() => {
                Promise.all([
                    getUserChoices(smartAccountAddress as string),
                    getUserChoices(opponent?.userAddress as string)
                ]).then((data: any[]) => {
                    console.log({
                        perk1: data[0][data[0].length - 1],
                        perk2: data[1][data[1].length - 1]
                    });
                    setYourLastPerk(Number(data[0][data[0].length - 1]));
                    setLastOpponentPerk(Number(data[1][data[1].length - 1]));

                    // Emit event to notify opponent that curtains are closing
                    if (!isCurtainsClosing) {
                        socket.emit('bullrun-curtains-closing', { 
                            toId: opponent?.id,
                            raceId, 
                            userAddress: smartAccountAddress,
                            perkUser: Number(data[0][data[0].length - 1]),
                            perkOpponent: Number(data[1][data[1].length - 1])
                        });
                    }

                    console.log(pointsMatrix);
                }).finally(() => {
                    setIsSubmitting(false); // Reset submitting flag after completion
                });
            });
        }
    }, [amountOfPending, smartAccountAddress, raceId, roundStarted, opponent, isSubmitting, opponentPending]);

    useEffect(() => {
        if (socket && smartAccountAddress && opponent && !isCurtainsClosing) {
            socket.on('bullrun-curtains-closing', ({ raceId: raceIdSocket, userAddress, perkUser, perkOpponent }) => {
                console.log({ 
                    raceId: raceIdSocket, 
                    currentRaceId: raceId, 
                    userAddress, 
                    perkUser, 
                    perkOpponent 
                });

                if (raceIdSocket == raceId) {
                    setIsCurtainsClosing(true);
                    setWaitingModalIsOpened(false);

                    if (userAddress == opponent.userAddress) {
                        // Handle the curtains closing for the opponent
                        console.log("Opponent's curtains are closing.");
                        setYourLastPerk(perkOpponent);
                        setLastOpponentPerk(perkUser);
                        closeCurtains();
                        
                    } else if (userAddress == smartAccountAddress) {
                        console.log("Curtains are closing.");
                        setYourLastPerk(perkUser);
                        setLastOpponentPerk(perkOpponent);
                        closeCurtains();
                    }
                }
            });

            return () => {
                socket.off('bullrun-curtains-closing');
            };
        }
    }, [opponent, smartAccountAddress, socket, isCurtainsClosing]);

    const setPending = (isPending: boolean) => {
        console.log({
            id: socket.id,
            opponentId: opponent?.id,
            raceId,
            userAddress: smartAccountAddress,
            isPending,
        });
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

        txAttempts(
            3,
            async() => await makeMove(buildMakeMoveData(perk, opponent?.userAddress as string)),
            3000
        )
        .catch(console.log)
        .finally(() => {
            setPending(false);
            resume();
        });
    }

    const handleMoveToNextGame = () => {
        setAddressesCompleted([...addressesCompleted, smartAccountAddress as string]);
        setRulesModalIsOpened(false);
        setWinModalIsOpened(false);
        socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "bullrun-complete",
        });
        setLatestInteractiveModalWasClosed(true);
    }

    const bullrunOpenWinModalAndStartTimer = () => {
        if (!winModalIsOpened) {
            setWinModalIsOpened(true);
    
            socket.emit("bullrun-win-modal-opened", { raceId });

            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restartNextTimer(time);
            startNextTimer();
        }
    };

    // fetch socket data and start timer
    useEffect(() => {
        if (smartAccountAddress && String(raceId).length) {
            httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
                setUsers(data?.race?.users || []);
            });
        }
        //start();
    }, [smartAccountAddress, raceId]);

    useEffect(() => {
        if (String(raceId).length && smartAccountAddress && raceData) {
            getRules().then(data => {
                data && setPointsMatrix(
                    data[0].map((row: any[]) => 
                        row.map((value: any) => BigNumber.from(value).toNumber())
                    )
                );
            });
            
            // On mount, join the game
            // amount of games per player is (N) players - 1: (n - 1);
            socket.emit('bullrun-join-game', { 
                raceId, 
                userAddress: smartAccountAddress, 
                amountOfGamesRequired: Number(raceData.numOfPlayersRequired) - 1
            });
    
            socket.on('bullrun-game-start', ({ opponent }) => {                    
                // Check if opponent exists
                if (opponent) {
                    getUserChoices(opponent?.userAddress as string).then(data => {
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
                    amountOfGamesRequired: Number(raceData.numOfPlayersRequired) - 1 
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
    }, [raceId, smartAccountAddress, raceData]);


    useEffect(() => {
        socket.on('amount-of-connected', ({ amount, raceId }) => {
            console.log(`Players connected: ${amount} ${raceId}`);
            setAmountOfConnected(amount);
            // Check if there are no players left
            
            if (amount <= 1 && gamesPlayed > 0 && status !== "playing") {
                // alert(`here! 402, gamesPlayed: ${gamesPlayed}, amount: ${amount}, status: ${status}`)
                setStatus('finished'); 
                bullrunOpenWinModalAndStartTimer(); 
            }
        });

        return () => {
            socket.off('amount-of-connected');
        }
    }, [gamesPlayed, status]);


    // handle pending events
    useEffect(() => {
        if (String(raceId).length && smartAccountAddress) {
            socket.on('bullrun-pending', ({ isPending, userAddress }) => {
                if (isPending) {
                    if (userAddress !== smartAccountAddress) {
                        setOpponentPending(true);
                    }
                    console.log("PENDING++", amountOfPending + 1);
                    setAmountOfPending(prev => prev + 1);
                } else {
                    if (userAddress !== smartAccountAddress) {
                        setOpponentPending(false);
                    }
                    console.log("PENDING--", amountOfPending - 1);
                    if (amountOfPending - 1 >= 0) {
                        setAmountOfPending(prev => prev - 1);
                    }

                    if (amountOfPending - 1 == 0) {
                        console.log("Round ended!");
                        setRoundStarted(false);

                        const time = new Date();
                        time.setSeconds(time.getSeconds() + 1);
                        restart(time);
                    }
                }
            });

            socket.on('leaved', ({socketId, userAddress, part, raceId: raceIdSocket, movedToNext}) => {
                console.log(part == "BULLRUN" && raceId == raceIdSocket && !movedToNext, socketId, opponent)
                if (part == "BULLRUN" && raceId == raceIdSocket && !movedToNext) {
                    socket.emit('get-connected', { raceId });

                    // Check if the opponent has left
                    if (opponent && opponent.id == socketId) {
                        console.log("OPPONENT LEAVED");
                        setAmountOfPending(prev => Math.max(0, prev - 1));
                        setRoundStarted(false);
                    }

                    /*
                    if (!opponent) {
                        const totalRequiredGames = Math.floor((amountOfConnected * (amountOfConnected - 1)) / 2);
                        if (gamesPlayed >= totalRequiredGames) {
                            pause();
                            setStatus('finished');
                        }
                    }
                    */
                }
            });

            socket.on('bullrun-amount-of-completed-games', ({ gameCompletesAmount }) => {
                console.log({
                    "gameCompletesAmount >= amountOfConnected": gameCompletesAmount >= amountOfConnected,
                    amountOfConnected,
                    gameCompletesAmount
                });
                // check if all users completed all the games  [required amount of games per user] * [players amount]
                if (gameCompletesAmount >= amountOfConnected - 1 && amountOfConnected > 0 && gameCompletesAmount > 0) {
                    bullrunOpenWinModalAndStartTimer();
                }
            });

            socket.on('joined', ({socketId, userAddress, part, raceId: raceIdSocket, movedToNext}) => {
                if (part == "BULLRUN" && raceId == raceIdSocket && !movedToNext) {
                    socket.emit('get-connected', { raceId });
                    if (opponent && opponent.id == socketId) {
                        console.log("OPPONENT JOINED");
                        setAmountOfPending(prev => prev + 1);
                    }
                }
            });

            return () => {
                socket.off('bullrun-pending');
                socket.off('leaved');
                socket.off('bullrun-amount-of-completed-games');
                socket.off('joined');
            }
        }
    }, [
        raceId, 
        smartAccountAddress, 
        opponent, 
        amountOfPending, 
        raceData, 
        winModalIsOpened, 
        amountOfConnected, 
        gamesPlayed
    ]);

    useEffect(() => {
        if (String(raceId).length && smartAccountAddress && raceData) {
            socket.on('bullrun-game-counts', ({ gameCounts, raceId: raceIdSocket, gameCompletesAmount }) => {
                console.log({ gameCounts, raceIdSocket, gameCompletesAmount });
    
                if (raceIdSocket == raceId) {
                    // Update games played only if it's increasing
                    if (gameCounts > gamesPlayed) {
                        setGamesPlayed(gameCounts);
                    }
                }
            });

            socket.on('bullrun-win-modal-opened-on-client', ({ raceId: raceIdSocket }) => {
                if (!winModalIsOpened && raceId == raceIdSocket) {
                    bullrunOpenWinModalAndStartTimer();
                }
            });

            socket.on('bullrun-required-games-descreased', ({ raceId: raceIdSocket }) => {
                if (raceId === raceIdSocket) {
                    setGamesPlayed(prev => prev + 1);
                    //setRequiredGames(prev => Math.max(0, prev - 1));
                }
            });


            socket.on("progress-updated", async(progress) => {
                console.log("PROGRESS UPDATED SOCKET EVENT:", progress)
                if (progress.property === "bullrun-complete") {
                    //alert(`COMPLETE++ ${amountOfConnected}, ${amountOfPlayersCompleted + 1}`);
                    console.log( "bullrun-complete", amountOfConnected, amountOfPlayersCompleted + 1)
                    setAmountOfPlayersCompleted(amountOfPlayersCompleted + 1);
                    if (amountOfConnected <= amountOfPlayersCompleted + 1) {
                        //alert(31230);
                        redirectToNextScreen();
                    }
                }
            });

            socket.on("screen-changed", ({ screen }) => {
                navigate(generateLink(screen, Number(raceId)));
            });

            socket.on('race-progress-all', ({progress}) => {
                console.log("RACE PROGRESS BULLRUN:", progress);

                let completedAmount = 0;
                const completedAddrs: string[] = [];
        
                progress.forEach((i: any) => {
                    //console.log("progress:", i.progress.bullrun, i.userAddress)
                    if (i.progress.bullrun.isCompleted) {
                        // track by addresses to block click next btn
                        completedAddrs.push(i.userAddress);
                        completedAmount++;
                    }
                });

                setAddressesCompleted(completedAddrs);
                setAmountOfPlayersCompleted(completedAmount);

                if (amountOfConnected <= amountOfPlayersCompleted && amountOfConnected > 0 && amountOfPlayersCompleted > 0) {
                    //alert(1133);
                    redirectToNextScreen();
                }
            });

            return () => {
                socket.off('bullrun-game-counts');
                socket.off('progress-updated');
                socket.off('screen-changed');
                socket.off('race-progress-all');
                socket.off('bullrun-win-modal-opened-on-client');
                socket.off('bullrun-required-games-descreased');
            }
        }
    }, [
        raceId, 
        smartAccountAddress, 
        raceData, 
        amountOfPlayersCompleted, 
        winModalIsOpened, 
        gamesPlayed, 
        amountOfConnected
    ]);

    // this ensures that connected users will be redirected if someone disconnects on the part of closing the modal
    useEffect(() => {
        if (amountOfPlayersCompleted >= amountOfConnected && amountOfConnected > 0 && amountOfPlayersCompleted > 0) {
          //alert("navigate in useEffect");
          redirectToNextScreen();
        }
    }, [amountOfPlayersCompleted, amountOfConnected]);


    function getPerkPointsColor(perkNumericValue: number) {
        if (perkNumericValue > 0) {
            return 'text-green-600'
        }
        if (perkNumericValue < 0) {
            return 'text-red-600'
        }
        return 'text-black'
    }
     
    
    function endGame() {
        console.log("Trying to find next opponent in 1500ms >>>>")
        setTimeout(() => {
            setYourLastPerk(-1);
            setLastOpponentPerk(-1);
            setPerksLocked(false);

            setPreviewPerk(null);
            //setOpponent(undefined);

            socket.emit('bullrun-game-end', { raceId });
            
            setGamesPlayed(prev => prev + 1);
            
            // Calculate total required games using combination formula
            const totalRequiredGames = Math.floor((amountOfConnected * (amountOfConnected - 1)) / 2);
            if (gamesPlayed + 1 >= totalRequiredGames) {
                pause();
                setStatus('finished');
            }
        }, 1500);
    }
    
    useEffect(() => {
        if (raceId && socket) {
            if (!socket.connected) {
                socket.connect();
            }
            
            socket.on('screen-changed', ({ screen }) => {
                if (screen !== "BULLRUN") {
                    navigate(generateLink(screen, Number(raceId)));
                }
            });

            socket.on('latest-screen', ({ screen }) => {
                if (screen !== "BULLRUN") {
                    socket.emit("update-progress", {
                        raceId,
                        userAddress: smartAccountAddress,
                        property: "bullrun-complete",
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
        if(smartAccountAddress && String(raceId).length && raceData) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "BULLRUN" });
            // socket.emit("get-latest-screen", { raceId, part: "BULLRUN" });
            socket.emit("bullrun-get-game-counts", { raceId, userAddress: smartAccountAddress });
            socket.emit("get-progress-all", { raceId });
        }
    }, [smartAccountAddress, socket, raceId, raceData]);
    
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

    // if amount of connected users is 1, and nobody connects in 5000 seconds,
    // show win modal
    useEffect(() => {
        const tID = setTimeout(() => {
            // on game idle
            if (amountOfConnected === 1 && status !== "playing") {
                console.log("No players to pair, skipping the game...");
                bullrunOpenWinModalAndStartTimer();
            }
        }, 4000);

        return () => {
            clearInterval(tID);
        }
    }, [amountOfConnected, status]);

    return (
        <div className="mx-auto flex w-full flex-col bg-bullrun_bg bg-cover bg-no-repeat bg-center justify-center items-center gap-4 relative" style={{ height: `${window.innerHeight}px` }}>
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
                winModalIsOpened && !addressesCompleted.includes(smartAccountAddress as string) && !latestInteractiveModalWasClosed &&
                <WinModal 
                    handleClose={handleMoveToNextGame} 
                    raceId={Number(raceId)} 
                    secondsLeft={totlaSecondsToMoveNext}
                    getScoreOfTheUser={getPoints}
                />
            }

            {
                showHoldTip &&
                <div className="absolute z-50 bottom-44 p-3 w-52 border-[3px] border-white bg-gray-300 bg-opacity-75 rounded-xl text-black text-center">
                    Hold to confirm
                </div>
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

                <div className="bg-white grid grid-cols-8 grid-rows-[50px_24px] w-[54%] rounded-md">
                    {
                        /*
                            <div className="col-span-2  border-[1px] border-black flex items-center justify-center">
                                <div className="bg-[#eec245] w-10 h-10 rounded-full flex items-center justify-center border-black border-[1px]">1</div>
                            </div> 
                        */
                    }
                    <div 
                        className="rounded-t-lg col-span-8 flex items-center justify-center border-white border-[2px] text-white"
                        style={{
                            background: 'radial-gradient(circle, rgba(2,0,36,1) 0%, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 100%)',
                        }}
                    >
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
                <div className="relative w-20 h-20 bg-gray-200 bg-opacity-75 p-2 rounded-xl shadow-xl border-[1px] border-black">
                    {
                        previewPerk === 0 &&
                        <div 
                            className={`absolute -top-14 left-0 bg-white h-fit w-20 rounded-xl flex flex-row border-[1px] border-black bg-opacity-75 items-center justify-center`}  
                        >
                            <div className="rounded-xl h-fit p-1">
                                <img src={Swords} alt="swords" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[0][0])}`}>{String(pointsMatrix[0][0])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={Shield} alt="shield" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[0][1])}`}>{String(pointsMatrix[0][1])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={BullHead} alt="run" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[0][2])}`}>{String(pointsMatrix[0][2])}</p>
                            </div>
          
                        </div>
                    }
                    <img 
                        src={Swords} alt="swords" 
                        className={`z-10 absolute w-16 h-16 ${(perksLocked || status !== "playing") && 'opacity-50'}`}

                        onClick={(!perksLocked && status == "playing") ? () => setPreviewPerk(0) : undefined}
                        onMouseDown={(!perksLocked && status == "playing" && previewPerk === 0) ? () => handleMouseDown(0) : undefined} 
                        onMouseUp={(!perksLocked && status == "playing" && previewPerk === 0) ? handleMouseUp : undefined} 
                        onTouchStart={(!perksLocked && status == "playing" && previewPerk === 0) ? () => handleMouseDown(0) : undefined} 
                        onTouchEnd={(!perksLocked && status == "playing" && previewPerk === 0) ? handleMouseUp : undefined} 
                    />
                    {
                        previewPerk === 0 &&
                        <div 
                            className={`rounded-xl absolute inset-x-0 bottom-0 transition-all 
                                        ${showHoldText ? 'duration-[1s]' : 'duration-0 bg-transparent'} 
                                        ${holdTimeout0 ? 'opacity-100 bg-gray-600' : 'opacity-0'}`} 
                            style={{ height: holdTimeout0 ? '100%' : '0%', width: '100%' }} 
                        />
                    }
                </div>
                <div className="relative w-20 h-20 bg-gray-200 bg-opacity-75 p-2 rounded-xl shadow-xl border-[1px] border-black">
                    {
                        previewPerk === 1 &&
                        <div 
                            className={`absolute -top-14 left-0 bg-white h-fit w-20 rounded-xl flex flex-row border-[1px] border-black bg-opacity-75 items-center justify-center`}  
                        >
                            <div className="rounded-xl h-fit p-1">
                                <img src={Swords} alt="swords" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[1][0])}`}>{String(pointsMatrix[1][0])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={Shield} alt="shield" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[1][1])}`}>{String(pointsMatrix[1][1])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={BullHead} alt="run" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[1][2])}`}>{String(pointsMatrix[1][2])}</p>
                            </div>
          
                        </div>
                    }
                    <img 
                        src={Shield} alt="shield" 
                        className={`z-10 absolute top-2 w-16 h-16 ${(perksLocked || status !== "playing") && 'opacity-50'}`}

                        onClick={(!perksLocked && status == "playing") ? () => setPreviewPerk(1) : undefined}
                        onMouseDown={(!perksLocked && status == "playing" && previewPerk === 1) ? () => handleMouseDown(1) : undefined}
                        onMouseUp={(!perksLocked && status == "playing" && previewPerk === 1) ? handleMouseUp : undefined} 
                        onTouchStart={(!perksLocked && status == "playing" && previewPerk === 1) ? () => handleMouseDown(1) : undefined} 
                        onTouchEnd={(!perksLocked && status == "playing" && previewPerk === 1) ? handleMouseUp : undefined} 
                    
                    />
                    {
                        previewPerk === 1 &&
                        <div 
                            className={`rounded-xl absolute inset-x-0 bottom-0 transition-all 
                                        ${showHoldText ? 'duration-[1s]' : 'duration-0 bg-transparent'} 
                                        ${holdTimeout1 ? 'opacity-100 bg-gray-600' : 'opacity-0'}`} 
                            style={{ height: holdTimeout1 ? '100%' : '0%', width: '100%' }} 
                        />
                    }
                </div>
                <div className="relative w-20 h-20 bg-gray-200 bg-opacity-75 p-2 rounded-xl shadow-xl border-[1px] border-black">
                    {
                        previewPerk === 2 &&
                        <div 
                            className={`absolute -top-14 left-0 bg-white h-fit w-20 rounded-xl flex flex-row border-[1px] border-black bg-opacity-75 items-center justify-center`}  
                        >
                            <div className="rounded-xl h-fit p-1">
                                <img src={Swords} alt="swords" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[2][0])}`}>{String(pointsMatrix[2][0])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={Shield} alt="shield" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[2][1])}`}>{String(pointsMatrix[2][1])}</p>
                            </div>
                            <div className="rounded-xl h-fit p-1">
                                <img src={BullHead} alt="run" className="w-5 h-5"/>
                                <p className={`w-full text-center text-black ${getPerkPointsColor(pointsMatrix[2][2])}`}>{String(pointsMatrix[2][2])}</p>
                            </div>
          
                        </div>
                    }
                    <img 
                        src={BullHead} 
                        alt="run"
                        className={`z-10 absolute top-1 w-16 h-16 
                                    ${(perksLocked || status !== "playing") ? 'opacity-50' : ''}`}
                                    
                        onClick={(!perksLocked && status == "playing") ? () => setPreviewPerk(2) : undefined}
                        onMouseDown={(!perksLocked && status == "playing" && previewPerk === 2) ? () => handleMouseDown(2) : undefined} 
                        onMouseUp={(!perksLocked && status == "playing" && previewPerk === 2) ? handleMouseUp : undefined} 
                        onTouchStart={(!perksLocked && status == "playing" && previewPerk === 2) ? () => handleMouseDown(2) : undefined} 
                        onTouchEnd={(!perksLocked && status == "playing" && previewPerk === 2) ? handleMouseUp : undefined}
                    />
                    {
                        previewPerk === 2 && (
                            <div 
                                className={`rounded-xl absolute inset-x-0 bottom-0 transition-all 
                                            ${showHoldText ? 'duration-[1s]' : 'duration-0 bg-transparent'} 
                                            ${holdTimeout2 ? 'opacity-100 bg-gray-600' : 'opacity-0'}`} 
                                style={{ height: holdTimeout2 ? '100%' : '0%', width: '100%' }} 
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
}

