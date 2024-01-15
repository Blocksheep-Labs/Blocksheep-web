import React from 'react'
import RaceBackground from '../assets/race/race-background.png'
import NextFlag from '../assets/win/next-flag.png'
import Sheep from '../assets/gameplay/sheeepy.png';

export type RaceModalProps = {
  progress: number[]
  handleClose: () => void
}

const percent = 61 / 9;

const userIndex = 4;

function RaceModal({ progress, handleClose }: RaceModalProps) {
  return (
    <div className='absolute bg-[rgb(153,161,149)] top-0 bottom-0 left-0 right-0' >
      <div className='my-auto inline-block max-w-full max-h-full align-middle relative'>
        <img src={RaceBackground} alt="loading-bg" />
        {
          progress.map((v, i) => {
            return <img src={Sheep} alt="sheep" className={`absolute ${userIndex === i && 'border-2 border-red-500'} `} style={{width: `${percent}%`, left: `${percent * i + 19}%`, bottom: `${1.8 + v*10}%`}} />
          })
        }
      </div>
      
      <div className='absolute bottom-0 right-0 w-[40%]'>
        <button className='absolute font-[Berlin-Bold] text-[#18243F] text-[36px] text-center w-full mt-[5%] -rotate-12' onClick={handleClose}>Next</button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  )
}

export default RaceModal