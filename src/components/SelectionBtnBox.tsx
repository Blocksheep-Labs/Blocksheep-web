import React from 'react'
import YesNo from "../assets/gameplay/yes-no.png"
export type SelectionBtnBoxProps = {
  leftLabel: string
  rightLabel: string
  leftAction?: () => void
  rightAction?: () => void
}
function SelectionBtnBox({ leftLabel, rightLabel, leftAction, rightAction}: SelectionBtnBoxProps) {
  return (
    <div className='relative'>
      <img src={YesNo} alt="" />
      <div className='absolute top-0 left-0 right-0 flex justify-between h-[70%]'>
        <div className='grow'/>
        <button className='font-[Berlin] text-2xl' onClick={leftAction}>
          {leftLabel}
        </button>
        <div className='grow' />
        <button className='font-[Berlin] text-2xl' onClick={rightAction}>
          {rightLabel}
        </button>
        <div className='grow'/>
      </div>
    </div>
  )
}

export default SelectionBtnBox