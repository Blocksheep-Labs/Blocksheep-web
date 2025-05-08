import { FC } from "react";
import { sheepImages } from "@/utils/sheepsImagesArray";


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
