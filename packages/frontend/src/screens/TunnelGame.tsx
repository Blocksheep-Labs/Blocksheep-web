// @ts-nocheck

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
import { randomInt } from "crypto";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { usePrivy } from "@privy-io/react-auth";
import { getRaceById } from "../utils/contract-functions";

function TunnelGame() {
  const { user } = usePrivy();
  const [phase, setPhase] = useState("Default");
  const [players, setPlayers] = useState([
    { id: "player1", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 2, Fuel: 80 },
    { id: "player2", src: "https://i.ibb.co/vXGDsDD/blacksheep.png", PlayerPosition: 1, Fuel: 30 },
    { id: "player3", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 3, Fuel: 20 },
  ]);

  const [modalType, setModalType] = useState(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [playersJoined, setPlayersJoined] = useState(0);
  const navigator = useNavigate();
  const {raceId} = useParams();
  const [displayNumber, setDisplayNumber] = useState(0); // Start with a default of 0

  const [progress, setProgress] = useState(
    Array.from({ length: 9 }, () => {
      return { curr: 0, delta: 0 };
    }),
  );

  const [flipState, setFlipState] = useState(true);

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  useEffect(() => {
      console.log("flipState set time ", flipState);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restart(time);
  }, [flipState]);

  const { totalSeconds, restart, start, pause } = useTimer({
    expiryTimestamp: time,
    onExpire: () => setFlipState(!flipState),
    autoStart: false,
  });


  // WAIT FOR PLAYERS TO JOIN
  useEffect(() => {
    if (playersJoined === 1 && start) {
      console.log("start")
      closeWaitingModal();
      start();
    } else {
      pause();
      !modalIsOpen && openWaitingModal();
    }
  }, [playersJoined, start, modalIsOpen]);


  // CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected && raceId?.toString().length) {
      socket.connect();
      socket.emit('connect-live-game', { raceId });
    }

    socket.on('joined', () => {
      setPlayersJoined(playersJoined + 1);
    });

    socket.on('leaved', () => {
      setPlayersJoined(playersJoined - 1);
    });

    return () => {
      socket.off('joined');
    }
  }, [raceId, socket, playersJoined]);


  // CCHECK USER TO BE REGISTERED
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

  // Function to update player positions, if needed
  // const updatePlayerPosition = (id, newPosition) => {
  //   setPlayers((currentPlayers) =>
  //     currentPlayers.map((player) =>
  //       player.id === id ? { ...player, PlayerPosition: newPosition } : player,
  //     ),
  //   );
  // };

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
        return { curr: 1, delta: 0 };
      }),
    );

    // setModalType("win")
    // setIsOpen(true)
  };

  function onNextGameClicked() {
    // set
    navigator("/select");
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
        <button
          id="StartTunnel"
          onClick={() => {
            handleTunnelChange();
          }}
        >
          Play
        </button>
        <div className="control-panels mb-10">
          <Lever setDisplayNumber={setDisplayNumber} displayNumber={displayNumber}/>
          <GasolineGauge fuel={displayNumber * 8.8}/>
        </div>

      </div>
        {modalIsOpen && (
          <>
            {modalType === "waiting" && <WaitingForPlayersModal raceId={raceId} numberOfPlayers={playersJoined} numberOfPlayersRequired={3}/> }
            {modalType === "loading" && <LoadingModal />}
            {modalType === "win" && <WinModal handleClose={closeWinModal} />}
            {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} />}
          </>
        )}
    </div>
  );
}

export default TunnelGame;
