import React from 'react'
import WinMain from '../assets/win/win-main.png'
import NextFlag from '../assets/win/next-flag.png'

export type WinModalProps = {
  handleClose: () => void
}

function WinModal({handleClose}: WinModalProps) {
  return (
    <div className='absolute bg-[rgb(0,0,0,0.75)] top-0 bottom-0 left-0 right-0' >
      <div className='mx-[10%] mt-[30%] mb-[40%]'>
        <img src={WinMain} alt="loading-bg"/>
      </div>
      <div className='absolute bottom-0 right-0 w-[40%]'>
        <button className='absolute font-[Berlin-Bold] text-[#18243F] text-[36px] text-center w-full mt-[5%] -rotate-12' onClick={handleClose}>Next</button>
        <img src={NextFlag} alt="next-flag" />
      </div>
    </div>
  )
}

export default WinModal