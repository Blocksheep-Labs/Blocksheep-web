import NextFlag from "../assets/common/flag.png";
import LoadingBackground from "../assets/loading/loading-bg.png";
import DepositingModalBackground from "../assets/tokens-modals/depositing.png";

export type SelectAmountModalProps = {
  handleClose: () => void;
  type: "deposit" | "withdraw",
};

function SelectAmountModal({ handleClose }: SelectAmountModalProps) {
  return (
    <div className="win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={DepositingModalBackground} alt="loading-bg" />
      </div>
      <div className="absolute bottom-0 right-0 w-[40%]">
        <button
          className="absolute mt-[9%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[28px] text-[#18243F] hover:text-white"
          onClick={handleClose}
        >
          Close
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default SelectAmountModal;
