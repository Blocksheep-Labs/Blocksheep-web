import { FC, useMemo } from "react";


import i1 from "../../assets/images/sheep/1.png";
import i2 from "../../assets/images/sheep/2.png";
import i3 from "../../assets/images/sheep/3.png";
import i4 from "../../assets/images/sheep/4.png";
import i5 from "../../assets/images/sheep/5.png";
import i6 from "../../assets/images/sheep/6.png";
import i7 from "../../assets/images/sheep/7.png";
import i8 from "../../assets/images/sheep/8.png";
import i9 from "../../assets/images/sheep/9.png";
import i10 from "../../assets/images/sheep/10.png";
import i11 from "../../assets/images/sheep/11.png";
import i12 from "../../assets/images/sheep/12.png";
import i13 from "../../assets/images/sheep/13.png";
import i14 from "../../assets/images/sheep/14.png";
import i15 from "../../assets/images/sheep/15.png";
import i16 from "../../assets/images/sheep/16.png";


const sheepImages = [
  i1, i2, i3, i4, i5, i6, i7, i8, i9, i10, i11,
  i12, i13, i14, i15, i16,
];


interface ChooseSheepIconProps {
  selectedIcon: number | null;
  onIconSelect: (iconIndex: number, isAvailable: boolean) => void;
  selectedIconsByAllUsers: number[],
}


const ChooseSheepIcon: FC<ChooseSheepIconProps> = ({ selectedIcon, onIconSelect, selectedIconsByAllUsers }) => {
  return (
    <div className="grid grid-cols-4 gap-0.5 mt-4 px-6">
      {sheepImages.map((icon, key) => (
        <div
          key={key}
          className={`relative w-max mx-auto py-0.5 flex justify-center items-center ${
            key === selectedIcon ? "border-green-500 bg-green-500 rounded-xl" : ""
          } ${Math.random() ? "cursor-pointer" : "cursor-not-allowed bg-white"}`}
          onClick={() => onIconSelect(key, !selectedIconsByAllUsers.includes(key))}
        >
          <img
            src={icon}
            alt={`sheep-${key}`}
            className={`w-12 h-12 object-contain ${selectedIconsByAllUsers.includes(key) && "opacity-30"}`}
          />
          {selectedIcon === key && (
            <div className="absolute top-0 left-0 w-full h-full rounded-xl"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChooseSheepIcon;
