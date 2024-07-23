import React from "react";
import Users from "../assets/gameplay/users.png";
function UserCount() {
  return (
    <div className="flex size-12 flex-col items-center justify-center rounded-full bg-black">
      <img src={Users} alt="users" className="w-[30%]" />
      <p className="font-[Berlin] text-white">4/10</p>
    </div>
  );
}

export default UserCount;
