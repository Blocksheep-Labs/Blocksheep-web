import React from "react";
import RibbonImg from "../assets/common/ribbon.png";
function RibbonLabel() {
  return (
    <div className="relative w-[85%]">
      <img src={RibbonImg} alt="ribbon" className="" />
      <p className="absolute left-1/2 top-1/2 -translate-y-full translate-x-[-50%] font-[Berlin] text-3xl uppercase text-[#285E19]">
        Races
      </p>
    </div>
  );
}

export default RibbonLabel;
