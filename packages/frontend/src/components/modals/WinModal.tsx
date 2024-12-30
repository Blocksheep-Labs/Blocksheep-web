"use client"
import { useEffect, useState } from "react";
import WinMain from "../../assets/win/win-main.webp";
import NextFlag from "../../assets/common/flag.png";
import { getScoreAtGameOfUser, getScoreAtRaceOfUser } from "../../utils/contract-functions";
import { useSmartAccount } from "../../hooks/smartAccountProvider";

export type WinModalProps = {
  handleClose: () => void;
  raceId?: number;
  gameIndex?: number;
  preloadedScore?: number;
  gameName: string;
  secondsLeft: number;
};

function WinModal({ handleClose, raceId, gameIndex, preloadedScore, gameName, secondsLeft }: WinModalProps) {
  const { smartAccountAddress } = useSmartAccount();
  const [score, setScore] = useState<null | number>(null);

  useEffect(() => {
    if (raceId?.toString() && gameIndex?.toString() && smartAccountAddress && !preloadedScore) {
      getScoreAtGameOfUser(raceId, gameIndex, smartAccountAddress as `0x${string}`, gameName)
        .then(data => {
          console.log("Get score:", data);
          // wait for tx to finish
          setScore(Number(data));
        });
    }
  }, [raceId, gameIndex, smartAccountAddress, preloadedScore])

  return (
    <div className="win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%] relative">
        <img src={WinMain} alt="loading-bg" />
        { 
          preloadedScore == undefined || !String(preloadedScore).length
          ?
          <p className="text-4xl uppercase text-[#285E19] font-bold w-full mt-10 absolute top-[-20px] text-center">{score?.toString().length ? `+${score}` : "Pls wait..."}</p>
          :
          <p className="text-4xl uppercase text-[#285E19] font-bold w-full mt-10 absolute top-[-25px] text-center">+{preloadedScore}</p>
        }
      </div>
      <div className="absolute bottom-0 right-0 w-[40%]">
        <button
          className="absolute mt-[10%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[23px] text-[#18243F] hover:text-white"
          onClick={handleClose}
        >
          Next ({secondsLeft}s)
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default WinModal;
