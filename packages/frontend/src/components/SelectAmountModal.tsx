import NextFlag from "../assets/common/flag.png";
import LoadingBackground from "../assets/loading/loading-bg.png";

export type SelectAmountModalProps = {
  handleClose: () => void;
  type: "deposit" | "withdraw",
  handleDeposit: (a: number) => void;
  handleWithdraw: (a: number) => void;
};

function SelectAmountModal({ handleClose }: SelectAmountModalProps) {
  return (
    <div className="win-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={LoadingBackground} alt="loading-bg" />
        <p className="text-xl font-bold text-white text-center mt-10">Select preffered amount to deposit and press confirm</p>
      </div>
      <div className="absolute bottom-0 right-0 w-[40%]">
        <button
          className="absolute mt-[9%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[28px] text-[#18243F] hover:text-white"
          onClick={handleClose}
        >
          Confirm
        </button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  );
}

export default SelectAmountModal;
