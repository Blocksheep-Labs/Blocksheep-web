import { useState } from "react";
import BasketCarrotImage from "../../../assets/images/carrot-basket.png";
import BasketCarrotIncrement from "../../../assets/images/carrot-increment.png";
import BasketCarrotIncrementValue from "../../../assets/images/carrot-increment-value.png";

export function CarrotBasket({fuelLeft}: {fuelLeft: number}) {
    console.log("CarrotBasket",{fuelLeft});
    
    return (
        <div className="relative">
            <img src={BasketCarrotImage} alt="basket" className="w-28"/>
            <span className="text-white absolute left-[57px] -bottom-[2px] text-3xl" style={{ transform: 'translate(-50%,-50%)' }}>{fuelLeft}</span>
        </div>
    );
}

export function CarrotBasketIncrement({ min, setDisplayNumber, isRolling, max }: { min: number; setDisplayNumber: (fuel: number) => void; isRolling: boolean; max: number }) {
  const [value, setValue] = useState(0);

  const handleIncrease = () => {
    console.log("handleIncrease", {value, max, min});
    
    if (isRolling || value >= max) return;
    const newValue = Math.min(max, value + 1);
    setValue(newValue);
    setDisplayNumber(newValue);
  };

  return (
    <div className={`relative ${isRolling ? "opacity-50" : ""}`}>
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
        {value}
      </span>
      <button
        className={`text-black absolute left-[28%] bottom-[21px] text-lg`}
        style={{ transform: "translate(-50%,-50%)" }}
        onClick={handleIncrease}
        disabled={isRolling || value >= max}
      >
        DROP
      </button>
    </div>
  );
}
