import React from "react";
import RaceBackground from "../assets/common/race-background.png";
import Sheep from "../assets/gameplay/sheeepy.png";
import BlackSheep from "../assets/common/blacksheep.png";
import { motion } from "framer-motion";

const percent = 61 / 9;

const userIndex = 1;

function RaceBoard({ progress }: { progress: { curr: number; delta: number }[] }) {
  return (
    <div className="relative my-auto inline-block max-h-full max-w-full align-middle">
      <img src={RaceBackground} alt="loading-bg" />
      {progress.map(({ curr, delta }, i) => {
        return (
          <motion.img
            src={i === userIndex ? BlackSheep : Sheep}
            key={i.toString()}
            alt="sheep"
            className={`absolute`}
            style={{
              width: `${percent}%`,
              left: `${percent * i + 19}%`,
              bottom: `${1.8 + (curr + delta) * 10}%`,
            }}
            initial={{ bottom: `${1.8 + curr * 10}%` }}
            animate={{ bottom: `${1.8 + (curr + delta) * 10}%` }}
            transition={{ ease: "easeOut", duration: 2 }}
          />
        );
      })}
    </div>
  );
}

export default RaceBoard;
