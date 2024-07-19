import React, { useEffect } from "react";
import LoadingBackground from "../assets/loading/loading-bg.png";
import { distributeRewardOfTheGame } from "../utils/contract-functions";
function LoadingModal({
  raceId, gameIndex, questionIndex
}: {
  raceId: number,
  gameIndex: number,
  questionIndex: number,
}) {

  useEffect(() => {
    if (raceId && gameIndex && questionIndex) {
      distributeRewardOfTheGame(raceId, gameIndex, questionIndex)
        .then(data => {
          console.log("Distribute reward:", data);
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
