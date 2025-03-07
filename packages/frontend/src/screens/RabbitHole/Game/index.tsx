import "../assets/css/index.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";

// Components - Game UI
import PlayerMovement from "./components/PlayerMovement";
import Darkness from "./components/Darkness";
import RabbitHead from "./components/RabbitHead";
import RabbitTail from "./components/RabbitTail";
import Timer from "../../../components/Timer";
import UserCount from "../../../components/UserCount";

// Components - Modals
import WinModal from "../../../components/modals/WinModal";
import LoseModal from "../../../components/modals/LoseModal";

// Web3 and Contract
import { useSmartAccount } from "../../../hooks/smartAccountProvider";


// Socket and HTTP
import { socket } from "../../../utils/socketio";
import { httpGetRaceDataById } from "../../../utils/http-requests";

// Game Logic
import generateLink, { TFlowPhases } from "../../../utils/linkGetter";
import { txAttempts } from "../../../utils/txAttempts";
import calculatePlayersV1 from "./calculations/v1";
import calculatePlayersV2 from "./calculations/v2";
import { useGameContext } from "../../../utils/game-context";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "../utils/getGamePart";

// Assets
import BlackSheep from "../assets/images/blacksheep.png";
import WhiteSheep from "../assets/images/sheeepy.png";
import BG_Carrots from "../assets/images/backgroundcarrot.jpg";


import { CarrotBasket, CarrotBasketIncrement } from "./components/basket";
import { CircularProgress } from "./components/CircularProgress";
import { useMakeMove } from "@/hooks/useMakeMove";
import { useDistribute } from "@/hooks/useDistribute";
import { useGetUserPoints } from "@/hooks/useGetPoints";
import { useGetRules } from "@/hooks/useGetRules";
import { useRaceById } from "@/hooks/useRaceById";
import { build as buildmakeMoveData } from "./arguments-builder/makeMove";
import { build as buildDistributeData } from "./arguments-builder/distribute";
import { sheepImages } from "@/utils/sheepsImagesArray";


export type ConnectedUser = {
    id: number;
    address: string; 
    src: string; 
    PlayerPosition: number; 
    Fuel: number;
    maxAvailableFuel: number;
    isEliminated: boolean;
    isCompleted: boolean;
    name: string;
}

export type RabbitHolePhases = "Default" | "CloseTunnel" | "OpenTunnel" | "Reset" | "Fall";

const REGISTERED_CONTRACT_NAME = "RABBITHOLE";


function RabbitHoleGame() {
  const { smartAccountAddress, smartAccountClient } = useSmartAccount();
  const { gameState } = useGameContext();
  const navigate = useNavigate();
  // const navigate = (a: string, b?: any) => {}
  const { raceId, version } = useParams();
  const GAME_NAME_SCREEN = rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game")
  const { race } = useRaceById(Number(raceId));

  // Game state
  const [phase, setPhase] = useState<RabbitHolePhases>("Default");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [roundIsFinished, setRoundIsFinsihed] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);

  // Player states
  const [players, setPlayers] = useState<ConnectedUser[]>([]);
  const [userIsLost, setUserIsLost] = useState(false);
  const [maxFuel, setMaxFuel] = useState(version == "v1" ? 10 : 20);
  const [isRolling, setIsRolling] = useState(false);
  const [lastEliminatedUserAddress, setLastEliminatedUserAddress] = useState("");
  const [leavedPlayers, setLeavedPlayers] = useState<string[]>([]);

  // Player counts
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [amountOfPending, setAmountOfPending] = useState(0);
  const [amountOfComplteted, setAmountOfComplteted] = useState(0);
  const [amountOfPlayersnextClicked, setAmountOfPlayersNextClicked] = useState(0);


  // UI states
  const [displayNumber, setDisplayNumber] = useState(0);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [loseModalPermanentlyOpened, setLoseModalPermanentlyOpened] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);
  const [latestInteractiveModalWasClosed, setLatestInteractiveModalWasClosed] = useState(false);

  // Transaction tracking
  const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(new Set());
  const [animationsTriggered, setAnimationsTriggered] = useState(false);
  const [playersNextClicked, setPlayersNextClicked] = useState<Set<string>>(new Set());

  const [whoStoleIsShowed, setWhoStoleIsShowed] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const { makeMove } = useMakeMove(REGISTERED_CONTRACT_NAME, Number(raceId));
  const { distribute } = useDistribute(REGISTERED_CONTRACT_NAME, Number(raceId));
  const { getPoints } = useGetUserPoints(REGISTERED_CONTRACT_NAME, Number(raceId), String(smartAccountAddress));
  const { getRules } = useGetRules(REGISTERED_CONTRACT_NAME, Number(raceId));

  const navigateToNextScreen = () => {
    console.log("NAV_current:", GAME_NAME_SCREEN)
    const currentScreenIndex = race?.screens.indexOf(GAME_NAME_SCREEN) as number;
    socket.emit('minimize-live-game', { part: GAME_NAME_SCREEN, raceId });
    navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
  }
  
  const time_5 = new Date();
  time_5.setSeconds(time_5.getSeconds() + 5);

  const time_10 = new Date();
  time_10.setSeconds(time_10.getSeconds() + 10);

  useEffect(() => {
    //console.log({phase, players})
  }, [phase, players])

  // after game finish
  const { totalSeconds: totlaSecondsToMoveNext, restart: restartNextTimer, start: startNextTimer, } = useTimer({
    expiryTimestamp: time_10,
    autoStart: false,
    onExpire: () => closeWinLoseModal()
  });

  // in-game
  const { totalSeconds, restart, start, pause, resume, isRunning: timerIsRunning } = useTimer({
    expiryTimestamp: time_5,
    onExpire: () => {
      handleTunnelChange(); 
    },
    autoStart: false,
  });


  // in-game timer 10s on closedTunnel
  const { 
    totalSeconds: totalSecondsOnClosedTimer, 
    restart: restartTimerOnClosedTunnel, 
    start: startTimerOnClosedTunnel, 
    pause: pauseTimerOnClosedTunnel, 
    resume: resumeTimerOnClosedTunnel, 
    isRunning: timerOnClosedTunnelIsRunning 
  } = useTimer({
    expiryTimestamp: time_10,
    onExpire: () => {
      setIsCountingDown(false);
      setIsRolling(true); 
    },
    autoStart: false,
  });


  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    if (
      !loseModalPermanentlyOpened && 
      !winModalPermanentlyOpened && 
      gameState && 
      amountOfConnected
    ) {
      if (!gameStarted && gameState && amountOfConnected && start) {
        setGameStarted(true);

        !timerIsRunning && resume();
        !isRolling && start();
      }
    }
  }, [amountOfConnected, start, pause, modalIsOpen, isRolling, raceId, gameState]);

  useEffect(() => {
    if (totalSeconds > 0) {
      socket.emit('rabbithole-set-tunnel-state', {
        raceId, 
        secondsLeft: totalSeconds,
        addRoundsPlayed: 0,
      });
      socket.emit("rabbithole-get-all-fuel-tunnel", { raceId });
    }
  }, [totalSeconds]);

  // handle socket events
  useEffect(() => {
    const tryToProcessAnimations = (pending: number, currentPhase: string) => {
      console.log("Try to process reset animations...", { pending, currentPhase, canExecute: pending === 0 && currentPhase == "CloseTunnel" })
      if (pending === 0 && currentPhase == "CloseTunnel") {
        console.log("All transactions processed.");
        socket.emit("rabbithole-tunnel-started", { raceId });
        triggerAnimationsReset();
      }
    }

    if (smartAccountAddress && gameState) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        //console.log("AMOUNT OF CONNECTED", amount)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
        if (raceId == raceIdSocket && ["RABBIT_HOLE", "RABBIT_HOLE_V2"].includes(part)) {
          //console.log("JOINED")
          setAmountOfConnected(prev => {
            const newAmount = prev + 1;
            if (newAmount >= 1) {
              setIsOpen(false);
            }
            return newAmount;
          });
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', (data) => {
        //alert(`LEAVED: ${data.raceId} | ${raceId} ${data.raceId == raceId} | in: ${["RABBIT_HOLE", "RABBIT_HOLE_V2"].includes(data?.part)}`)
        if (data.raceId == raceId && ["RABBIT_HOLE", "RABBIT_HOLE_V2"].includes(data?.part)) {
          setAmountOfPending(prev => Math.max(0, prev - 1));
          setAmountOfConnected(prev => {
            if (data?.connectedCount >= 0) {
              return data.connectedCount;
            } else {
              return Math.max(0, prev - 1);
            }
          });
          setAmountOfPlayersNextClicked(prev => Math.max(0, prev - 1));
          setLeavedPlayers(prev => {
            prev.push(data.userAddress);
            console.log({ LEAVED_USER: data.userAddress })
            return prev;
          });

          if (pendingTransactions.size > 0) {
            // remove from pending transactions
            const newSet = new Set(pendingTransactions);
            newSet.delete(data?.userAddress);
            setPendingTransactions(newSet);

            // check if all transactions are processed
            const pendingCount = newSet.size;
            //console.log("Pending transactions:", pendingCount);

            tryToProcessAnimations(pendingCount, phase);
          }
        }
      });
      
      socket.on("rabbithole-race-fuel-all-tunnel", async(progress) => {
        const usersData = progress.progresses;

        let amountPendingPerGame2 = 0;
        let amountOfCompleted = 0;

        usersData.forEach((i: {
          userAddress: string,
          v1: {
            fuel: number, 
            maxAvailableFuel: number, 
            gameReached: boolean, 
            isPending: boolean, 
            isCompleted: boolean
          },
          v2: {
            fuel: number, 
            maxAvailableFuel: number, 
            gameReached: boolean, 
            isPending: boolean, 
            isCompleted: boolean
          }
        }) => {
          // @ts-ignore
          i.rabbithole?.[version].game.isPending && amountPendingPerGame2++;
          // @ts-ignore
          i.rabbithole?.[version].game.isCompleted && amountOfCompleted++;
        });

        setAmountOfComplteted(amountOfCompleted);

        // set players list
        const raceData = await httpGetRaceDataById(`race-${raceId}`);
        setPlayers(prevPlayers => {
          const updatedPlayers = [...prevPlayers];

          const usersSheeps: Map<string, number> = new Map(Object.entries(raceData.data.race.usersSheeps));
          
          usersData.forEach((i: any) => {
            const user = raceData.data.race.users.find((j: any) => j.address == i.userAddress);
            // @ts-ignore
            const dataByTunnelVersion = i.rabbithole?.[version];
            
            const existingPlayerIndex = updatedPlayers.findIndex(p => p.address === i.userAddress);
            const updatedPlayer = {
              id: existingPlayerIndex !== -1 ? updatedPlayers[existingPlayerIndex].id : updatedPlayers.length,
              address: i.userAddress,
              src: sheepImages[usersSheeps.get(i.userAddress as string) || 0], // i.userAddress === smartAccountAddress ? BlackSheep : WhiteSheep,
              PlayerPosition: dataByTunnelVersion.game.fuel / 9,
              Fuel: dataByTunnelVersion.game.fuel,
              maxAvailableFuel: dataByTunnelVersion.game.maxAvailableFuel,
              isEliminated: dataByTunnelVersion.game.isEliminated,
              isCompleted: dataByTunnelVersion.game.isCompleted,
              name: user?.name || "Newbie"
            };
      
            if (existingPlayerIndex !== -1) {
              updatedPlayers[existingPlayerIndex] = updatedPlayer;
            } else {
              updatedPlayers.push(updatedPlayer);
            }
          });

          //console.log(updatedPlayers.map(i => ({userAddress: i.address, eliminated: i.isEliminated, completed: i.isCompleted})));
          console.log("SET_PLAYERS", updatedPlayers.toSorted((a, b) => a.id - b.id))

          return updatedPlayers.sort((a, b) => a.id - b.id);
        });
      });
      

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "rabbithole-eliminate") {
          if (pendingTransactions.size > 0) {
            // remove from pending transactions
            const newSet = new Set(pendingTransactions);
            newSet.delete(progress.userAddress);
            setPendingTransactions(newSet);

            // check if all transactions are processed
            const pendingCount = newSet.size;
            //console.log("Pending transactions:", pendingCount);

            tryToProcessAnimations(pendingCount, phase);
          }
        }

        if (progress.property === "rabbithole-set-fuel") {
          if (!isRolling) {
            return;
          }

          if (progress.value.isPending) {
            // add to pending transactions
            setPendingTransactions(prev => new Set(prev).add(progress.userAddress));
          } else {
            // remove from pending transactions
            const newSet = new Set(pendingTransactions);
            newSet.delete(progress.userAddress);
            setPendingTransactions(newSet);

            //console.log("PENDING TXS:", newSet, newSet.size)
            // check if all transactions are processed
            const pendingCount = newSet.size;
            //console.log("Pending transactions:", pendingCount);
            tryToProcessAnimations(pendingCount, phase);
          }
        }

        if (progress.property === "rabbithole-complete") {
          //if (amountOfComplteted + 1 >= amountOfConnected) {
          //  await distribute(buildDistributeData());
          //} else {
            setAmountOfComplteted(amountOfComplteted + 1);
          //}
        }

        if (progress.property === "rabbithole-wait-to-finish") {
          // Check if the player has already clicked next
          if (!playersNextClicked.has(progress.userAddress)) {
            // Create a new Set to avoid mutating the existing state directly
            const updatedPlayersNextClicked = new Set(playersNextClicked);
            // Add the user to the new Set
            updatedPlayersNextClicked.add(progress.userAddress);
            // Update the state with the new Set
            setPlayersNextClicked(updatedPlayersNextClicked);
            // Increment the count based on the new Set size
            setAmountOfPlayersNextClicked(updatedPlayersNextClicked.size); // Use the size of the new Set
            
            if (updatedPlayersNextClicked.size >= amountOfConnected) { // Check against the updated count
              navigateToNextScreen();
            }
          }

        }
      });


      socket.on('rabbithole-tunnel-started-on-client', ({ socketId, raceId: raceIdSocket }) => {
        if (phase == "CloseTunnel" && raceId == raceIdSocket && pendingTransactions.size > 0) {
          console.log(`Trying to trigger animations as on one of clients (${socketId}) the tunnel was already started.`)
          setPendingTransactions(new Set());
          triggerAnimationsReset();
        }
      });

      socket.on('race-progress-all', ({ progress }) => {
        let amountOfNextClicked = 0;
        const playersClickedNextAddrs: string[] = [];
        progress.forEach((i: any) => {
          if (i.progress.rabbithole.waitingToFinish) {
            playersClickedNextAddrs.push(i.userAddress);
            amountOfNextClicked++;
          }
        });

        if (amountOfNextClicked > 0 && amountOfNextClicked >= amountOfConnected) {
          pause();
        }

        setAmountOfPlayersNextClicked(amountOfNextClicked);
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('rabbithole-race-fuel-all-tunnel');
        socket.off('progress-updated');
        socket.off('rabbithole-tunnel-started-on-client');
        socket.off('race-progress-all');
      }
    }
  }, [
    socket, 
    amountOfConnected, 
    smartAccountAddress, 
    amountOfComplteted, 
    gameState, 
    amountOfPlayersnextClicked, 
    playersNextClicked,
    amountOfPending, 
    gameCompleted,
    isRolling,
    pendingTransactions,
    phase,
    roundIndex
  ]);


  // this ensures that connected users will be redirected if someone disconnects on the part of closing the modal
  useEffect(() => {
    if (amountOfPlayersnextClicked >= amountOfConnected && amountOfPlayersnextClicked > 0 && amountOfConnected > 0) {
      navigateToNextScreen();
    }
  }, [ amountOfConnected, amountOfPlayersnextClicked ]);
  

  
  useEffect(() => {
    if (raceId && socket && race && GAME_NAME_SCREEN) {
        if (!socket.connected) {
            socket.connect();
        }
        
        socket.on('screen-changed', ({ screen }) => {
          if (race.screens.indexOf(screen) > race.screens.indexOf(GAME_NAME_SCREEN)) {
            navigate(generateLink(screen, Number(raceId)));
          }
        });

        socket.on('latest-screen', ({ screen }) => {
            if (race.screens.indexOf(screen) > race.screens.indexOf(GAME_NAME_SCREEN)) {
              // alert(`complete 508 ${screen}, ${rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game")}`)
              socket.emit("update-progress", {
                raceId,
                userAddress: smartAccountAddress,
                property: "rabbithole-complete",
                value: {
                  isWon: false,
                  pointsAllocated: 0,
                },
                version,
              });
              navigate(generateLink(screen, Number(raceId)));
            }
        });

        return () => {
            socket.off('screen-changed');
            socket.off('latest-screen');
        }
    }
  }, [raceId, socket, race, GAME_NAME_SCREEN]);


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && gameState) {
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit("rabbithole-reach", { raceId, userAddress: smartAccountAddress })
      socket.emit("rabbithole-get-all-fuel-tunnel", { raceId });
    }
  }, [smartAccountAddress, socket, raceId, gameState]);


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length) {
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game") });
        // socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game") });
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
  }, [openLoseModal, socket, smartAccountAddress, raceId]);


  // CHECK USER TO BE REGISTERED
  useEffect(() => {
    if (smartAccountAddress && race && socket) {
      // VALIDATE USER FOR BEING REGISTERED
      if (!race.registeredUsers.includes(smartAccountAddress)) {
        if (socket.connected) {
          socket.disconnect();
        }
        alert('Not registered!');
        navigate('/', { replace: true });
      }
    }
  }, [race, smartAccountAddress, socket]);


  const triggerAnimations = async () => {
    if (animationsTriggered) return;
    setAnimationsTriggered(true);
  
    // Close tunnel: Head moves to swallow everything.
    socket.emit('rabbithole-set-tunnel-state', {
      raceId,
      secondsLeft: 0,
      addRoundsPlayed: 1,
      gameState: "close",
    });
    
    console.log("CLOSE_TUNNEL");
    setPhase("CloseTunnel");
    
    setTimeout(() => {
      setIsCountingDown(true);

      const time_10 = new Date();
      time_10.setSeconds(time_10.getSeconds() + 10);

      restartTimerOnClosedTunnel(time_10);
    }, 2000);
  };

  // send tx after the 10sec timer on closed tunnel
  useEffect(() => {
      //console.log({ "!isCountingDown": !isCountingDown, isRolling, "!gameOver": !gameOver })
      if (!isCountingDown && isRolling && !gameOver) {
        const execTx = async() => {
          socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "rabbithole-set-fuel",
            value: {
              fuel: displayNumber,
              maxAvailableFuel: maxFuel - displayNumber,
              isPending: true,
            },
            version,
          });
          
          console.log("Submitting fuel, leaved players:", leavedPlayers);
          try {
            await txAttempts(
              3,
              async () => await makeMove(
                buildmakeMoveData(
                  displayNumber, 
                  maxFuel - displayNumber, 
                  roundIndex, 
                  smartAccountAddress as string,
                  leavedPlayers
                )),
              3000
            );
          } catch (error) {
            console.error("Transaction failed:", error);
            // setIsRolling(false); // Reset if transaction fails
          } finally {
            setTimeout(() => {
              socket.emit("update-progress", {
                raceId,
                userAddress: smartAccountAddress,
                property: "rabbithole-set-fuel",
                value: {
                  fuel: displayNumber,
                  maxAvailableFuel: maxFuel - displayNumber,
                  isPending: false,
                },
                version,
              });  
            }, 1500 + Number(players.find(i => i.address == smartAccountAddress)?.id) * 350);
          }
        } 

        execTx();
      }

      // WARNING!! -> in testing!!!
      if (!isCountingDown && isRolling && gameOver && amountOfConnected <= 1 && userIsLost) {
        // if user is one in race and eliminated, go on with animations without waiting for other (leaved) players
        console.log('user is one in race and eliminated, go on with animations without waiting for other (leaved) players');
        setTimeout(() => {
          triggerAnimationsReset();
        }, 1500);
      }
  }, [ 
    isCountingDown, 
    isRolling, 
    gameOver, 
    amountOfConnected, 
    maxFuel, 
    displayNumber, 
    smartAccountAddress,
    userIsLost,
    leavedPlayers
  ]);

  // Reset animationsTriggered when a new round starts
  useEffect(() => {
    if (roundIsFinished) {
      setAnimationsTriggered(false);
    }
  }, [roundIsFinished]);

  const triggerAnimationsReset = async() => {
    socket.emit("rabbithole-get-all-fuel-tunnel", { raceId });

    setTimeout(() => {
      // Open tunnel: cars get out
      socket.emit('rabbithole-set-tunnel-state', {
        raceId,
        secondsLeft: 0,
        addRoundsPlayed: 0,
        gameState: "open",
      });
      console.log("OPEN_TUNNEL");
      setPhase("OpenTunnel");
      
      // this 2 state updates emitting the useEffect which calculates user fuels...
      setRoundIsFinsihed(true);
      setIsRolling(false);
    }, 1500);
  }


  const handleFuelUpdate = (fuel: number) => {
                                                    // && isCountingDown
    if (!isRolling && !gameOver && fuel <= maxFuel) {
      
      setDisplayNumber(fuel);
      
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "rabbithole-set-fuel",
        value: {
          fuel: fuel,
          maxAvailableFuel: maxFuel - fuel,
          isPending: false,
        },
        version,
      });
    }
  }

  const handleTunnelChange = async () => {
    //console.log("handleTunnelChange - start");
    await triggerAnimations(); 
  };

  useEffect(() => {
    if (players && !isRolling && roundIsFinished) {
      setRoundIsFinsihed(false);
      console.log(`Calculate players, current round ${roundIndex}, raceId: ${raceId}`);
      calculateSubmittedFuelPerPlayers(players, gameOver, roundIndex, raceId as string);
    }
  }, [isRolling, players, roundIsFinished, gameOver, roundIndex, raceId, leavedPlayers]);


  const handleFinishTunnelGame = async(
    raceId: string, 
    isWon: boolean, 
    amountOfPointsToAllocate: number, 
  ) => {    
    if (!gameOver) {
      setGameOver(true);
      setTimeout(() => {
        !isWon && setUserIsLost(true);
      }, 3000);

      // alert("complete 786")
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "rabbithole-complete",
        value: {
          isWon,
          pointsAllocated: amountOfPointsToAllocate,
        },
        version,
      });
    }

    if (!gameCompleted) {
      setGameCompleted(true);
      console.log("FINISH TUNNEL GAME:", {raceid: Number(raceId), isWon, smartAccountClient, amountOfPointsToAllocate})

      // try to recall tx sending on error
      txAttempts(
        3, 
        async() => await distribute(buildDistributeData(smartAccountAddress as string)),
        3000
      )
      .catch(console.log)
      .finally(() => {
        if (isWon) {
          openWinModal();
        } else {
          openLoseModal();
        }
      });
    }
  }


  // function that will end the game for the user with the lowest fuel amount
  const calculateSubmittedFuelPerPlayers = async(players: ConnectedUser[], isGameOver: boolean, roundIndex: number, raceId: string) => {
    //console.log({ players, isGameOver })
    let newListOfPlayers: ConnectedUser[] = [];
    let bonuses: {address: string, amount: number}[] = [];

    switch (version) {
      case "v1":
        newListOfPlayers = (await calculatePlayersV1(players, roundIndex, Number(raceId))).newListOfPlayers;
        break;
      case "v2":
        const calculationResult = calculatePlayersV2(players);
        newListOfPlayers = calculationResult.newListOfPlayers;
        bonuses = calculationResult.bonuses;
        break;
      default:
        break;
    }

    console.log("NEW LIST OF PLAYERS:", newListOfPlayers, newListOfPlayers.map(i => i.address).includes(smartAccountAddress as string));
    // update Player List By Eliminating them
    players.forEach(player => {
      if (!newListOfPlayers.map(i => i.address).includes(player.address)) {
        // CURRENTLY ELIMINATING USER WITH player.address
        setLastEliminatedUserAddress(player.address);

        // remove eliminated player from the list of leaved players, as we dont care about him/her anymore
        setLeavedPlayers(prev => {
          console.log({prevLeavedPlayers: prev});
          const newLeavedPlayers = prev.filter(i => i.toLowerCase() != player.address.toLowerCase());
          console.log({newLeavedPlayers});
          return newLeavedPlayers;
        });

        if (!player.isEliminated) {
          console.log("ELIMINATE!", player.address, player.Fuel)
          socket.emit("update-progress", {
            raceId,
            userAddress: player.address,
            property: "rabbithole-eliminate",
            version,
          });
        }

        if (!player.isCompleted) {
          console.log("COMPLETE!", player.address, player.Fuel)
          // alert("complete 855")
          socket.emit("update-progress", {
            raceId,
            userAddress: player.address,
            property: "rabbithole-complete",
            value: {
              isWon: false,
              pointsAllocated: 0,
            },
            version,
          });
          
        }
      }
    })

    // get bonus for current user
    const currentUserBonus = bonuses.find(i => i.address == smartAccountAddress)?.amount || 0;

    // apply bonus
    newListOfPlayers = newListOfPlayers.map(i => {
      if (i.address == smartAccountAddress) {
        i.maxAvailableFuel += currentUserBonus;
        if (i.maxAvailableFuel > (version == "v1" ? 10 : 20)) {
          i.maxAvailableFuel = (version == "v1" ? 10 : 20);
        }
      }

      return i;
    });

    const remainingPlayersCount = newListOfPlayers.length;
    const userLost = !newListOfPlayers.some(i => i.address === smartAccountAddress);
    const userWon = remainingPlayersCount === 1 && newListOfPlayers[0].address === smartAccountAddress;

    if (bonuses.length <= 1) {
      // const allPlayersEliminated = newListOfPlayers.every(i => i.maxAvailableFuel === 0);

      if (userLost) {
          console.log("YOU LOSE :(");
          if (!isGameOver) {
              const amountOfPointsToAllocate = Math.max(0, 3 - remainingPlayersCount);
              handleFinishTunnelGame(raceId as string, false, amountOfPointsToAllocate);
          }
          setIsRolling(false);
      }

      if (userWon) {
          console.log("YOU WIN!");
          handleFinishTunnelGame(raceId as string, true, 3);
          setIsRolling(false);
      }
    }

    const restartTimerAndTunnelAfterRound = () => {
      setTimeout(() => {
        // reset and make calculations
        socket.emit('rabbithole-set-tunnel-state', {
          raceId, 
          secondsLeft: 0,
          addRoundsPlayed: 0,
          gameState: "reset",
        });
        console.log("RESET_TUNNEL");
        setPhase("Reset");
        setWhoStoleIsShowed(true)
        
        setTimeout(() => {
          socket.emit('rabbithole-set-tunnel-state', {
            raceId, 
            secondsLeft: 0,
            addRoundsPlayed: 0,
            gameState: "default",
          });
      
          
          console.log("DEFAULT_TUNNEL");
          setPhase("Default");

          // if the user is won, do not need to restart a timer
          if (userWon) {
            return;
          }

          setTimeout(() => {
            setMaxFuel(newListOfPlayers.find(i => i.address == smartAccountAddress)?.maxAvailableFuel || 0);
            setDisplayNumber(0);
            setRoundIndex(prev => prev + 1);
            
            if (newListOfPlayers.length > 1) {
              console.log("next round... time reset");
              const time = new Date();
              time.setSeconds(time.getSeconds() + 5);
              restart(time);
            }
          }, 6000);

        }, 5000);
        
      }, 5000);
    }

    restartTimerAndTunnelAfterRound();
  }

  function onNextGameClicked() {
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "rabbithole-wait-to-finish",
      version
    });
    setLatestInteractiveModalWasClosed(true);
  }

  function openWinModal() {
    socket.emit('rabbithole-set-tunnel-state', {
      raceId,
      secondsLeft: 0,
      addRoundsPlayed: 0,
      gameState: "default",
      isFinished: true,
    });

    if (!modalIsOpen) {
      setIsOpen(true);
      setWinModalPermanentlyOpened(true);

      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restartNextTimer(time);
      startNextTimer();
    }
  }

  function openLoseModal() {
    socket.emit('rabbithole-set-tunnel-state', {
      raceId,
      secondsLeft: 0,
      addRoundsPlayed: 0,
      gameState: "default",
      isFinished: true,
    });

    if (!modalIsOpen) {
      setIsOpen(true);
      setLoseModalPermanentlyOpened(true);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restartNextTimer(time);
      startNextTimer();
    }
  }

  function closeWinLoseModal() {
    setIsOpen(false);
    setLoseModalPermanentlyOpened(false);
    setWinModalPermanentlyOpened(false);
    onNextGameClicked();
  }


  return (
    <div className="mx-auto flex w-full flex-col bg-cover bg-bottom relative" style={{ height: `${window.innerHeight}px` }}>
      <p style={{ transform: 'translate(-50%, -50%)' }} className="absolute text-center text-xl font-bold text-white top-[30%] left-[50%] z-50 bg-black p-2 rounded-2xl opacity-80">{userIsLost ? "Eliminated ☠️. Wait for next game!" : displayNumber}</p>
      {phase === "Default" && !whoStoleIsShowed && <p style={{ transform: 'translate(-50%, -50%)' }} className="absolute text-center text-xl font-bold text-white top-[40%] left-[50%] z-50 bg-black p-2 rounded-2xl opacity-80 w-2/3 mx-auto">{"Who stole my carrots?"}</p>}
      
      <div className="relative z-50 py-6">
        <Timer seconds={totalSeconds} percentageRate={20}/>
        <div className="absolute right-4 top-6">
          <UserCount currentAmount={amountOfConnected} requiredAmount={race?.numOfPlayersRequired || 9}/>
        </div>
      </div>
     
      <img src={BG_Carrots} className="scale-[120%] -mt-[120px]"/>

        {
          /* 
            <div className="absolute top-20 z-50 w-full">
              <FuelBar players={players} />
            </div>
          */
        }
        
        <div className="tunnel">
          {isCountingDown ? <div className="absolute text-center text-white text-xl z-50" style={{ transform: 'translate(50%, 12%)' }}>
              <CircularProgress value={totalSecondsOnClosedTimer} outerStroke="#ffffff" innerStroke="#e11111" size={56} />
              <p className="text-lg">DROP ENOUGH CARROTS</p>
              <p className="text-sm">LAST ONE GETS ELIMINATED</p>
            </div> : <></>
          }

          <PlayerMovement 
            phase={phase} 
            players={players} 
            isRolling={isRolling} 
            amountOfComplteted={amountOfComplteted}
            version={version as string}
            lastEliminatedUserAddress={lastEliminatedUserAddress}
          />
          <RabbitHead phase={phase} />
          <Darkness   phase={phase} />
          <RabbitTail phase={phase} />

          <div className="absolute -bottom-48 w-full h-36 left-[50%]" style={{ transform: 'translate(-50%, -50%)', zIndex: 9999999999 }}>
              {/* <CarrotSlider 
                min={0} 
                max={maxFuel} 
                setDisplayNumber={handleFuelUpdate} 
                isRolling={totalSeconds === 0 || userIsLost}
              /> */}

            <div className="absolute z-10 bottom-4 right-10 w-44 mr-24">
              <CarrotBasket fuelLeft={maxFuel - displayNumber} />
            </div>

            <div className="absolute z-10 bottom-4 right-0 w-44">
              <CarrotBasketIncrement 
                MAX_CARROTS={maxFuel} 
                displayNumber={displayNumber}
                setDisplayNumber={handleFuelUpdate}
                disabled={!isCountingDown || gameOver} 
              />
            </div>
          </div>
        </div>
  
        {
          loseModalPermanentlyOpened && 
          !latestInteractiveModalWasClosed && 
          <LoseModal 
            secondsLeft={totlaSecondsToMoveNext}
            handleClose={closeWinLoseModal} 
            raceId={Number(raceId)} 
            getScoreOfTheUser={getPoints}
          />
        }
        {
          winModalPermanentlyOpened && 
          !latestInteractiveModalWasClosed && 
          <WinModal 
            raceId={Number(raceId)}
            secondsLeft={totlaSecondsToMoveNext}
            handleClose={closeWinLoseModal} 
            getScoreOfTheUser={getPoints}
          />
        }
    </div>
  );
}

export default RabbitHoleGame;