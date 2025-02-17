import ProgressGradient from "../assets/gameplay/progress-gradient.png";
import Clock from "../assets/common/timer.png";

export type TimerProps = {
  seconds: number;
  percentageRate?: number;
};

function Timer({ seconds, percentageRate=10 }: TimerProps) {
  return (
    <div className="mx-auto flex w-[54%] flex-col items-center">
      <img src={Clock} alt="clock" className="mb-2 w-4" />
      <div className="w-full bg-white">
        <img src={ProgressGradient} className="transition-all duration-500" alt="time" style={{ width: `${seconds * percentageRate}%`, height: 7 }} />
      </div>
    </div>
  );
}

export default Timer;
