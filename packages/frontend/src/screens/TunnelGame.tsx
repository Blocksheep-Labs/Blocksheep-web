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
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { usePrivy } from "@privy-io/react-auth";
import { finishTunnelGame, getRaceById, submitFuel } from "../utils/contract-functions";
import LoseModal from "../components/LoseModal";
import { config } from "../config/wagmi";
import { useSmartAccount } from "../hooks/smartAccountProvider";

export type ConnectedUser = {
    id: number;
    address: string; 
    src: string; 
    PlayerPosition: number; 
    Fuel: number
}


function TunnelGame() {
  const { user } = usePrivy();
  const [phase, setPhase] = useState<"Default" | "CloseTunnel" | "OpenTunnel" | "Reset">("Default");
  const [players, setPlayers] = useState<ConnectedUser[]>([]);

  const [modalType, setModalType] = useState<string | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [displayNumber, setDisplayNumber] = useState(0); // Start with a default of 0
  const [maxFuel, setMaxFuel] = useState(10);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);
  const [loseModalPermanentlyOpened, setLoseModalPermanentlyOpened] = useState(false);
  const [amountOfReached, setAmountOfReached] = useState(0);
  const [amountOfPending, setAmountOfPending] = useState(0);
  const [amountOfComplteted, setAmountOfComplteted] = useState(0);
  const {smartAccountClient} = useSmartAccount();
  const [raceData, setRaceData] = useState<any>(undefined);

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
    if (raceData && (amountOfConnected >= raceData.numberOfPlayersRequired - amountOfComplteted) && start) {
      socket.emit("get-all-fuel-tunnel", { raceId });
      console.log("starting the game...");
      closeWaitingModal();
      !isRolling && start();
    } else {
      pause();
      !modalIsOpen && openWaitingModal();
    }
  }, [amountOfConnected, start, modalIsOpen, isRolling, raceId, raceData]);

  // handle socket eventsd
  useEffect(() => {
    if (user?.wallet?.address && raceData) {
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
          openWinModal();
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
          if (i.userAddress === user.wallet?.address) {
            setDisplayNumber(i.fuel);
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
            src: i.userAddress === user.wallet?.address ? "https://i.ibb.co/vXGDsDD/blacksheep.png" : "https://i.ibb.co/SN7JyMF/sheeepy.png",
            PlayerPosition: i.fuel / 9,
            Fuel: i.fuel,
          }
        }));
      });

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "game2-set-fuel") {
          // if the user is sending the TX or finished sending TX
          if (progress.value?.isPending !== undefined) {
            // sending...
            if (progress.value.isPending) {
              raceData.numberOfPlayersRequired - amountOfComplteted <= amountOfPending + 1 && setAmountOfPending(amountOfPending + 1);
            }
            // sent 
            else {
              0 <= amountOfPending - 1 && setAmountOfPending(amountOfPending - 1);
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
              setWinModalPermanentlyOpened(true);
            });
          } else {
            setAmountOfComplteted(amountOfComplteted + 1);
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
  }, [socket, amountOfConnected, user?.wallet?.address, amountOfComplteted, raceData]);

  // fetch required amount of users to wait
  useEffect(() => {
    if (user?.wallet?.address) {
      socket.emit("get-connected", { raceId });
      socket.emit("game2-reach", { raceId, userAddress: user.wallet.address })
      socket.emit("get-progress", { raceId, userAddress: user.wallet.address });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [socket, user?.wallet?.address]); 
  

  useEffect(() => {
    if (amountOfReached !== raceData.numberOfPlayersRequired) {
      closeWaitingModal();
    } else {
      openWaitingModal();
    }
  }, [amountOfReached, amountOfPending]);

  useEffect(() => {
    if (amountOfPending !== 0 && isRolling) {
      openLoadingModal();
    } else {
      closeLoadingModal();
    }
  }, [amountOfPending, isRolling]);

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
    if (raceId?.length && user?.wallet?.address) {
      getRaceById(Number(raceId), user.wallet.address as `0x${string}`).then(data => {
        if (data) {
          // VALIDATE USER FOR BEING REGISTERED
          if (!data.registeredUsers.includes(user.wallet?.address)) {
            navigate('/');
          } 
        }
      });
    }
  }, [raceId, user?.wallet?.address]);


  const handleFuelUpdate = (fuel: number) => {
    if (phase === "Default") {
      setDisplayNumber(fuel);
      socket.emit("update-progress", {
        raceId,
        userAddress: user?.wallet?.address,
        property: "game2-set-fuel",
        value: {
          fuel,
          maxAvailableFuel: maxFuel,
        }
      });
    }
  }

  const handleTunnelChange = async() => {
    setIsRolling(true);

    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game2-set-fuel",
      value: {
        fuel: displayNumber,
        maxAvailableFuel: maxFuel - displayNumber,
        isPending: true,
      }
    });

    await submitFuel(Number(raceId), displayNumber, maxFuel - displayNumber, smartAccountClient)
      .then(async data => {
        await waitForTransactionReceipt(config, {
          hash: data,
          confirmations: 2,
        });

        socket.emit("update-progress", {
          raceId,
          userAddress: user?.wallet?.address,
          property: "game2-set-fuel",
          value: {
            fuel: displayNumber,
            maxAvailableFuel: maxFuel - displayNumber,
            isPending: false,
          }
        });
      });

    setMaxFuel(maxFuel - displayNumber);

    // Close tunnel: Head moves to swallow everything.
    setPhase("CloseTunnel"); 

    // Open tunnel: cars get out
    setTimeout(() => setPhase("OpenTunnel"), 10000);

    // reset and make calculations
    setTimeout(() => {
      setPhase("Reset");
      calculateSubmittedFuelPerPlayers();
      setIsRolling(false);
    }, 16000);
  };


  const handleFinishTunnelGame = async(raceId: string, isWon: boolean) => {
    pause();
    await finishTunnelGame(Number(raceId), isWon, smartAccountClient).then(async data => {
      await waitForTransactionReceipt(config, {
        hash: data,
        confirmations: 2,
      });
      socket.emit("update-progress", {
        raceId,
        userAddress: user?.wallet?.address,
        property: "game2-set-fuel",
        value: { fuel: 10, maxAvailableFuel: 0, isPending: false }
      });

      if (isWon) {
        openWinModal();
        setWinModalPermanentlyOpened(true);
      } else {
        openLoseModal();
        setLoseModalPermanentlyOpened(true);
      }
    });
  }


  // function that will end the game for the user with the lowest fuel amount
  const calculateSubmittedFuelPerPlayers = async() => {
    console.log("CALCULATING THE FUEL...")
    const newListOfPlayers = players.toSorted((a, b) => a.Fuel - b.Fuel).slice(1, players.length);

    console.log("NEW LIST OF PLAYERS:", newListOfPlayers, user?.wallet?.address)

    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game2-set-fuel",
      value: {
        fuel: 0,
        maxAvailableFuel: maxFuel,
        isPending: true,
      }
    });
    
    // if user lost the game
    if (!newListOfPlayers.find(i => i.address === user?.wallet?.address)) {
      console.log("YOU LOSE :(")
      handleFinishTunnelGame(raceId as string, false);
      return;
    }

    // if the user is one in players array -> he won
    if (newListOfPlayers.length === 1 && newListOfPlayers[0].address === user?.wallet?.address) {
      console.log("YOU WIN!");
      handleFinishTunnelGame(raceId as string, true);
      return;
    }

    setPlayers(newListOfPlayers);
    setDisplayNumber(0);

    // update timer
    time.setSeconds(time.getSeconds() + 10);
    restart(time);

    // refetch users data
    socket.emit("get-all-fuel-tunnel", { raceId });
  }

  function onNextGameClicked() {
    // set
    navigate("/select");
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openWinModal() {
    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game2-complete",
      value: {
        isWon: true,
      }
    });
    setIsOpen(true);
    setModalType("win");
  }

  function openLoseModal() {
    setIsOpen(true);
    setModalType("lose");
    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game2-complete",
      value: {
        isWon: false,
      }
    });
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
    getRaceById(Number(raceId), user?.wallet?.address as `0x${string}`).then(data => {
      if (data) {
        let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
          return { curr: Number(i.progress), delta: 0, address: i.user };
        });
        setProgress(newProgress);
      }
    });
  }

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-tunnel_bg bg-cover bg-bottom">
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
          <GasolineGauge fuel={displayNumber * 8.8}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/> }
            {modalType === "loading" && <WaitingForPlayersModal replacedText="Pending..." numberOfPlayers={amountOfConnected} numberOfPlayersRequired={(raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/> }
            {modalType === "lose"    && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} />}
            {modalType === "win"     && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} />}
            {modalType === "race"    && <RaceModal progress={progress} handleClose={closeRaceModal} disableBtn={amountOfConnected !== (raceData?.numberOfPlayersRequired || 9) - amountOfComplteted}/>}
          </>
        )}
        { winModalPermanentlyOpened  && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} /> }
        { loseModalPermanentlyOpened && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} /> }
    </div>
  );
}

export default TunnelGame;
