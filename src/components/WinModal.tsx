import { useEffect, useState } from "react";
import WinMain from "../assets/win/win-main.png";
import NextFlag from "../assets/common/flag.png";
import { getScoreAtGameOfUser } from "../utils/contract-functions";
import { usePrivy } from "@privy-io/react-auth";

export type WinModalProps = {
  handleClose: () => void;
  raceId: number;
  gameIndex: number;
};

function WinModal({ handleClose, raceId, gameIndex }: WinModalProps) {
  const { user } = usePrivy();
  const [score, setScore] = useState<null | number>(null);

  useEffect(() => {
    if (raceId && gameIndex && user?.wallet?.address) {
      getScoreAtGameOfUser(raceId, gameIndex, user.wallet.address as `0x${string}`)
        .then(data => {
          console.log("Get score:", data);
          // wait for tx to finish
          setScore(data as number);
        })
    }
  }, [raceId, gameIndex, user?.wallet?.address])

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
