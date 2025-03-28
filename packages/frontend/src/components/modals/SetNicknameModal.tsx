import { useRef } from "react";
import NextFlag from "../../assets/common/flag.png";
import RegisteredBackground from "../../assets/loading/set-nick-bg.jpg";


export type RaceModalProps = {
  handleClose: (nick: string) => void;
};


function SetNicknameModal({ handleClose }: RaceModalProps) {
    const ref = useRef<HTMLInputElement | null>(null);

    return (
        <div className="loading-modal absolute inset-0 bg-[rgb(0,0,0,0.75)]">
            <div className="mx-[10%] mb-[40%] mt-[16%]">
                <img src={RegisteredBackground} alt="registering-bg" />
                <div className="mt-5 w-full">
                    <input ref={ref} placeholder="Nickname" className="w-full p-2"/>
                </div>
                <div className="absolute bottom-0 right-0 w-2/5">
                    <button
                        className="absolute mt-[10%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[24px] text-[#18243F] hover:text-white"
                        onClick={() => handleClose(ref.current?.value || Date.now().toString().slice(0, 5))}
                    >
                        Continue
                    </button>
                    <img src={NextFlag} alt="next-flag" />
                </div>
            </div>
        </div>
    );
}

export default SetNicknameModal;
