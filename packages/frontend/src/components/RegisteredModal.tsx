import NextFlag from "../assets/common/flag.png";
import RegisteredBackground from "../assets/loading/registered-bg.png";


export type RaceModalProps = {
  handleClose: () => void;
  timeToStart: string;
};


function RegisteredModal({ handleClose, timeToStart }: RaceModalProps) {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={RegisteredBackground} alt="registering-bg" />
        <div className="absolute bottom-0 right-0 w-2/5">
            <button
                className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F] hover:text-white"
                onClick={() => {
                    handleClose();
                }}
            >
                Ok
            </button>
            <img src={NextFlag} alt="next-flag" />
        </div>
        <div className="mt-5">
            <p className="text-lg font-bold text-white text-center">Ends at:</p>
            <p className="text-5xl font-bold text-white text-center">{timeToStart}</p>
        </div>
      </div>
    </div>
  );
}

export default RegisteredModal;
