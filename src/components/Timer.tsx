import React from 'react'
import ProgressGradient from "../assets/gameplay/progress-gradient.png";
import Clock from "../assets/gameplay/timer.png";

export type TimerProps = {
  seconds: number;
}

function Timer({ seconds }: TimerProps) {
  console.log("seconds", seconds)
  return (
    <div className='w-[54%] mx-auto flex flex-col items-center'>
      <img src={Clock} alt="" className='w-4 mb-2'/>
      <div className='bg-white w-full'>
        <img src={ProgressGradient} alt="" style={{width: `${seconds*10}%`, height: 7}}/>
      </div>
    </div>
  )
}

export default Timer