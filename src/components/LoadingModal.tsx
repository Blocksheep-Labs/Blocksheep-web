import React, { useEffect } from "react";
import LoadingBackground from "../assets/loading/loading-bg.png";
import { distributeRewardOfTheGame } from "../utils/contract-functions";
import { config } from "../config/wagmi";
import { waitForTransactionReceipt  } from '@wagmi/core';

function LoadingModal({
  raceId, gameIndex, questionIndexes, closeHandler
}: {
  raceId: number,
  gameIndex: number,
  questionIndexes: number[],
  closeHandler: () => void;
}) {
  useEffect(() => {
    if (raceId.toString() && gameIndex.toString() && questionIndexes) {
      distributeRewardOfTheGame(raceId, gameIndex, questionIndexes)
        .then(data => {
          console.log("Distribute reward:", data);
          // wait for tx to finish before finalizing scores on next modal (win / lose modal)
          const waitForTx = async(hash: `0x${string}`) => {
            await waitForTransactionReceipt(config, {
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
  }, []);

  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={LoadingBackground} alt="loading-bg" />
      </div>
    </div>
  );
}

export default LoadingModal;
