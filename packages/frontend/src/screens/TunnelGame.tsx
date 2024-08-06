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

import { useTimer } from "react-timer-hook";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { usePrivy } from "@privy-io/react-auth";
import { getRaceById } from "../utils/contract-functions";
import LoseModal from "../components/LoseModal";

export type ConnectedUser = {
    id: number;
    address: string; 
    src: string; 
    PlayerPosition: number; 
    Fuel: number
}

const GAME_NAME = "tunnel";
const AMOUNT_OF_PLAYERS_PER_RACE = 2;

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
  const [flipState, setFlipState] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);
  const [loseModalPermanentlyOpened, setLoseModalPermanentlyOpened] = useState(false);

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  const { totalSeconds, restart, start, pause, resume } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      handleTunnelChange();
    },
    autoStart: false,
  });

  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    if ((amountOfConnected === AMOUNT_OF_PLAYERS_PER_RACE) && start) {
      socket.emit("get-all-fuel-tunnel", { raceId });
      console.log("starting the game...");
      closeWaitingModal();
      !isRolling && start();
    } else {
      pause();
      !modalIsOpen && openWaitingModal();
    }
  }, [amountOfConnected, start, modalIsOpen, isRolling, raceId]);

  // handle socket eventsd
  useEffect(() => {
    if (user?.wallet?.address) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === AMOUNT_OF_PLAYERS_PER_RACE) {
            setIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected == AMOUNT_OF_PLAYERS_PER_RACE) {
            setIsOpen(false);
            setModalType(undefined);
            // reset timer
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
            resume();
          }
        }
      });

      socket.on('leaved', () => {
        setAmountOfConnected(amountOfConnected - 1);
        if (!modalIsOpen) {
          setIsOpen(true);
        }
        setModalType("waiting");
        // pause timer
        pause();
      });

      socket.on('race-progress', (progress) => {
        setDisplayNumber(progress?.game2?.fuel || 0);
        setMaxFuel(progress?.game2?.maxAvailableFuel || 10);
      });

      socket.on("race-fuel-all-tunnel", (progress) => {
        const usersData = progress.progresses;
        console.log("FUEL TUNNEL DATA", usersData);

        usersData.forEach((i: {userAddress: string, fuel: number, maxAvailableFuel: number}) => {
          if (i.userAddress === user.wallet?.address) {
            setDisplayNumber(i.fuel);
            setMaxFuel(i.maxAvailableFuel);
          }
        });

        // set players list
        setPlayers(usersData.map((i: any, index: number) => {
          return {
            id: index,
            address: i.userAddress,
            src: i.userAddress === user.wallet?.address ? "https://i.ibb.co/vXGDsDD/blacksheep.png" : "https://i.ibb.co/SN7JyMF/sheeepy.png",
            PlayerPosition: i.fuel / 9,
            Fuel: i.fuel,
          }
        }));
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('race-fuel-all-tunnel');
      }
    }
  }, [socket, amountOfConnected, user?.wallet?.address]);

  // fetch required amount of users to wait
  useEffect(() => {
    if (user?.wallet?.address) {
      socket.emit("get-connected", { raceId });
      socket.emit("get-progress", { raceId, userAddress: user.wallet.address });
      socket.emit("get-all-fuel-tunnel", { raceId });
    }
  }, [socket, user?.wallet?.address]); 
  


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

  const handleTunnelChange = () => {
    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game2-set-fuel",
      value: {
        fuel: displayNumber,
        maxAvailableFuel: maxFuel - displayNumber,
      }
    });
    setMaxFuel(maxFuel - displayNumber);
    setIsRolling(true);

    // Close tunnel: Head moves to swallow everything.
    setPhase("CloseTunnel"); 

    // Open tunnel: cars get out
    setTimeout(() => setPhase("OpenTunnel"), 1000);

    // reset and make calculations
    setTimeout(() => {
      setPhase("Reset");
      calculateSubmittedFuelPerPlayers();
      setIsRolling(false);
    }, 16000);

    /*
      setTimeout(() => setIsOpen(true), 16000);
      setTimeout(() => {
        setModalType("loading");
      }, 16000);
      setTimeout(() => {
        setModalType("win");
      }, 17000);
      setIsOpen(true);
    */
  };


  // function that will end the game for the user with the lowest fuel amount
  const calculateSubmittedFuelPerPlayers = () => {
    console.log("CALCULATING THE FUEL...")
    const newListOfPlayers = players.toSorted((a, b) => a.Fuel - b.Fuel).slice(1, players.length);

    console.log("NEW LIST OF PLAYERS:", newListOfPlayers, user?.wallet?.address)
    
    // if user lost the game
    if (!newListOfPlayers.find(i => i.address === user?.wallet?.address)) {
      console.log("YOU LOSE :(")
      pause();
      openLoseModal();
      setLoseModalPermanentlyOpened(true);
      return;
    }

    // if the user is one in players array -> he won
    if (newListOfPlayers.length === 1 && newListOfPlayers[0].address === user?.wallet?.address) {
      console.log("YOU WIN!");
      pause();
      openWinModal();
      setWinModalPermanentlyOpened(true);
      return;
    }

    setPlayers(newListOfPlayers);

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

  function onFinish() {
    openLoadingModal();
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
          <UserCount currentAmount={amountOfConnected} requiredAmount={AMOUNT_OF_PLAYERS_PER_RACE}/>
        </div>
      </div>
      <div className="app-container">
        <FuelBar players={players} />
        <div className="tunnel">
          <PlayerMovement phase={phase} players={players} />
          <Darkness phase={phase} />
          <RabbitHead phase={phase} />
          <RabbitTail phase={phase} />
        </div>
        <div className="control-panels mb-10">
          <Lever setDisplayNumber={handleFuelUpdate} displayNumber={displayNumber} maxAvailable={maxFuel} isRolling={isRolling}/>
          <GasolineGauge fuel={displayNumber * 8.8}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {modalType === "waiting" && <WaitingForPlayersModal raceId={Number(raceId)} numberOfPlayers={amountOfConnected} numberOfPlayersRequired={AMOUNT_OF_PLAYERS_PER_RACE}/> }
            {
              //modalType === "loading" && <LoadingModal raceId={Number(raceId)} gameIndex={10}/>
            }
            {modalType === "lose" && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} gameIndex={10} />}
            {modalType === "win"  && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} gameIndex={10}/>}
            {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} disableBtn={amountOfConnected !== AMOUNT_OF_PLAYERS_PER_RACE}/>}
          </>
        )}

        { winModalPermanentlyOpened  && <WinModal  handleClose={closeWinLoseModal} raceId={Number(raceId)} gameIndex={10}/> }
        { loseModalPermanentlyOpened && <LoseModal handleClose={closeWinLoseModal} raceId={Number(raceId)} gameIndex={10}/> }
    </div>
  );
}

export default TunnelGame;
