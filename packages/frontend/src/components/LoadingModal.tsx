import { useEffect } from "react";
import LoadingBackground from "../assets/loading/loading-bg.png";
import { distributeRewardOfTheGame } from "../utils/contract-functions";
import { config } from "../config/wagmi";
import { waitForTransactionReceipt  } from '@wagmi/core';
import { useSmartAccount } from "../hooks/smartAccountProvider";

function LoadingModal({
  raceId, gameIndex, questionIndexes, closeHandler, answers
}: {
  raceId: number,
  gameIndex: number,
  questionIndexes: number[],
  closeHandler: () => void;
  answers: any[];
}) {
  const { smartAccountClient } = useSmartAccount();

  useEffect(() => {
    if (raceId.toString() && gameIndex.toString() && questionIndexes && answers.length) {
      console.log("ANSWERS", { answers, answersAreSimilar: new Set(answers).size === 1 });
      distributeRewardOfTheGame(raceId, gameIndex, questionIndexes, smartAccountClient, new Set(answers).size === 1)
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
          closeHandler();
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
