import React from "react";
import WinMain from "../assets/win/win-main.png";
import NextFlag from "../assets/common/flag.png";

export type WinModalProps = {
  handleClose: () => void;
};

function WinModal({ handleClose }: WinModalProps) {
  return (
    <div className=" win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={WinMain} alt="loading-bg" />
      </div>
      <div className="absolute bottom-0 right-0 w-[40%]">
        <button
          className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F]"
          onClick={handleClose}
        >
          Next
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default WinModal;
