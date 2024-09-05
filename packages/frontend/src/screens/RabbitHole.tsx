import { useState, useEffect } from "react";
import FuelBar from "../components/rabbit/FuelBar";
import PlayerMovement from "../components/rabbit/PlayerMovement";
import Darkness from "../components/rabbit/Darkness";
import RabbitHead from "../components/rabbit/RabbitHead";
import RabbitTail from "../components/rabbit/RabbitTail";
import Lever from "../components/rabbit/Lever";
import GasolineGauge from "../components/rabbit/GasolineGauge";
import WinModal from "../components/WinModal";
import LoadingModal from "../components/LoadingModal";
import RaceModal from "../components/RaceModal";
import Timer from "../components/Timer";
import UserCount from "../components/UserCount";
import { waitForTransactionReceipt  } from '@wagmi/core';
import { useTimer } from "react-timer-hook";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { usePrivy } from "@privy-io/react-auth";
import { finishTunnelGame, getRaceById, submitFuel } from "../utils/contract-functions";
import LoseModal from "../components/LoseModal";
import { config } from "../config/wagmi";
import { useSmartAccount } from "../hooks/smartAccountProvider";
import BlackSheep from "../assets/rabbit-hole/blacksheep.png";
import WhiteSheep from "../assets/rabbit-hole/sheeepy.png";

export type ConnectedUser = {
    id: number;
    address: string; 
    src: string; 
    PlayerPosition: number; 
    Fuel: number
}

export type RabbitHolePhases = "Default" | "CloseTunnel" | "OpenTunnel" | "Reset" | "Fall";


function RabbitHoleGame() {
  const {smartAccountAddress} = useSmartAccount();
  const [phase, setPhase] = useState<RabbitHolePhases>("Default");
  const [players, setPlayers] = useState<ConnectedUser[]>([]);
  const location = useLocation();
  const [modalType, setModalType] = useState<string | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [displayNumber, setDisplayNumber] = useState(0); // Start with a default of 0
  const [maxFuel, setMaxFuel] = useState(10);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [amountOfReached, setAmountOfReached] = useState(0);
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

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  const { totalSeconds, restart, start, pause } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      console.log("Time expired.")
      handleTunnelChange();
    },
    autoStart: false,
  });

  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    //console.log({amountOfConnected, start, modalIsOpen, isRolling, raceId, raceData})
    if (!gameStarted && raceData && (amountOfConnected >= raceData.numberOfPlayersRequired - amountOfComplteted)) {
      setGameStarted(true);
      console.log("STARTING THE GAME...")
      if (raceData && (amountOfConnected >= raceData.numberOfPlayersRequired - amountOfComplteted) && start) {
        socket.emit("get-all-fuel-tunnel", { raceId });
        //closeWaitingModal();
        !isRolling && start();
      } else {
        pause();
        !modalIsOpen && openWaitingModal();
      }
    }
  }, [amountOfConnected, start, modalIsOpen, isRolling, raceId, raceData]);

  // handle socket eventsd
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount >= raceData.numberOfPlayersRequired - amountOfComplteted) {
            setIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected == raceData.numberOfPlayersRequired - amountOfComplteted) {
            setIsOpen(false);
            setModalType(undefined);
            // reset timer
            console.log("UPDATE TIMER")
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
          }
        }
      });

      
      socket.on('leaved', () => {
        setAmountOfConnected(amountOfConnected - 1);
        if (amountOfConnected - 1 == 1) {
          pause();
          if (modalIsOpen) {
            setIsOpen(false);
            setModalType(undefined);
          }
          handleFinishTunnelGame(String(raceId), true, 1);
        }
      });

      socket.on('race-progress', (progress) => {
        setDisplayNumber(progress?.game2?.fuel || 0);
        setMaxFuel(progress?.game2?.maxAvailableFuel || 10);
      });

      
      socket.on("race-fuel-all-tunnel", (progress) => {

        const usersData = progress.progresses;

        console.log("FUEL TUNNEL DATA", usersData);

        let amountOfReachedPerGame2 = 0;
        let amountPendingPerGame2 = 0;
        let amountOfCompleted = 0;

        usersData.forEach((i: {userAddress: string, fuel: number, maxAvailableFuel: number, gameReached: boolean, isPending: boolean, isCompleted: boolean}) => {
          if (i.userAddress === smartAccountAddress) {
            //setDisplayNumber(i.fuel);
            setMaxFuel(i.maxAvailableFuel);
          }
          i.gameReached && amountOfReachedPerGame2++;
          i.isPending && amountPendingPerGame2++;
          i.isCompleted && amountOfCompleted++;
        });

        setAmountOfReached(amountOfReachedPerGame2);
        setAmountOfComplteted(amountOfCompleted);

        // set players list
        setPlayers(usersData.filter((i: any) => !i.isCompleted).map((i: any, index: number) => {
          return {
            id: index,
            address: i.userAddress,
            src: i.userAddress === smartAccountAddress ? BlackSheep : WhiteSheep,
            PlayerPosition: i.fuel / 9,
            Fuel: i.fuel,
          }
        }));
      });
      

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "game2-set-fuel") {
          // if the user is sending the TX or finished sending TX
          if (progress.value?.isPending != undefined) {
            // sending...
            if (progress.value.isPending) {
              console.log(
                "IS PENDING PROP:", 
                { 
                  max: raceData.numberOfPlayersRequired - amountOfComplteted,
                  amountOfPending: amountOfPending + 1,
                }
              );
              setAmountOfPending(amountOfPending + 1);
            }
            // sent 
            else {
              console.log("TX WAS SENT:", { 
                max: raceData.numberOfPlayersRequired - amountOfComplteted,
                amountOfPending: amountOfPending - 1,
              })
              setAmountOfPending(amountOfPending - 1);
            }
          }
        }

        if (progress.property === "game2-complete") {
          if (raceData.numberOfPlayersRequired - (amountOfComplteted + 1) === -1) {
            await finishTunnelGame(Number(raceId), true, smartAccountClient).then(async data => {
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
          if (amountOfPlayersnextClicked + 1 >= raceData.numberOfPlayersRequired) {
            closeLoadingModal();
            navigate(`/race/${raceId}/bullrun/preview`, {
              state: location.state
            });
          }
        }
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('race-fuel-all-tunnel');
        socket.off('progress-updated');
      }
    }
  }, [socket, amountOfConnected, smartAccountAddress, amountOfComplteted, raceData, amountOfPlayersnextClicked, gameOver, amountOfPending]);

  // fetch required amount of users to wait
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      socket.emit("get-connected", { raceId });
      socket.emit("game2-reach", { raceId, userAddress: smartAccountAddress })
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [socket, smartAccountAddress, raceData]); 
  

  useEffect(() => {
    if (raceData && !isRolling) {
      console.log(">>>>>>>>>>>>>> EFFECT <<<<<<<<<<<<<<<<")
      if (amountOfReached !== raceData.numberOfPlayersRequired) {
        console.log("Amount of players is enough, closing waiting modal...");
        closeWaitingModal();
      }
    }
  }, [amountOfReached, amountOfPending, raceData, isRolling]);

  /*
  useEffect(() => {
    if (amountOfPending !== 0 && isRolling) {
      openLoadingModal();
    } else {
      closeLoadingModal();
    }
  }, [amountOfPending, isRolling]);
  */

  // kick player if page chnages (closes)
  useEffect(() => {
    const handleTabClosing = () => {
      openLoseModal();
    }
    window.addEventListener('unload', handleTabClosing);
    return () => {
      window.removeEventListener('unload', handleTabClosing);
    }
  }, [openLoseModal]);


  // CHECK USER TO BE REGISTERED
  useEffect(() => {
    if (raceId?.length && smartAccountAddress) {
      getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
        if (data) {
          // VALIDATE USER FOR BEING REGISTERED
          if (!data.registeredUsers.includes(smartAccountAddress)) {
            navigate('/');
          } 
          setRaceData(data);
        }
      });
    }
  }, [raceId, smartAccountAddress]);

  // START THE TUNNEL IF ALL USERS ARE DONE WITH TX-s
  useEffect(() => {
    if (isRolling && amountOfPending === 0 && raceId?.toString().length) {
      console.log("TUNNEL CHANGE", {displayNumber, maxFuel});
      socket.emit("get-all-fuel-tunnel", { raceId });
      closeLoadingModal();

      // Close tunnel: Head moves to swallow everything.
      setPhase("CloseTunnel"); 

      // Open tunnel: cars get out
      setTimeout(() => setPhase("OpenTunnel"), 10000);

      // reset and make calculations
      setTimeout(() => {
        setPhase("Reset");
        setRoundIsFinsihed(true);
        setIsRolling(false);
      }, 16000);
    } else if (isRolling && amountOfPending > 0 && raceId?.toString().length) {
      openLoadingModal();
    }
  }, [isRolling, raceData, socket, raceId, amountOfPending]);


  const handleFuelUpdate = (fuel: number) => {
    if (!isRolling && !gameOver && fuel <= maxFuel) {
      console.log({fuel, phase})
      setDisplayNumber(fuel);
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-set-fuel",
        value: {
          fuel,
          maxAvailableFuel: maxFuel,
        }
      });
    }
  }

  const handleTunnelChange = async() => {
    if (gameCompleted) 
      return;

    pause();
    if (!gameOver) {
      socket.emit("update-progress", {
        raceId,
        userAddress: smartAccountAddress,
        property: "game2-set-fuel",
        value: {
          fuel: displayNumber,
          maxAvailableFuel: maxFuel - displayNumber,
          isPending: true,
        }
      });
  
      setTimeout(async() => {
        setIsRolling(true);
        await submitFuel(Number(raceId), displayNumber, maxFuel - displayNumber, smartAccountClient)
          .then(async data => {
            await waitForTransactionReceipt(config, {
              hash: data,
              confirmations: 2,
            });
    
            socket.emit("update-progress", {
              raceId,
              userAddress: smartAccountAddress,
              property: "game2-set-fuel",
              value: {
                fuel: displayNumber,
                maxAvailableFuel: maxFuel - displayNumber,
                isPending: false,
              }
            });
          });
      }, 1000);
    } else {
      setTimeout(() => {
        setIsRolling(true);
      }, 1000);
    }
  };

  useEffect(() => {
    if (players && !isRolling && roundIsFinished) {
      calculateSubmittedFuelPerPlayers(players);
      setRoundIsFinsihed(false);
    }
  }, [isRolling, players, roundIsFinished]);


  const handleFinishTunnelGame = async(raceId: string, isWon: boolean, playersLeft: number) => {
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
        }
      });
    }

    if (playersLeft === 1) {
      setGameCompleted(true);
      openLoadingModal();
      await finishTunnelGame(Number(raceId), isWon, smartAccountClient).then(async data => {
        await waitForTransactionReceipt(config, {
          hash: data,
          confirmations: 2,
        });

        closeLoadingModal();

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
  const calculateSubmittedFuelPerPlayers = async(players: ConnectedUser[]) => {
    console.log("CALCULATING THE FUEL...", {players});
    const submittedFuelIsSimilar = players.every(i => i.Fuel === players[0].Fuel);
    console.log({submittedFuelIsSimilar})

    let newListOfPlayers;
    if (!submittedFuelIsSimilar) {
      newListOfPlayers = players.toSorted((a, b) => a.Fuel - b.Fuel).slice(1, players.length);
    } else {
      newListOfPlayers = players;
    }

    console.log("NEW LIST OF PLAYERS:", newListOfPlayers, newListOfPlayers.map(i => i.address).includes(smartAccountAddress as string))

    /*
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game2-set-fuel",
      value: {
        fuel: 0,
        maxAvailableFuel: maxFuel,
        isPending: true,
      }
    });
    */

    const remainingPlayersCount = newListOfPlayers.length;

      // if user was playing with himself
      if (remainingPlayersCount === 0) {
        console.log("YOU WIN! BETTER PLAYING WITH OTHER USERS :)");
        handleFinishTunnelGame(raceId as string, true, remainingPlayersCount);
        setIsRolling(false);
        //return;
      }

      // if user lost the game
      if (!newListOfPlayers.find(i => i.address === smartAccountAddress) && remainingPlayersCount > 0) {
        console.log("YOU LOSE :(")
        handleFinishTunnelGame(raceId as string, false, remainingPlayersCount);
        setIsRolling(false);
        //return;
      }

      // if the user is one in players array -> he won
      if (remainingPlayersCount === 1 && newListOfPlayers[0].address === smartAccountAddress) {
        console.log("YOU WIN!");
        handleFinishTunnelGame(raceId as string, true, remainingPlayersCount);
        setIsRolling(false);
        //return;
      }

      setPlayers(newListOfPlayers);
      //setMaxFuel(maxFuel - displayNumber);
      setDisplayNumber(0);

      // refetch users data
      //return;
      console.log("next round... time reset");
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restart(time);
      //socket.emit("get-all-fuel-tunnel", { raceId });
      //setPhase("Default");
      //setIsRolling(false);
  }

  function onNextGameClicked() {
    openLoadingModal();
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game2-wait-to-finish",
    });
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openWinModal() {
    setIsOpen(true);
    setModalType("win");
  }

  function openLoseModal() {
    setIsOpen(true);
    setModalType("lose");
  }

  function openWaitingModal() {
    setIsOpen(true);
    setModalType("waiting");
  }

  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeWinLoseModal() {
    setIsOpen(false);
    setModalType(undefined);
    openRaceModal();
  }

  function closeWaitingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openRaceModal() {
    console.log("open race modal");
    fetchRaceData();
    setIsOpen(true);
    setModalType("race");
  }

  function closeRaceModal() {
    setIsOpen(false);
    setModalType(undefined);
    onNextGameClicked();
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

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-tunnel_bg bg-cover bg-bottom relative">
      <p style={{ transform: 'translate(-50%, -50%)' }} className="absolute text-center text-xl font-bold text-white top-[30%] left-[50%] z-50 bg-black p-2 rounded-2xl opacity-80">{userIsLost ? "Player eliminated, pls wait for the next game" : displayNumber}</p>
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfConnected} requiredAmount={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/>
        </div>
      </div>
      <div className="app-container">
        <FuelBar players={players} />
        <div className="tunnel">
          <PlayerMovement phase={phase} players={players} />
          <RabbitHead phase={phase} />
          <Darkness   phase={phase} />
          <RabbitTail phase={phase} />
        </div>
        <div className="control-panels mb-10">
          <Lever setDisplayNumber={handleFuelUpdate} displayNumber={displayNumber} maxAvailable={maxFuel} isRolling={isRolling}/>
          <GasolineGauge fuel={(maxFuel - displayNumber) * 8.8}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/> }
            {modalType === "loading" && <WaitingForPlayersModal replacedText="Pending..." numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/> }
            {modalType === "lose"    && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} preloadedScore={0}/>}
            {modalType === "win"     && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} preloadedScore={1}/>}
            {modalType === "race"    && <RaceModal progress={progress} handleClose={closeRaceModal} disableBtn={false}/>}
          </>
        )}
    </div>
  );
}

export default RabbitHoleGame;
