import React from "react";
import YesNo from "../assets/gameplay/yes-no.png";
import LeftArrow from "../assets/underdog/arrow-left.png";
import RightArrow from "../assets/underdog/arrow-right.png";
import BlackSheep from "../assets/common/blacksheep.png";
import Sign from "../assets/underdog/signage.png";
import Crown from "../assets/underdog/crown.png";

export type SelectionBtnBoxProps = {
  leftLabel: string;
  rightLabel: string;
  leftAction: (a: number) => Promise<void>;
  rightAction: (a: number) => Promise<void>;
  disabled: boolean;
  currentQuestionIndex: number;
  selectedAnswer: "left" | "right" | null;
  amountOfQuestions: number;
  leftCount: number;
  rightCount: number;
};
function SelectionBtnBox({
  leftLabel,
  rightLabel,
  leftAction,
  rightAction,
  disabled,
  currentQuestionIndex,
  selectedAnswer,
  amountOfQuestions,
  leftCount,
  rightCount,
}: SelectionBtnBoxProps) {
  return (
    <div className="relative">

      <div className={`absolute bottom-16 right-24 ${selectedAnswer == "left" && 'z-50'}`}>
          <div className="relative">
            {
              selectedAnswer &&
              <>
                { leftCount < rightCount && <img src={Crown} alt="" className="absolute -top-8 pr-2 left-20 w-10 z-10 -rotate-45"/> }
                <span className="absolute -top-2 left-24 w-20 z-10 text-center font-[Berlin] text-xl text-[#18243F]">
                  {String((leftCount / (leftCount + rightCount)) * 100).substring(0,4)}%
                </span>
                <img src={Sign} alt="" className="w-20 absolute -top-5 left-24"/>
              </>
            }
            <img src={LeftArrow} alt="" className={`min-w-60`} />
            <button 
              className={`${selectedAnswer == "left" && 'z-50'} absolute top-12 left-16 w-28 text-center bottom-40 font-[Berlin] text-xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`} 
              onClick={() => leftAction(currentQuestionIndex)} 
              disabled={disabled}
            >
              {leftLabel}
            </button>
          </div>
      </div>

      <div className={`absolute bottom-16 left-24 ${selectedAnswer == "right" && 'z-50'}`}>
          <div className="relative">
            {
              selectedAnswer &&
              <>
                { rightCount < leftCount && <img src={Crown} alt="" className="absolute -top-8 pl-2 right-20 w-10 z-10 rotate-45"/>}
                <span className="absolute -top-2 right-24 w-20 z-10 text-center font-[Berlin] text-xl text-[#18243F]">
                  {String((rightCount / (rightCount + leftCount)) * 100).substring(0,4)}%
                </span>
                <img src={Sign} alt="" className="w-20 absolute -top-5 right-24"/>
              </>
            }
            <img src={RightArrow} alt="" className={`min-w-60`} />
            <button 
              className={`${selectedAnswer == "right" && 'z-50'} absolute top-12 right-16 w-28 text-center bottom-40 font-[Berlin] text-xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`} 
              onClick={() => rightAction(currentQuestionIndex)} 
              disabled={disabled}
            >
              {rightLabel}
            </button>
          </div>
      </div>

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
