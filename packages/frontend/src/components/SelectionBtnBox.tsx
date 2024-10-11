import React from "react";
import YesNo from "../assets/gameplay/yes-no.png";
export type SelectionBtnBoxProps = {
  leftLabel: string;
  rightLabel: string;
  leftAction: (a: number) => Promise<void>;
  rightAction: (a: number) => Promise<void>;
  disabled: boolean;
  currentQuestionIndex: number;
};
function SelectionBtnBox({
  leftLabel,
  rightLabel,
  leftAction,
  rightAction,
  disabled,
  currentQuestionIndex
}: SelectionBtnBoxProps) {
  return (
    <div className="relative">
      <img src={YesNo} alt="" />
      <div className="absolute inset-x-0 top-0 flex h-[70%] justify-between">
        <div className="grow" />
        <button className="font-[Berlin] text-2xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400" onClick={() => leftAction(currentQuestionIndex)} disabled={disabled}>
          {leftLabel}
        </button>
        <div className="grow" />
        <button className="font-[Berlin] text-2xl text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400" onClick={() => rightAction(currentQuestionIndex)} disabled={disabled}>
          {rightLabel}
        </button>
        <div className="grow" />
      </div>
    </div>
  );
}

export default SelectionBtnBox;
