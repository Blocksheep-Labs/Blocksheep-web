import React from "react";
import RibbonImg from "../assets/common/ribbon.png";
function RibbonLabel({text, smallerText}: {text: string; smallerText?: boolean}) {
  return (
    <div className="relative w-[85%]">
      <img src={RibbonImg} alt="ribbon" className="" />
      <p className={`absolute left-1/2 top-1/2 -translate-y-full translate-x-[-50%] font-[Berlin] w-full text-center font-bold text-3xl uppercase text-[#285E19]`}>
        {text}
      </p>
    </div>
  );
}

export default RibbonLabel;
