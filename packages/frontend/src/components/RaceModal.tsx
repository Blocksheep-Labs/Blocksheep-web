import React from "react";
import NextFlag from "../assets/common/flag.png";
import RaceBoard from "./RaceBoard";

export type RaceModalProps = {
  progress: { curr: number; delta: number }[];
  handleClose: () => void;
};

function RaceModal({ progress, handleClose }: RaceModalProps) {
  return (
    <div className="race-board absolute inset-0 bg-[rgb(153,161,149)]">
      <RaceBoard progress={progress} />

      <div className="absolute bottom-0 right-0 w-2/5">
        <button
          className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F]"
          onClick={() => {
            handleClose();
          }}
        >
          Next
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default RaceModal;
