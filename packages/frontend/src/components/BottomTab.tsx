import React from "react";
import BottomTabImg from "../assets/gameplay/bottom-tab.png";
import { Link } from "react-router-dom";
function BottomTab() {
  return (
    <div className="absolute bottom-0 left-0 z-10">
      <div className="relative">
        <img src={BottomTabImg} alt="" className="w-full" />
        <Link to="/" className="absolute bottom-[18%] left-[5%] h-[50%] w-[33%] rotate-[-7deg]" />
      </div>
    </div>
  );
}

export default BottomTab;
