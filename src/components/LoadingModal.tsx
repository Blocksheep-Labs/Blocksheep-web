import React from 'react'
import LoadingBackground from '../assets/loading/loading-bg.png'
function LoadingModal() {
  return (
    <div className='absolute bg-[rgb(0,0,0,0.75)] top-0 bottom-0 left-0 right-0' >
      <div className='mx-[10%] mt-[30%] mb-[40%]'>
        <img src={LoadingBackground} alt="loading-bg"/>
      </div>
    </div>
  )
}

export default LoadingModal