import React from 'react'
import Users from '../assets/gameplay/users.png'
function UserCount() {
  return (
    <div className='bg-black rounded-full w-12 h-12 flex flex-col items-center justify-center'>
      <img src={Users} alt="users" className='w-[30%]' />
      <p className='text-white font-[Berlin]'>4/10</p>
    </div>
  )
}

export default UserCount