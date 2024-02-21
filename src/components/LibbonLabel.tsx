import React from "react";
import RibbonImg from "../assets/common/ribbon.png";
function RibbonLabel() {
  return (
    <div className="relative w-[85%]">
      <img src={RibbonImg} alt="ribbon" className="" />
      <p className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-100%] font-[Berlin] text-3xl uppercase text-[#285E19]">
        Races
      </p>
    </div>
  );
}

export default RibbonLabel;
