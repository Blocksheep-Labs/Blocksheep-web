import React, { useEffect } from "react";
import WaitingBackground from "../assets/loading/waiting-players-bg.png";
import { distributeRewardOfTheGame } from "../utils/contract-functions";
import { config } from "../config/wagmi";
import { waitForTransactionReceipt  } from '@wagmi/core';

function WaitingForPlayersModal({
    raceId,
    numberOfPlayersRequired,
    numberOfPlayers,
}: {
    numberOfPlayersRequired: number;
    numberOfPlayers: number;
    raceId: number,
}) {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={WaitingBackground} alt="waiting-for-players-bg" />
        <p className="text-6xl font-bold text-white text-center mt-10">{numberOfPlayers}/{numberOfPlayersRequired}</p>
      </div>
    </div>
  );
}

export default WaitingForPlayersModal;
