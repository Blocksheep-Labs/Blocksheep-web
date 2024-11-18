import { useState, useEffect } from "react";
import FuelBar from "../../components/rabbit-hole/FuelBar";
import PlayerMovement from "../../components/rabbit-hole/PlayerMovement";
import Darkness from "../../components/rabbit-hole/Darkness";
import RabbitHead from "../../components/rabbit-hole/RabbitHead";
import RabbitTail from "../../components/rabbit-hole/RabbitTail";
import Lever from "../../components/rabbit-hole/Lever";
import GasolineGauge from "../../components/rabbit-hole/GasolineGauge";
import WinModal from "../../components/modals/WinModal";
import Timer from "../../components/Timer";
import UserCount from "../../components/UserCount";
import { waitForTransactionReceipt  } from '@wagmi/core';
import { useTimer } from "react-timer-hook";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { finishTunnelGame, getRaceById, submitFuel } from "../../utils/contract-functions";
import LoseModal from "../../components/modals/LoseModal";
import { config } from "../../config/wagmi";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import BlackSheep from "../../assets/rabbit-hole/blacksheep.png";
import WhiteSheep from "../../assets/rabbit-hole/sheeepy.png";
import { httpGetRaceDataById } from "../../utils/http-requests";
import generateLink from "../../utils/linkGetter";
import { txAttempts } from "../../utils/txAttempts";
import calculatePlayersV1 from "./calculations/v1";
import calculatePlayersV2 from "./calculations/v2";
import BG_Carrots from "../../assets/rabbit-hole/backgroundcarrot.jpg";
import { useGameContext } from "../../utils/game-context";

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


function RabbitHoleGame() {
  const {smartAccountAddress} = useSmartAccount();
  const [phase, setPhase] = useState<RabbitHolePhases>("Default");
  const [players, setPlayers] = useState<ConnectedUser[]>([]);
  const {gameState} = useGameContext();
  const [modalType, setModalType] = useState<string | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {raceId, version} = useParams();
  const [displayNumber, setDisplayNumber] = useState(0); // Start with a default of 0
  const [maxFuel, setMaxFuel] = useState(version == "v1" ? 10 : 20);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [amountOfPending, setAmountOfPending] = useState(0);
  const [amountOfComplteted, setAmountOfComplteted] = useState(0);
  const {smartAccountClient} = useSmartAccount();
  const [raceData, setRaceData] = useState<any>(undefined);
  const [gameStarted, setGameStarted] = useState(false);
  const [roundIsFinished, setRoundIsFinsihed] = useState(false);
  const [amountOfPlayersnextClicked, setAmountOfPlayersNextClicked] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userIsLost, setUserIsLost] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [amountOfAllocatedPoints, setAmountOfAllocatedPoints] = useState(0);
  const [loseModalPermanentlyOpened, setLoseModalPermanentlyOpened] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(new Set());
  

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  const { totalSeconds, restart, start, pause } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      handleTunnelChange();
    },
    autoStart: false,
  });

  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    if (!gameStarted && gameState && (amountOfConnected >= gameState.amountOfRegisteredUsers - amountOfComplteted)) {
      setGameStarted(true);
      if (gameState && (amountOfConnected >= gameState.amountOfRegisteredUsers - amountOfComplteted) && start) {
        socket.emit("get-all-fuel-tunnel", { raceId });
        //closeWaitingModal();
        console.log(">>>> STARTING... <<<<")
        !isRolling && start();
      } else {
        pause();
        !modalIsOpen && openWaitingModal();
      }
    }
  }, [amountOfConnected, start, modalIsOpen, isRolling, raceId, gameState]);

  // handle socket eventsd
  useEffect(() => {
    if (smartAccountAddress && gameState) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount >= gameState.amountOfRegisteredUsers - amountOfComplteted) {
            setIsOpen(false);
            setModalType(undefined);
            socket.emit("get-all-fuel-tunnel", { raceId });
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
        if (raceId == raceIdSocket && part == "RABBIT_HOLE") {
          console.log("JOINED++")
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= gameState.amountOfRegisteredUsers) {
            setIsOpen(false);
            setModalType(undefined);
          }
          socket.emit("get-connected", { raceId });
        }
      });

      
      socket.on('leaved', (data) => {
        if (data?.part == "RABBIT_HOLE" && data.raceId == raceId && !data.movedToNext) {
          setAmountOfConnected(amountOfConnected - 1);
  
          // if user was sending a TX
          if (raceId == data.raceId && amountOfPending - 1 >= 0) {
            setAmountOfPending(amountOfPending - 1);
          }
          
          if (!isRolling) {
            if (amountOfConnected - 1 == 1 && !gameCompleted) {
              pause();
              if (modalIsOpen) {
                setIsOpen(false);
                setModalType(undefined);
              }
              handleFinishTunnelGame(String(raceId), true, 1, 3, true);
            }
          }
        }
      });

      socket.on('race-progress', (progress) => {
        // @ts-ignore
        setDisplayNumber(progress?.game2?.[version]?.game?.fuel || 0);
        // @ts-ignore
        setMaxFuel(progress?.game2?.[version]?.game?.maxAvailableFuel || (version == "v1" ? 10 : 20));
      });

      
      socket.on("race-fuel-all-tunnel", async(progress) => {
        const usersData = progress.progresses;

        if (usersData.length < 2) return;

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
          if (i.userAddress === smartAccountAddress) {
            //setDisplayNumber(i.fuel);
            //setMaxFuel(i.maxAvailableFuel);
          }
          // @ts-ignore
          i[version].game.isPending && amountPendingPerGame2++;
          // @ts-ignore
          i[version].game.isCompleted && amountOfCompleted++;
        });

        setAmountOfComplteted(amountOfCompleted);

        // set players list
        const usersDATADB = await httpGetRaceDataById(`race-${raceId}`);
        setPlayers(usersData.map((i: any, index: number) => {
          const user = usersDATADB.data.race.users.find((j: any) => j.address == i.userAddress);

          // @ts-ignore
          const dataByTunnelVersion = i[version];

          return {
            id: index,
            address: i.userAddress,
            src: i.userAddress === smartAccountAddress ? BlackSheep : WhiteSheep,
            PlayerPosition:   dataByTunnelVersion.game.fuel / 9,
            Fuel:             dataByTunnelVersion.game.fuel,
            maxAvailableFuel: dataByTunnelVersion.game.maxAvailableFuel,
            isEliminated:     dataByTunnelVersion.game.isEliminated,
            isCompleted:      dataByTunnelVersion.game.isCompleted,
            name: user?.name || "Newbie"
          }
        }).toSorted((a: any, b: any) => a.id - b.id));
      });
      

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "game2-set-fuel") {
          if (progress.value.isPending) {
            // add to pending transactions
            setPendingTransactions(prev => new Set(prev).add(progress.userAddress));
          } else {
            // remove from pending transactions
            const newSet = new Set(pendingTransactions);
            newSet.delete(progress.userAddress);
            setPendingTransactions(newSet);

            // check if all transactions are processed
            const pendingCount = newSet.size;
            console.log("Pending transactions:", pendingCount);

            if (pendingCount === 0 && phase !== "CloseTunnel") {
              console.log("All transactions processed. Starting the tunnel...");
              socket.emit("get-all-fuel-tunnel", { raceId });
              socket.emit("tunnel-started", { raceId });
              triggerAnimations();
            }
          }
        }

        if (progress.property === "game2-complete") {
          if (gameState.amountOfRegisteredUsers - (amountOfComplteted + 1) === -1) {
            await finishTunnelGame(Number(raceId), true, smartAccountClient, amountOfAllocatedPoints).then(async data => {
              await waitForTransactionReceipt(config, {
                hash: data,
                confirmations: 2,
              });
              openWinModal();
            });
          } else {
            setAmountOfComplteted(amountOfComplteted + 1);
          }
        }

        if (progress.property === "game2-wait-to-finish") {
          // set amount of next clicked
          setAmountOfPlayersNextClicked(amountOfPlayersnextClicked + 1);
          if (amountOfPlayersnextClicked + 1 >= gameState.amountOfRegisteredUsers) {
            //closeLoadingModal();
            let redirectLink = "/";

            switch (version) {
              case "v1":
                redirectLink = generateLink("RACE_UPDATE_1", Number(raceId)); break;
              case "v2":
                redirectLink = generateLink("RACE_UPDATE_4", Number(raceId)); break;
              default:
                break;
            }

            socket.emit('minimize-live-game', { part: 'RABBIT_HOLE', raceId });
            navigate(redirectLink);
          }
        }
      });


      socket.on('tunnel-started-on-client', ({ socketId, raceId: raceIdSocket }) => {
        console.log(`event: tunnel-started-on-client`, { raceIdSocket, socketId, isCurrentGame: raceIdSocket == raceId, phaseCheck: phase !== "CloseTunnel" });
        if (phase !== "CloseTunnel" && raceId == raceIdSocket) {
          console.log(`Trying to trigger animations as on one of clients (${socketId}) the tunnel was already started.`)
          socket.emit("get-all-fuel-tunnel", { raceId });
          setPendingTransactions(new Set());
          triggerAnimations();
        }
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('race-fuel-all-tunnel');
        socket.off('progress-updated');
        socket.off('tunnel-started-on-client');
      }
    }
  }, [
    socket, 
    amountOfConnected, 
    smartAccountAddress, 
    amountOfComplteted, 
    gameState, 
    amountOfPlayersnextClicked, 
    amountOfPending, 
    gameCompleted,
    isRolling,
    pendingTransactions,
    phase,
  ]);

  // fetch required amount of users to wait
  useEffect(() => {
    if (smartAccountAddress && gameState) {
      socket.emit("game2-reach", { raceId, userAddress: smartAccountAddress })
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [socket, smartAccountAddress, gameState]); 

  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && gameState) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "RABBIT_HOLE" });
    }
  }, [smartAccountAddress, socket, raceId, gameState]);
  

  useEffect(() => {
    if (gameState && !isRolling) {
      closeWaitingModal();
    }
  }, [gameState, isRolling]);

  // kick player if page chnages (closes)
  useEffect(() => {
    const handleTabClosing = (e: any) => {
      e.preventDefault();
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-eliminate",
        version,
      });
      handleFinishTunnelGame(raceId as string, false, Number.MAX_VALUE, 0, true);
      openLoseModal();
    }
    window.addEventListener('unload', handleTabClosing);
    return () => {
      window.removeEventListener('unload', handleTabClosing);
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
            navigate('/', { replace: true });
          } 
          setRaceData(data);
        }
      });
    }
  }, [raceId, smartAccountAddress, socket]);


  const triggerAnimations = () => {
    // Close tunnel: Head moves to swallow everything.
    setPhase("CloseTunnel"); 

    // Open tunnel: cars get out
    setTimeout(() => setPhase("OpenTunnel"), 10000);

    // reset and make calculations
    setTimeout(() => {
      setPhase("Reset");
      setRoundIsFinsihed(true);
      setIsRolling(false);

      setTimeout(() => {
        setPhase("Default");
      }, 9000);
    }, 16000);
  };


  const handleFuelUpdate = (fuel: number) => {
    if (!isRolling && !gameOver && fuel <= maxFuel) {
      //console.log({fuel, phase})
      setDisplayNumber(fuel);
      /*
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-set-fuel",
        value: {
          fuel,
          maxAvailableFuel: maxFuel,
        },
        version,
      });
      */
    }
  }

  const handleTunnelChange = async() => {
    if (gameCompleted) 
      return;

    pause();
    if (!gameOver) {
      console.log("EMIT FUEL UPDATE!")
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
          10,
          async () => {
            const data = await submitFuel(Number(raceId), displayNumber, maxFuel - displayNumber, smartAccountClient);
            await waitForTransactionReceipt(config, {
              hash: data,
              confirmations: 2,
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
      calculateSubmittedFuelPerPlayers(players, gameOver, amountOfAllocatedPoints);
      setRoundIsFinsihed(false);
    }
  }, [isRolling, players, roundIsFinished, gameOver, amountOfAllocatedPoints]);


  // INITIAL USE EFFECT
  useEffect(() => {
    if (smartAccountAddress && gameState?.progress && String(raceId).length) {
      // @ts-ignore
      const game2state = gameState.progress.game2[version].game;
      console.log(">>>>>>>>>>> INIT AFTER LEAVE <<<<<<<<<<<", {game2state});

      /*
        fuel: 0
        gameReached: false
        isCompleted: false
        isEliminated: false
        isPending: false
        isWon: false
        maxAvailableFuel: 10
        waitingToFinish: false
        pointsAllocated: 0
      */
      
      
      if (game2state.isEliminated) {
        setGameOver(true);
        setIsRolling(false);
        setGameCompleted(true);
        setUserIsLost(true);
        openLoseModal();
        handleFinishTunnelGame(raceId as string, false, Number.MAX_VALUE, 0, true);
      }
      
      if (game2state.pointsAllocated.toString().length) {
        setAmountOfAllocatedPoints(game2state.pointsAllocated);
      }
    }
  }, [smartAccountAddress, raceId]);


  const handleFinishTunnelGame = async(
    raceId: string, 
    isWon: boolean, 
    playersLeft: number, 
    amountOfPointsToAllocate: number, 
    finishPermanently?: boolean
  ) => {
    //setIsRolling(true);
    pause();
    
    if (!gameOver) {
      setGameOver(true);
      !isWon && setUserIsLost(true);

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

    if (playersLeft === 1 || finishPermanently) {
      setGameCompleted(true);
      //openLoadingModal();
      console.log("FINISH TUNNEL GAME:", {raceid: Number(raceId), isWon, smartAccountClient, amountOfPointsToAllocate})

      // try to recall tx sending on error
      txAttempts(
        10, 
        async () => {
          return await finishTunnelGame(Number(raceId), isWon, smartAccountClient, amountOfPointsToAllocate).then(async data => {
            await waitForTransactionReceipt(config, {
              hash: data,
              confirmations: 2,
            });
          });
        },
        3000
      )
      .catch(console.log)
      .finally(() => {
        if (isWon) {
          setModalType(undefined);
          openWinModal();
        } else {
          setModalType(undefined);
          openLoseModal();
        }
      });
    }
  }


  // function that will end the game for the user with the lowest fuel amount
  const calculateSubmittedFuelPerPlayers = async(players: ConnectedUser[], isGameOver: boolean, lastAmountOfAllocatedPoints: number) => {
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
    console.log("BONUSES", {bonuses});

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

    console.log("AFTER APPLYING BONUSES", newListOfPlayers)

    const remainingPlayersCount = newListOfPlayers.length;

      // if user was playing with himself
      if (remainingPlayersCount === 0) {
        console.log("YOU WIN! BETTER PLAYING WITH OTHER USERS :)");
        handleFinishTunnelGame(raceId as string, true, remainingPlayersCount, 3, true);
        setIsRolling(false);
        return;
      }

      // if only one user got bonus (second-to-last one doesn’t consume fuel)
      if (bonuses.length <= 1) {
        // if user has lost the game
        if (!newListOfPlayers.find(i => i.address === smartAccountAddress) && remainingPlayersCount > 0) {
          console.log("YOU LOSE :(")
          socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-eliminate",
            version,
          });
  
          if (!isGameOver) {
            const amountOfPointsToAllocate = remainingPlayersCount <= 3 ? (3 - remainingPlayersCount) : 0;
            setAmountOfAllocatedPoints(amountOfPointsToAllocate);
            handleFinishTunnelGame(raceId as string, false, remainingPlayersCount, amountOfPointsToAllocate);
          } else {
            handleFinishTunnelGame(raceId as string, false, remainingPlayersCount, lastAmountOfAllocatedPoints);
          }
  
          setIsRolling(false);
          return;
        }
  
        // if the user is one in players array -> he won
        if (remainingPlayersCount === 1 && newListOfPlayers[0].address === smartAccountAddress) {
          console.log("YOU WIN!");
          setAmountOfAllocatedPoints(3);
          handleFinishTunnelGame(raceId as string, true, remainingPlayersCount, 3);
          setIsRolling(false);
          return;
        }
  
        // if all the remaining players are sitting with 0 available fuel
        if (newListOfPlayers.map(i => i.maxAvailableFuel).every(i => i == 0)) {
          console.log("YOU LOSE :( (all 0)")
          socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game2-eliminate",
            version
          });
          handleFinishTunnelGame(raceId as string, false, remainingPlayersCount, lastAmountOfAllocatedPoints, true);
          return;
        }
      }

      setTimeout(() => {
        //setMaxFuel(maxFuel - (newListOfPlayers.find(i => i.address == smartAccountAddress)?.Fuel || 0));
        console.log("SETTING MAX FUEL:", newListOfPlayers.find(i => i.address == smartAccountAddress)?.maxAvailableFuel || 0)
        setMaxFuel(newListOfPlayers.find(i => i.address == smartAccountAddress)?.maxAvailableFuel || 0);
        setDisplayNumber(0);
  
        // refetch users data
        if (newListOfPlayers.length > 1) {
          console.log("next round... time reset");
          const time = new Date();
          time.setSeconds(time.getSeconds() + 10);
          restart(time);
        }
      }, 6000);
  }

  function onNextGameClicked() {
    openWaitingModal();
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game2-wait-to-finish",
      version
    });
  }

  function openWinModal() {
    console.log("OPEN WIN MODAL");
    setIsOpen(true);
    setModalType("win");
    setWinModalPermanentlyOpened(true);
  }

  function openLoseModal() {
    console.log("OPEN LOSE MODAL");
    setIsOpen(true);
    setModalType("lose");
    setLoseModalPermanentlyOpened(true);
  }

  function openWaitingModal() {
    setIsOpen(true);
    setModalType("waiting");
  }

  function closeWinLoseModal() {
    setIsOpen(false);
    setModalType(undefined);
    setLoseModalPermanentlyOpened(false);
    setWinModalPermanentlyOpened(false);
    onNextGameClicked();
  }

  function closeWaitingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  return (
    <div className="mx-auto flex w-full flex-col bg-cover bg-bottom relative" style={{ height: `${window.innerHeight}px` }}>
      <p style={{ transform: 'translate(-50%, -50%)' }} className="absolute text-center text-xl font-bold text-white top-[30%] left-[50%] z-50 bg-black p-2 rounded-2xl opacity-80">{userIsLost ? "Eliminated ☠️. Wait for next game!" : displayNumber}</p>
      
      <div className="relative z-50 py-6 bg-black">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-6">
          <UserCount currentAmount={amountOfConnected} requiredAmount={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/>
        </div>
      </div>
      <img src={BG_Carrots} className="scale-[140%] absolute -top-2"/>

      <div className="app-container">
        <FuelBar players={players} />
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
        </div>
        <div className="control-panels mb-5">
          <Lever setDisplayNumber={handleFuelUpdate} displayNumber={displayNumber} maxAvailable={maxFuel} isRolling={totalSeconds === 0 || userIsLost}/>
          <GasolineGauge fuel={maxFuel - displayNumber} version={version as string}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {
              modalType === "waiting" && 
              <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted} replacedText="..."/> 
            }
            {
            //modalType === "loading" && <WaitingForPlayersModal replacedText={`${amountOfPending} pending...`} numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/> 
            }
          </>
        )}
        {loseModalPermanentlyOpened && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} preloadedScore={amountOfAllocatedPoints}/>}
        {winModalPermanentlyOpened  && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} preloadedScore={amountOfAllocatedPoints} gameName="rabbit-hole"/>}
    </div>
  );
}

export default RabbitHoleGame;
