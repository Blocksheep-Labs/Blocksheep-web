
import React, { useState, useEffect } from "react";
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

export type ConnectedUser = {
    id: number;
    socketId: string;
    address: string; 
    src: string; 
    PlayerPosition: number; 
    Fuel: number
}

const GAME_NAME = "tunnel";

function TunnelGame() {
  const { user } = usePrivy();
  const [phase, setPhase] = useState("Default");
  const [players, setPlayers] = useState<ConnectedUser[]>([]);

  const [modalType, setModalType] = useState<string | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [playersJoined, setPlayersJoined] = useState(0);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [displayNumber, setDisplayNumber] = useState(0); // Start with a default of 0

  const [progress, setProgress] = useState(
    Array.from({ length: 9 }, () => {
      return { curr: 0, delta: 0, address: "" };
    }),
  );

  const [flipState, setFlipState] = useState(true);

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  useEffect(() => {
      console.log("flipState set time ", flipState);
      //const time = new Date();
      //time.setSeconds(time.getSeconds() + 10);
      //restart(time);
  }, [flipState]);

  const { totalSeconds, restart, start, pause } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      setFlipState(!flipState);
      handleTunnelChange();
    },
    autoStart: false,
  });

  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    if (playersJoined === 3 && start) {
      //console.log("start")
      closeWaitingModal();
      start();
    } else {
      pause();
      !modalIsOpen && openWaitingModal();
    }
  }, [playersJoined, start, modalIsOpen]);

  // CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected && raceId?.toString().length && user?.wallet?.address) {
      socket.connect();
      socket.emit('connect-live-game', { raceId, userAddress: user?.wallet?.address });
    }

    socket.on('joined', (data) => {
      if (data.game === GAME_NAME) {
        console.log("USER JOINED", data)
        setPlayersJoined(playersJoined + 1);
        const newPlayer: ConnectedUser = {
          socketId: data.socketId,
          address: data.userAddress,
          src: data.userAddress === user?.wallet?.address ? "https://i.ibb.co/vXGDsDD/blacksheep.png" : "https://i.ibb.co/SN7JyMF/sheeepy.png",
          PlayerPosition: 3,
          Fuel: 30,
          id: players.length + 1
        }
        setPlayers([...players, newPlayer]);
      }
    });

    socket.on('changed-game', (data) => {
      if (data.game === GAME_NAME) {
        console.log("CHANGED GAME:", data);
        setPlayersJoined(playersJoined + 1);
        const newPlayer: ConnectedUser = {
          socketId: data.socketId,
          address: data.userAddress,
          src: data.userAddress === user?.wallet?.address ? "https://i.ibb.co/vXGDsDD/blacksheep.png" : "https://i.ibb.co/SN7JyMF/sheeepy.png",
          PlayerPosition: 3,
          Fuel: 30,
          id: players.length + 1
        }
        setPlayers([...players, newPlayer]);
      }

      if (data.previousGame === GAME_NAME) {
        console.log("CHANGED GAME (LEFT)", data);
        setPlayersJoined(playersJoined - 1);
        setPlayers(players.filter(i => i.address !== data.userAddress));
        if (playersJoined !== 3) {
          openWaitingModal();
        }
      }
    });

    socket.on('leaved', (data) => {
      if (data.game === GAME_NAME) {
        console.log("USER LEFT", data);
        setPlayersJoined(playersJoined - 1);
        setPlayers(players.filter(i => i.address !== data.userAddress));
      }
    });

    return () => {
      socket.off('joined');
      socket.off('leaved');
      socket.off('changed-game');
    }
  }, [raceId, socket, playersJoined, user?.wallet?.address]);


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
    }
  }

  const handleTunnelChange = () => {
    setPhase("CloseTunnel"); // Close tunnel: Head moves to swallow everything. Open tunnel: cars get out
    setTimeout(() => setPhase("OpenTunnel"), 1000);
    setTimeout(() => setPhase("Reset"), 16000);
    setTimeout(() => setIsOpen(true), 16000);
    setTimeout(() => {
      setModalType("loading");
    }, 16000);
    setTimeout(() => {
      setModalType("win");
    }, 17000);
    setIsOpen(true);

    setProgress(
      Array.from({ length: 9 }, () => {
        return { curr: 1, delta: 0, address: "" };
      }),
    );

    // setModalType("win")
    // setIsOpen(true)
  };

  function onNextGameClicked() {
    // set
    navigate("/select");
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openWinModal() {
    setIsOpen(true);
    setModalType("win");
  }

  function openWaitingModal() {
    setIsOpen(true);
    setModalType("waiting");
  }

  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeWinModal() {
    setIsOpen(false);
    setModalType(undefined);
    openRaceModal();
  }

  function closeWaitingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openRaceModal() {
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

  useEffect(() => {
    if (modalIsOpen && modalType === "loading") {
      const timer = setTimeout(() => {
        closeLoadingModal();
        openWinModal();
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [modalIsOpen, modalType]);

  useEffect(() => {
    if (modalIsOpen && modalType === "loading") {
      const timer = setTimeout(() => {
        closeLoadingModal();
        openWinModal();
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [modalIsOpen, modalType]);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-tunnel_bg bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={playersJoined}/>
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
          <Lever setDisplayNumber={handleFuelUpdate} displayNumber={displayNumber}/>
          <GasolineGauge fuel={displayNumber * 8.8}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {modalType === "waiting" && <WaitingForPlayersModal raceId={Number(raceId)} numberOfPlayers={playersJoined} numberOfPlayersRequired={3}/> }
            {
              //modalType === "loading" && <LoadingModal raceId={Number(raceId)} gameIndex={10}/>
            }
            {modalType === "win" && <WinModal handleClose={closeWinModal} raceId={Number(raceId)} gameIndex={10}/>}
            {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} />}
          </>
        )}
    </div>
  );
}

export default TunnelGame;
