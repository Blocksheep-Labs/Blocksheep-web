import React from "react";
import ProgressGradient from "../assets/gameplay/progress-gradient.png";
import Clock from "../assets/common/timer.png";

export type TimerProps = {
  seconds: number;
};

function Timer({ seconds }: TimerProps) {
  return (
    <div className="mx-auto flex w-[54%] flex-col items-center">
      <img src={Clock} alt="" className="mb-2 w-4" />
      <div className="w-full bg-white">
        <img src={ProgressGradient} alt="" style={{ width: `${seconds * 10}%`, height: 7 }} />
      </div>
    </div>
  );
}

export default Timer;
