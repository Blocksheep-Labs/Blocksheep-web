import RaceBackground from "../assets/common/race-background.png";
import Sheep from "../assets/gameplay/sheeepy.png";
import BlackSheep from "../assets/common/blacksheep.png";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartAccount } from "../hooks/smartAccountProvider";

const percent = 61 / 9;

function RaceBoard({ progress }: { progress: { curr: number; delta: number; address: string }[] }) {
  const {smartAccountAddress} = useSmartAccount();
  console.log("progrewss:", progress)

  return (
    <div className="relative my-auto inline-block max-h-full max-w-full align-middle items-center justify-center">
      <img src={RaceBackground} alt="loading-bg" />
      {progress && progress.map(({ curr, delta, address }, i) => {
        return (
          <motion.div
            key={i.toString()}
            className={`absolute flex flex-col gap-2`}
            style={{
              width: `${percent}%`,
              left: `${percent * i + 19}%`,
              bottom: `${1.8 + (curr + delta) * 10}%`,
            }}
            initial={{ bottom: `${1.8 + curr * 10}%` }}
            animate={{ bottom: `${1.8 + (curr + delta) * 10}%` }}
            transition={{ ease: "easeOut", duration: 2 }}
          >
            <p className="bg-black font-bold text-white text-[10px] absolute top-[-15px] p-1 rounded-xl left-[50%]" style={{ transform: 'translate(-50%, -50%)' }}>{"Newbie"}</p>
            <img src={address === smartAccountAddress ? BlackSheep : Sheep} alt="sheep"/>
          </motion.div>
        );
      })}
    </div>
  );
}

export default RaceBoard;
