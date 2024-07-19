import React, { useEffect } from "react";
import LoadingBackground from "../assets/loading/loading-bg.png";
import { distributeRewardOfTheGame } from "../utils/contract-functions";
import { config } from "../config/wagmi";
import { waitForTransactionReceipt  } from '@wagmi/core';

function LoadingModal({
  raceId, gameIndex, questionIndex, closeHandler
}: {
  raceId: number,
  gameIndex: number,
  questionIndex: number,
  closeHandler: () => void;
}) {

  useEffect(() => {
    if (raceId && gameIndex && questionIndex) {
      distributeRewardOfTheGame(raceId, gameIndex, questionIndex)
        .then(data => {
          console.log("Distribute reward:", data);
          // wait for tx to finish before finalizing scores on next modal (win / lose modal)
          const waitForTx = async(hash: `0x${string}`) => {
            waitForTransactionReceipt(config, {
              confirmations: 2,
              hash,
            });
            closeHandler();
          }
          waitForTx(data);
        }).catch(err => {
          console.log("Distribute reward error:", err);
        });
    }
  }, [raceId, gameIndex, questionIndex]);

  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={LoadingBackground} alt="loading-bg" />
      </div>
    </div>
  );
}

export default LoadingModal;
