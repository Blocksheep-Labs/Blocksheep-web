import NextFlag from "../assets/common/flag.png";
import BullrunRulesGrid from "./BullrunRulesGrid";


export type BullrunRulesModalProps = {
  handleClose: () => void;
  timeToStart: string;
  pointsMatrix: number[][];
};


function BullrunRulesModal({ handleClose, timeToStart, pointsMatrix }: BullrunRulesModalProps) {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[0%] mb-[40%] mt-[30%] flex items-center flex-col">
        <BullrunRulesGrid pointsMatrix={pointsMatrix}/>
        <div className="absolute bottom-0 right-0 w-2/5">
            <button
                className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F] hover:text-white"
                onClick={() => {
                    handleClose();
                }}
            >
                Close
            </button>
            <img src={NextFlag} alt="next-flag" />
        </div>
        <div className="mt-5">
            <p className="text-lg font-bold text-white text-center">Round ends in:</p>
            <p className="text-5xl font-bold text-white text-center">{timeToStart}s</p>
        </div>
      </div>
    </div>
  );
}

export default BullrunRulesModal;
