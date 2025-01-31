import { FC } from "react";
import WAR_CRY_PAIRS from "../../assets/select-war-cry.json";

type SelectWarCryProps = {
  selectedWarCry: string | null;
  setSelectedWarCry: (warCry: string) => void;
};

const SelectWarCry: FC<SelectWarCryProps> = ({ selectedWarCry, setSelectedWarCry }) => {
  const handleWarCryClick = (warCryName: string, soundPath: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedWarCry(warCryName);
    const audio = new Audio(soundPath);
    audio.play();
  };

  return (
    <div className="grid grid-cols-3 gap-0.5 mt-[90px] px-10">
      {WAR_CRY_PAIRS.slice(0, 9).map((warCry) => (
        <div
          key={warCry.name}
          className={`relative w-max mx-auto  flex justify-center items-center bg-white ${warCry.isAvailable ? "cursor-pointer" : "cursor-not-allowed"} ${selectedWarCry === warCry.name ? "border-[2px] border-green-500" : ""}`}
          onClick={() => handleWarCryClick(warCry.name, warCry.sound, warCry.isAvailable)}
        >
          <img
            src={warCry.image}
            alt={warCry.name}
            className={`w-12 h-12 object-contain ${!warCry.isAvailable && "opacity-30"}`}
          />
          {selectedWarCry === warCry.name && (
            <div className="absolute top-0 left-0 w-full h-full rounded-xl"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SelectWarCry;
