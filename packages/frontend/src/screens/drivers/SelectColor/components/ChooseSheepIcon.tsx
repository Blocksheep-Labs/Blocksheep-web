import { FC } from "react";
import SHEEP_ICONS from "../../assets/select-sheep-arr.json";

interface ChooseSheepIconProps {
  selectedIcon: string | null;
  onIconSelect: (iconName: string, isAvailable: boolean) => void;
}

const ChooseSheepIcon: FC<ChooseSheepIconProps> = ({ selectedIcon, onIconSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-0.5 mt-4 px-6">
      {SHEEP_ICONS.map((icon) => (
        <div
          key={icon.name}
          className={`relative w-max mx-auto py-0.5 flex justify-center items-center ${icon.name === selectedIcon ? "border-[2px] border-green-500" : ""} ${icon.isAvailable ? "cursor-pointer" : "cursor-not-allowed bg-white"}`}
          onClick={() => onIconSelect(icon.name, icon.isAvailable)}
        >
          <img
            src={`/src/assets/sheep/${icon.name}`}
            alt={icon.name}
            className={`w-12 h-12 object-contain ${!icon.isAvailable && "opacity-30"}`}
          />
          {selectedIcon === icon.name && (
            <div className="absolute top-0 left-0 w-full h-full rounded-xl"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChooseSheepIcon;
