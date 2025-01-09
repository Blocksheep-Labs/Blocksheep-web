"use client"
import LoseMain from "../../assets/lose/lose-main.webp";
import NextFlag from "../../assets/common/flag.png";

export type LoseModalProps = {
  handleClose: () => void;
  raceId?: number;
  gameIndex?: number;
  preloadedScore?: number;
  secondsLeft: number;
};

function LoseModal({ handleClose, raceId, gameIndex, preloadedScore, secondsLeft }: LoseModalProps) {
  return (
    <div className="win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%] relative">
        <img src={LoseMain} alt="loading-bg" />
        { 
          !preloadedScore
          ?
          <p className="text-4xl uppercase text-[#285E19] font-bold w-full mt-10 absolute top-[-25px] text-center">+0</p>
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

export default LoseModal;
