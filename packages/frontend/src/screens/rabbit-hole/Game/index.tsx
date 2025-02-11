import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";

// Components - Game UI
import FuelBar from "./components/FuelBar";
import PlayerMovement from "./components/PlayerMovement";
import Darkness from "./components/Darkness";
import RabbitHead from "./components/RabbitHead";
import RabbitTail from "./components/RabbitTail";
import Lever from "./components/Lever";
import GasolineGauge from "./components/GasolineGauge";
import Timer from "../../../components/Timer";
import UserCount from "../../../components/UserCount";

// Components - Modals
import WinModal from "../../../components/modals/WinModal";
import LoseModal from "../../../components/modals/LoseModal";

// Web3 and Contract
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from "../../../config/wagmi";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { finishTunnelGame, getRaceById, submitFuel } from "../../../utils/contract-functions";

// Socket and HTTP
import { socket } from "../../../utils/socketio";
import { httpGetRaceDataById } from "../../../utils/http-requests";

// Game Logic
import generateLink from "../../../utils/linkGetter";
import { txAttempts } from "../../../utils/txAttempts";
import calculatePlayersV1 from "./calculations/v1";
import calculatePlayersV2 from "./calculations/v2";
import { useGameContext } from "../../../utils/game-context";
import rabbitholeGetGamePart, { TRabbitholeGameVersion } from "../utils/getGamePart";

// Assets
import BlackSheep from "../assets/images/blacksheep.png";
import WhiteSheep from "../assets/images/sheeepy.png";
import BG_Carrots from "../assets/images/backgroundcarrot.jpg";
import CarrotSlider from "./components/slider";
import { CarrotBasket, CarrotBasketIncrement } from "./components/basket";
import { CircularProgress } from "./components/CircularProgress";

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

const delay = async (time: number) => await new Promise((resolve) => setTimeout(resolve, time));

function RabbitHoleGame() {
  const { smartAccountAddress, smartAccountClient } = useSmartAccount();
  const { gameState } = useGameContext();
  const navigate = useNavigate();
  // const navigate = (a: string, b?: any) => {}
  const { raceId, version } = useParams();

  // Game state
  const [phase, setPhase] = useState<RabbitHolePhases>("Default");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [roundIsFinished, setRoundIsFinsihed] = useState(false);

  // Player states
  const [players, setPlayers] = useState<ConnectedUser[]>([]);
  const [userIsLost, setUserIsLost] = useState(false);
  const [maxFuel, setMaxFuel] = useState(version == "v1" ? 10 : 20);
  const [isRolling, setIsRolling] = useState(false);

  // Player counts
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [amountOfPending, setAmountOfPending] = useState(0);
  const [amountOfComplteted, setAmountOfComplteted] = useState(0);
  const [amountOfPlayersnextClicked, setAmountOfPlayersNextClicked] = useState(0);
  const [amountOfAllocatedPoints, setAmountOfAllocatedPoints] = useState(0);

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

  const [whoStoleIsShowed, setWhoStoleIsShowed] = useState(false)
  const [hourglassCounter, setHourglassCounter] = useState(10)
  const [isCountingDown, setIsCountingDown] = useState(false)

  
  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  console.log({phase})

  // after game finish
  const { totalSeconds: totlaSecondsToMoveNext, restart: restartNextTimer, start: startNextTimer, } = useTimer({
    expiryTimestamp: time,
    autoStart: false,
    onExpire: () => {
      closeWinLoseModal();
    }
  });

  // in-game
  const { totalSeconds, restart, start, pause, resume, isRunning: timerIsRunning } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      handleTunnelChange();
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
      socket.emit('set-tunnel-state', {
        raceId, 
        secondsLeft: totalSeconds,
        addRoundsPlayed: 0,
      });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [totalSeconds]);

  // handle socket events
  useEffect(() => {
    const tryToProcessAnimations = (pending: number, currentPhase: string) => {
      if (pending === 0 && currentPhase == "OpenTunnel") {
        console.log("All transactions processed.");
        socket.emit("tunnel-started", { raceId });
        triggerAnimationsOpen();
      }
    }

    if (smartAccountAddress && gameState) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED", amount)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
        if (raceId == raceIdSocket && ["RABBIT_HOLE", "RABBIT_HOLE_V2"].includes(part)) {
          console.log("JOINED")
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
        if (data.raceId == raceId && ["RABBIT_HOLE", "RABBIT_HOLE_V2"].includes(data?.part)) {
          
          if (raceId == data.raceId) {
            setAmountOfPending(prev => Math.max(0, prev - 1));
            setAmountOfConnected(prev => Math.max(0, prev - 1));
            setAmountOfPlayersNextClicked(prev => Math.max(0, prev - 1));

            if (pendingTransactions.size > 0) {
              // remove from pending transactions
              const newSet = new Set(pendingTransactions);
              newSet.delete(data?.userAddress);
              setPendingTransactions(newSet);
  
              // check if all transactions are processed
              const pendingCount = newSet.size;
              console.log("Pending transactions:", pendingCount);

              tryToProcessAnimations(pendingCount, phase);
            }
            socket.emit("get-connected", { raceId });
          }
        }
      });

      socket.once('race-progress', ({progress, tunnelState}) => {        
        if (tunnelState.roundsPlayed > 0) {
          setGameOver(true);
          setIsRolling(false);
          setGameCompleted(true);
          setUserIsLost(true);
          setAmountOfAllocatedPoints(0);

        } 
        
        if (tunnelState.isFinished) {
          pause();
          openLoseModal();
          return;
        }

        if (tunnelState.secondsLeft >= 2) {
          const time = new Date();
          time.setSeconds(time.getSeconds() + tunnelState.secondsLeft);
          restart(time);
        } else {
          pause();
      
          if (tunnelState.gameState !== "default") {
            // Wait for tunnel to return to default state before restarting
            const checkTunnelState = () => {
              socket.emit("get-tunnel-state", { raceId }, (response: any) => {
                if (response.data.gameState === "default") {
                  // Restart timer and sync with other players
                  const time = new Date();
                  time.setSeconds(time.getSeconds() + 10); // Reset to 10 seconds
                  restart(time);
                } else {
                  // Check again in 700ms if not in default state
                  setTimeout(checkTunnelState, 700);
                }
              });
            };
            
            checkTunnelState();
          } else {
            handleTunnelChange();
          }
        }

        // @ts-ignore
        setDisplayNumber(progress?.progress?.game2?.[version]?.game?.fuel || 0);
        // @ts-ignore
        setMaxFuel(progress?.progress?.game2?.[version]?.game?.maxAvailableFuel || (version == "v1" ? 10 : 20));
      });

      socket.on("rabbit-hole-results-shown-on-client", ({ socketId, raceId }) => {
        // means that some player got a win-lose modal opened, finished the game and ready to navigate to the next screen
        pause();
        if (!winModalPermanentlyOpened || !loseModalPermanentlyOpened || !modalIsOpen) {
          if (amountOfAllocatedPoints > 0) {
            openWinModal();
          } else {
            openLoseModal();
          }
        }
      });
      
      socket.on("race-fuel-all-tunnel", async(progress) => {
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
          i[version].game.isPending && amountPendingPerGame2++;
          // @ts-ignore
          i[version].game.isCompleted && amountOfCompleted++;
        });

        setAmountOfComplteted(amountOfCompleted);

        // set players list
        const usersDATADB = await httpGetRaceDataById(`race-${raceId}`);
        setPlayers(prevPlayers => {
          const updatedPlayers = [...prevPlayers];
          
          usersData.forEach((i: any) => {
            const user = usersDATADB.data.race.users.find((j: any) => j.address == i.userAddress);
            // @ts-ignore
            const dataByTunnelVersion = i[version];
            
            const existingPlayerIndex = updatedPlayers.findIndex(p => p.address === i.userAddress);
            const updatedPlayer = {
              id: existingPlayerIndex !== -1 ? updatedPlayers[existingPlayerIndex].id : updatedPlayers.length,
              address: i.userAddress,
              src: i.userAddress === smartAccountAddress ? BlackSheep : WhiteSheep,
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

          console.log(updatedPlayers.map(i => ({eliminated: i.isEliminated, completed: i.isCompleted})));
      
          return updatedPlayers.sort((a, b) => a.id - b.id);
        });
      });
      

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "game2-eliminate") {
          if (pendingTransactions.size > 0) {
            // remove from pending transactions
            const newSet = new Set(pendingTransactions);
            newSet.delete(progress.userAddress);
            setPendingTransactions(newSet);

            // check if all transactions are processed
            const pendingCount = newSet.size;
            console.log("Pending transactions:", pendingCount);

            tryToProcessAnimations(pendingCount, phase);
          }
        }

        if (progress.property === "game2-set-fuel") {
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

            console.log("PENDING TXS:", newSet, newSet.size)
            // check if all transactions are processed
            const pendingCount = newSet.size;
            //console.log("Pending transactions:", pendingCount);
            tryToProcessAnimations(pendingCount, phase);
          }
        }

        if (progress.property === "game2-complete") {
          if (amountOfComplteted + 1 >= amountOfConnected) {
            await finishTunnelGame(Number(raceId), true, smartAccountClient, amountOfAllocatedPoints).then(async data => {
              await waitForTransactionReceipt(config, {
                hash: data,
                confirmations: 0,
                pollingInterval: 300,
              });
            });
          } else {
            setAmountOfComplteted(amountOfComplteted + 1);
          }
        }

        if (progress.property === "game2-wait-to-finish") {
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
              let redirectLink = "/";
  
              switch (version) {
                case "v1":
                  redirectLink = generateLink("RACE_UPDATE_1", Number(raceId)); break;
                case "v2":
                  redirectLink = generateLink("RACE_UPDATE_4", Number(raceId)); break;
                default:
                  break;
              }
  
              socket.emit('minimize-live-game', { part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game"), raceId });
              navigate(redirectLink);
            }
          }

        }
      });


      socket.on('tunnel-started-on-client', ({ socketId, raceId: raceIdSocket }) => {
        if (phase == "OpenTunnel" && raceId == raceIdSocket && pendingTransactions.size > 0) {
          console.log(`Trying to trigger animations as on one of clients (${socketId}) the tunnel was already started.`)
          setPendingTransactions(new Set());
          triggerAnimationsOpen();
        }
      });

      socket.on('race-progress-all', ({ progress }) => {
        let amountOfNextClicked = 0;
        const playersClickedNextAddrs: string[] = [];
        progress.forEach((i: any) => {
          if (i.progress.game2.waitingToFinish) {
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
        socket.off('race-fuel-all-tunnel');
        socket.off('progress-updated');
        socket.off('tunnel-started-on-client');
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
    amountOfAllocatedPoints,
  ]);


  // this ensures that connected users will be redirected if someone disconnects on the part of closing the modal
  useEffect(() => {
    if (amountOfPlayersnextClicked >= amountOfConnected && amountOfPlayersnextClicked > 0 && amountOfConnected > 0) {
      let redirectLink = "/";

      switch (version) {
        case "v1":
          redirectLink = generateLink("RACE_UPDATE_1", Number(raceId)); break;
        case "v2":
          redirectLink = generateLink("RACE_UPDATE_4", Number(raceId)); break;
        default:
          break;
      }

      socket.emit('minimize-live-game', { part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game"), raceId });
      navigate(redirectLink);
    }
  }, [ amountOfConnected, amountOfPlayersnextClicked ]);
  

  
  useEffect(() => {
    if (raceId && socket) {
        if (!socket.connected) {
            socket.connect();
        }
        
        socket.on('screen-changed', ({ screen }) => {
          //alert('Navigate screen-changed')
          navigate(generateLink(screen, Number(raceId)));
        });

        socket.on('latest-screen', ({ screen }) => {
            if (screen !== rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game")) {
              socket.emit("update-progress", {
                raceId,
                userAddress: smartAccountAddress,
                property: "game2-complete",
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
  }, [raceId, socket]);


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && gameState) {
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit("game2-reach", { raceId, userAddress: smartAccountAddress })
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-progress-all", { raceId });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [smartAccountAddress, socket, raceId, gameState]);


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length) {
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game") });
        socket.emit("get-latest-screen", { raceId, part: rabbitholeGetGamePart(version as TRabbitholeGameVersion, "game") });
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
    if (raceId?.length && smartAccountAddress) {
      getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
        if (data) {
          // VALIDATE USER FOR BEING REGISTERED
          if (!data.registeredUsers.includes(smartAccountAddress)) {
            if (socket.connected) {
              socket.disconnect();
            }
            alert('Not registered!');
            navigate('/', { replace: true });
          }
        }
      });
    }
  }, [raceId, smartAccountAddress, socket]);

  const triggerAnimations = async () => {
    if (animationsTriggered) return;
    setAnimationsTriggered(true);
  
    // Close tunnel: Head moves to swallow everything.
    socket.emit('set-tunnel-state', {
      raceId,
      secondsLeft: 0,
      addRoundsPlayed: 1,
      gameState: "close",
    });
    
    setPhase("CloseTunnel");

    await delay(2000)
    setIsCountingDown(true);

    let countdownInterval = setInterval(() => {
      setHourglassCounter((prev) => {
        if (prev <= 1) {
          console.log({ prev });
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Open tunnel: cars get out
    setTimeout(() => {
      clearInterval(countdownInterval);
  
      socket.emit('set-tunnel-state', {
        raceId,
        secondsLeft: 0,
        addRoundsPlayed: 0,
        gameState: "open",
      });
      socket.emit("get-all-fuel-tunnel", { raceId });
      setPhase("OpenTunnel");
  
      // if user is one in race and eliminated, go on with animations without waiting for other (leaved) players
      if (amountOfConnected <= 1 && userIsLost) {
        console.log('user is one in race and eliminated, go on with animations without waiting for other (leaved) players');
        setTimeout(() => {
          triggerAnimationsOpen();
        }, 3500);
      }
    }, 10000);
  }; 

  // Reset animationsTriggered when a new round starts
  useEffect(() => {
    if (roundIsFinished) {
      setAnimationsTriggered(false);
    }
  }, [roundIsFinished]);

  const triggerAnimationsOpen = () => {
    // reset and make calculations
    socket.emit('set-tunnel-state', {
      raceId, 
      secondsLeft: 0,
      addRoundsPlayed: 0,
      gameState: "reset",
    });
    setPhase("Reset");
    setWhoStoleIsShowed(true)
    
    setTimeout(() => {
      socket.emit('set-tunnel-state', {
        raceId, 
        secondsLeft: 0,
        addRoundsPlayed: 0,
        gameState: "default",
      });

      setRoundIsFinsihed(true);
      setIsRolling(false);
      setPhase("Default");
    }, 6000);
  }


  const handleFuelUpdate = (fuel: number) => {
    if (!isRolling && !gameOver && fuel <= maxFuel) {
      setDisplayNumber(fuel);
      
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-set-fuel",
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
    setIsRolling(true);
    await triggerAnimations();
    await delay(10000)

    if (!gameOver) {
      //console.log("EMIT FUEL UPDATE!")
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-set-fuel",
        value: {
          fuel: displayNumber,
          maxAvailableFuel: maxFuel - displayNumber,
          isPending: true,
        },
        version,
      });
      
      try {
        await txAttempts(
          3,
          async () => {
            const data = await submitFuel(Number(raceId), displayNumber, maxFuel - displayNumber, smartAccountClient);
            await waitForTransactionReceipt(config, {
              hash: data,
              confirmations: 0,
              pollingInterval: 300,
            });
          },
          3000
        );
      } catch (error) {
        console.error("Transaction failed:", error);
        setIsRolling(false); // Reset if transaction fails
      } finally {
        setTimeout(() => {
          socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-set-fuel",
            value: {
              fuel: displayNumber,
              maxAvailableFuel: maxFuel - displayNumber,
              isPending: false,
            },
            version,
          });
        }, 1500 + Number(players.find(i => i.address == smartAccountAddress)?.id) * 350)
      }
      
    }
  };

  useEffect(() => {
    if (players && !isRolling && roundIsFinished) {
      calculateSubmittedFuelPerPlayers(players, gameOver);
      setRoundIsFinsihed(false);
    }
  }, [isRolling, players, roundIsFinished, gameOver]);


  const handleFinishTunnelGame = async(
    raceId: string, 
    isWon: boolean, 
    playersLeft: number, 
    amountOfPointsToAllocate: number, 
    finishPermanently?: boolean
  ) => {
    setAmountOfAllocatedPoints(amountOfPointsToAllocate);
    
    if (!gameOver) {
      setGameOver(true);
      setTimeout(() => {
        !isWon && setUserIsLost(true);
      }, 3000);

      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-complete",
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
        async () => {
          return await finishTunnelGame(Number(raceId), isWon, smartAccountClient, amountOfPointsToAllocate).then(async data => {
            await waitForTransactionReceipt(config, {
              hash: data,
              confirmations: 0,
              pollingInterval: 300,
            });
          });
        },
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
  const calculateSubmittedFuelPerPlayers = async(players: ConnectedUser[], isGameOver: boolean) => {
    let newListOfPlayers: ConnectedUser[] = [];
    let bonuses: {address: string, amount: number}[] = [];

    switch (version) {
      case "v1":
        newListOfPlayers = calculatePlayersV1(players).newListOfPlayers;
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
        if (!player.isEliminated) {
          console.log("ELIMINATE!", player.address, player.Fuel)
          socket.emit("update-progress", {
            raceId,
            userAddress: player.address,
            property: "game2-eliminate",
            version,
          });
        }

        if (!player.isCompleted) {
          console.log("COMPLETE!", player.address, player.Fuel)
          socket.emit("update-progress", {
            raceId,
            userAddress: player.address,
            property: "game2-complete",
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

    if (bonuses.length <= 1) {
      const userLost = !newListOfPlayers.some(i => i.address === smartAccountAddress);
      const userWon = remainingPlayersCount === 1 && newListOfPlayers[0].address === smartAccountAddress;
      // const allPlayersEliminated = newListOfPlayers.every(i => i.maxAvailableFuel === 0);

      if (userLost) {
          console.log("YOU LOSE :(");
          if (!isGameOver) {
              const amountOfPointsToAllocate = Math.max(0, 3 - remainingPlayersCount);
              handleFinishTunnelGame(raceId as string, false, remainingPlayersCount, amountOfPointsToAllocate);
          }
          setIsRolling(false);
      }

      if (userWon) {
          console.log("YOU WIN!");
          handleFinishTunnelGame(raceId as string, true, remainingPlayersCount, 3);
          setIsRolling(false);
          return;
      }
    }

    const restartTimerAfterRound = () => {
      setTimeout(() => {
        setMaxFuel(newListOfPlayers.find(i => i.address == smartAccountAddress)?.maxAvailableFuel || 0);
        setDisplayNumber(0);
        
        if (newListOfPlayers.length > 1) {
          console.log("next round... time reset");
          const time = new Date();
          time.setSeconds(time.getSeconds() + 10);
          restart(time);
        }
      }, 6000);
    }

    restartTimerAfterRound();
  }

  function onNextGameClicked() {
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game2-wait-to-finish",
      version
    });
    setLatestInteractiveModalWasClosed(true);
  }

  function openWinModal() {
    socket.emit('set-tunnel-state', {
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
    socket.emit('set-tunnel-state', {
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
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-6">
          <UserCount currentAmount={amountOfConnected} requiredAmount={gameState?.amountOfRegisteredUsers}/>
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
        
        {isCountingDown ? <div className="DEV absolute text-center text-white text-xl z-50 bottom-40" style={{ transform: 'translate(50%, -50%)' }}>
          <CircularProgress value={hourglassCounter} outerStroke="#ffffff" innerStroke="#e11111" size={56} />
          <p className="text-lg">DROP ENOUGH CARROTS</p>
          <p className="text-sm">LAST ONE GETS ELIMINATED</p>
        </div> : <></>}

        <div className="tunnel">
          <PlayerMovement 
            phase={phase} 
            players={players} 
            isRolling={isRolling} 
            amountOfComplteted={amountOfComplteted}
            version={version as string}
          />
          <RabbitHead phase={phase} />
          <Darkness   phase={phase} />
          <RabbitTail phase={phase} />

          <div className="absolute -bottom-52 w-full h-36 left-[50%]" style={{ transform: 'translate(-50%, -50%)' }}>
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
                min={0}
                max={maxFuel} 
                setDisplayNumber={handleFuelUpdate}
                isRolling={totalSeconds === 0 || userIsLost} 
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
            preloadedScore={amountOfAllocatedPoints}
          />
        }
        {
          winModalPermanentlyOpened && 
          !latestInteractiveModalWasClosed && 
          <WinModal  
            secondsLeft={totlaSecondsToMoveNext}
            handleClose={closeWinLoseModal} 
            raceId={Number(raceId)} 
            preloadedScore={amountOfAllocatedPoints} 
            gameName="rabbit-hole"
          />
        }
    </div>
  );
}

export default RabbitHoleGame;
