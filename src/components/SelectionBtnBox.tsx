import React from "react";
import YesNo from "../assets/gameplay/yes-no.png";
export type SelectionBtnBoxProps = {
  leftLabel: string;
  rightLabel: string;
  leftAction?: () => void;
  rightAction?: () => void;
  disabled: boolean;
};
function SelectionBtnBox({
  leftLabel,
  rightLabel,
  leftAction,
  rightAction,
  disabled,
}: SelectionBtnBoxProps) {
  return (
    <div className="relative">
      <img src={YesNo} alt="" />
      <div className="absolute inset-x-0 top-0 flex h-[70%] justify-between">
        <div className="grow" />
        <button className="font-[Berlin] text-2xl" onClick={leftAction} disabled={disabled}>
          {leftLabel}
        </button>
        <div className="grow" />
        <button className="font-[Berlin] text-2xl" onClick={rightAction} disabled={disabled}>
          {rightLabel}
        </button>
        <div className="grow" />
      </div>
    </div>
  );
}

export default SelectionBtnBox;
