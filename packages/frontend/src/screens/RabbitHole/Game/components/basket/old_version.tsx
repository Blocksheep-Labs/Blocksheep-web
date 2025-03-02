import { useState } from "react";
import BasketCarrotImage from "../../../assets/images/carrot-basket.png";
import BasketCarrotIncrement from "../../../assets/images/carrot-increment.png";
import BasketCarrotIncrementValue from "../../../assets/images/carrot-increment-value.png";

export function CarrotBasket({fuelLeft}: {fuelLeft: number}) {
    return (
        <div className="relative">
            <img src={BasketCarrotImage} alt="basket" className="w-28"/>
            <span className="text-white absolute left-[57px] -bottom-[2px] text-3xl" style={{ transform: 'translate(-50%,-50%)' }}>{fuelLeft}</span>
        </div>
    );
}

export function CarrotBasketIncrement({ setDisplayNumber, disabled, max, displayNumber }: { setDisplayNumber: (fuel: number) => void; disabled: boolean; max: number; displayNumber: number }) {
  const handleIncrease = () => {
    if (disabled || displayNumber >= max) return;
    const newValue = Math.min(max, displayNumber + 1);
    setDisplayNumber(newValue);
  };

  return (
    <div className={`relative ${disabled ? "opacity-50" : ""}`}>
      <img src={BasketCarrotIncrement} alt="basket z-10" className="w-24" />
      <img
        src={BasketCarrotIncrementValue}
        alt="basketcounter"
        className="absolute w-12 -top-4 left-2 -z-10"
      />
      <span
        className="text-black absolute left-[17.5%] bottom-[62px] text-lg -z-10"
        style={{ transform: "translate(-50%,-50%)" }}
      >
        {displayNumber}
      </span>
      <button
        className={`text-black absolute left-[28%] bottom-[21px] text-lg`}
        style={{ transform: "translate(-50%,-50%)" }}
        onClick={handleIncrease}
        disabled={disabled || displayNumber >= max}
      >
        DROP
      </button>
    </div>
  );
}
