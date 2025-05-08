"use client"
import LoseMain from "../../assets/lose/lose-main.webp";
import NextFlag from "../../assets/common/flag.png";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { useEffect, useState } from "react";
import { socket } from "../../utils/socketio";

export type LoseModalProps = {
  handleClose: () => void;
  getScoreOfTheUser: () => Promise<any>;
  secondsLeft: number;
  raceId: number;
};

function LoseModal({ handleClose, raceId, secondsLeft, getScoreOfTheUser }: LoseModalProps) {
    const { smartAccountAddress } = useSmartAccount();
    const [score, setScore] = useState<null | number>(null);
  
    useEffect(() => {
      if (smartAccountAddress) {
        getScoreOfTheUser()
          .then(data => {
            console.log("Get score:", data);
            setScore(Number(data));
          })
      }
    }, [smartAccountAddress]);
  
    // add user points on server side
    useEffect(() => {
      if (score && smartAccountAddress) {
        socket.emit('player-add-points', {
          raceId,
          userAddress: smartAccountAddress,
          points: score,
        });
      }
    }, [score, smartAccountAddress]);

  return (
    <div className="win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%] relative">
        <img src={LoseMain} alt="loading-bg" />
         
        { 
          <p className="text-4xl uppercase text-[#285E19] font-bold w-full mt-10 absolute top-[-20px] text-center">{score?.toString().length ? `+${score}` : "Pls wait..."}</p>
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

export default LoseModal;
