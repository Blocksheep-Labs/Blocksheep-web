import React from "react";
import YesNo from "../assets/gameplay/yes-no.png";
import LeftArrow from "../assets/underdog/arrow-left.png";
import RightArrow from "../assets/underdog/arrow-right.png";
import BlackSheep from "../assets/common/blacksheep.png";

export type SelectionBtnBoxProps = {
  leftLabel: string;
  rightLabel: string;
  leftAction: (a: number) => Promise<void>;
  rightAction: (a: number) => Promise<void>;
  disabled: boolean;
  currentQuestionIndex: number;
  selectedAnswer: "left" | "right" | null;
};
function SelectionBtnBox({
  leftLabel,
  rightLabel,
  leftAction,
  rightAction,
  disabled,
  currentQuestionIndex,
  selectedAnswer,
}: SelectionBtnBoxProps) {
  return (
    <div className="relative">
      <img src={LeftArrow} alt="" className={`${selectedAnswer == "left" && 'z-50'} absolute bottom-14 -left-20`} />
      <img src={RightArrow} alt="" className={`${selectedAnswer == "right" && 'z-50'} absolute bottom-14 left-20`} />

      <button 
        className={`${selectedAnswer == "left" && 'z-50'} absolute w-28 text-center bottom-40 font-[Berlin] text-xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`} 
        onClick={() => leftAction(currentQuestionIndex)} 
        disabled={disabled}
      >
        {leftLabel}
      </button>

      <button 
        className={`${selectedAnswer == "right" && 'z-50'} absolute w-28 text-center bottom-40 -right-2 font-[Berlin] text-xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`} 
        onClick={() => rightAction(currentQuestionIndex)} 
        disabled={disabled}
      >
        {rightLabel}
      </button>

      <div className="absolute bottom-0 flex justify-center w-full">
        <img src={BlackSheep} alt="blacksheep" className="w-24" />
      </div>

      <div className="absolute inset-x-0 top-0 flex h-[70%] justify-between">
        <div className="grow" />
        <div className="grow" />
        <div className="grow" />
      </div>
    </div>
  );
}

export default SelectionBtnBox;
