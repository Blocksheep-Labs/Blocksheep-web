import NextFlag from "../assets/common/flag.png";
import RegisteringBackground from "../assets/loading/registering-bg.png";


export type RaceModalProps = {
  handleClose: () => void;
};


function RegisteredModal({ handleClose }: RaceModalProps) {
  return (
    <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
      <div className="mx-[10%] mb-[40%] mt-[30%]">
        <img src={RegisteringBackground} alt="registering-bg" />
        <div className="absolute bottom-0 right-0 w-2/5">
            <button
                className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F]"
                onClick={() => {
                    handleClose();
                }}
            >
                OK
            </button>
            <img src={NextFlag} alt="next-flag" />
        </div>
      </div>
    </div>
  );
}

export default RegisteredModal;
