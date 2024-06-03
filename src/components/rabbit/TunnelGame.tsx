// @ts-nocheck

import React, { useState, useEffect } from "react";
import FuelBar from "./FuelBar";
import PlayerMovement from "./PlayerMovement";
import Darkness from "./Darkness";
import RabbitHead from "./RabbitHead";
import RabbitTail from "./RabbitTail";
import Lever from "./Lever";
import GasolineGauge from "./GasolineGauge";
import WinModal from "../WinModal";
import LoadingModal from "../LoadingModal";
import RaceModal from "../RaceModal";
import Timer from "../Timer";
import UserCount from "../UserCount";

import { useTimer } from "react-timer-hook";
import { randomInt } from "crypto";
import { useNavigate } from "react-router-dom";

function TunnelGame() {
  const [phase, setPhase] = useState("Default");
  const [players, setPlayers] = useState([
    { id: "player1", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 2, Fuel: 80 },
    { id: "player2", src: "https://i.ibb.co/vXGDsDD/blacksheep.png", PlayerPosition: 1, Fuel: 30 },
    { id: "player3", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 3, Fuel: 20 },
  ]);

  const [modalType, setModalType] = useState(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const navigator = useNavigate();

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

  const { totalSeconds, restart } = useTimer({
    expiryTimestamp: time,
    onExpire: () => setFlipState(!flipState),
  });

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
  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeWinModal() {
    setIsOpen(false);
    setModalType(undefined);
    openRaceModal();
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
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount />
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
        <div className="control-panels">
          <Lever />
          <GasolineGauge />
        </div>

        {modalIsOpen && (
          <>
            {modalType === "loading" && <LoadingModal />}
            {modalType === "win" && <WinModal handleClose={closeWinModal} />}
            {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} />}
          </>
        )}
      </div>

      {/* 
      {modalIsOpen && (
        <>
          {modalType === "loading" && <LoadingModal />}
          {modalType === "win" && <WinModal handleClose={closeWinModal} />}
          {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} />}
        </>
      )} */}
    </div>
  );
}

export default TunnelGame;
