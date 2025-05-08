import { FC, useMemo } from "react";
import WAR_CRY_PAIRS from "../../assets/select-war-cry.json";

import buffaloImage from "../../assets/images/warcry/buffalo.png";
import buffaloAudio from "../../assets/images/warcry/buffalo.mp3";

import bearImage from "../../assets/images/warcry/bear.png";
import bearAudio from "../../assets/images/warcry/bear.mp3";

import chickenImage from "../../assets/images/warcry/chicken.png";
import chickenAudio from "../../assets/images/warcry/chicken.mp3";

import cockImage from "../../assets/images/warcry/cock.png";
import cockAudio from "../../assets/images/warcry/cock.mp3";

import cowImage from "../../assets/images/warcry/cow.png";
import cowAudio from "../../assets/images/warcry/cow.mp3";

import dogImage from "../../assets/images/warcry/dog.png";
import dogAudio from "../../assets/images/warcry/dog.mp3";

import dolphinImage from "../../assets/images/warcry/dolphin.png";
import dolphinAudio from "../../assets/images/warcry/dolphin.mp3";

import donkeyImage from "../../assets/images/warcry/donkey.png";
import donkeyAudio from "../../assets/images/warcry/donkey.mp3";

import frogImage from "../../assets/images/warcry/frog.png";
import frogAudio from "../../assets/images/warcry/frog.mp3";

import horseImage from "../../assets/images/warcry/horse.png";
import horseAudio from "../../assets/images/warcry/horse.mp3";

import lionImage from "../../assets/images/warcry/lion.png";
import lionAudio from "../../assets/images/warcry/lion.mp3";

import pigImage from "../../assets/images/warcry/pig.png";
import pigAudio from "../../assets/images/warcry/pig.mp3";

import sheepImage from "../../assets/images/warcry/sheep.png";
import sheepAudio from "../../assets/images/warcry/sheep.mp3";

import snakeImage from "../../assets/images/warcry/snake.png";
import snakeAudio from "../../assets/images/warcry/snake.mp3";

import vultureImage from "../../assets/images/warcry/vulture.png";
import vultureAudio from "../../assets/images/warcry/vulture.mp3";

import wolfImage from "../../assets/images/warcry/wolf.png";
import wolfAudio from "../../assets/images/warcry/wolf.mp3";

import pinguinImage from "../../assets/images/warcry/pinguin.png";
import pinguinAudio from "../../assets/images/warcry/pinguin.mp3";


const pairs = {
  buffalo: { image: buffaloImage, audio: buffaloAudio },
  bear: { image: bearImage, audio: bearAudio },
  chicken: { image: chickenImage, audio: chickenAudio },
  cock: { image: cockImage, audio: cockAudio },
  cow: { image: cowImage, audio: cowAudio },
  dog: { image: dogImage, audio: dogAudio },
  dolphin: { image: dolphinImage, audio: dolphinAudio },
  donkey: { image: donkeyImage, audio: donkeyAudio },
  frog: { image: frogImage, audio: frogAudio },
  horse: { image: horseImage, audio: horseAudio },
  lion: { image: lionImage, audio: lionAudio },
  pig: { image: pigImage, audio: pigAudio },
  sheep: { image: sheepImage, audio: sheepAudio },
  snake: { image: snakeImage, audio: snakeAudio },
  vulture: { image: vultureImage, audio: vultureAudio },
  wolf: { image: wolfImage, audio: wolfAudio },
  pinguin: { image: pinguinImage, audio: pinguinAudio },
};



type SelectWarCryProps = {
  selectedWarCry: number | null;
  setSelectedWarCry: (warCry: number) => void;
  selectedWarCryByAllUsers: number[];
};

const SelectWarCry: FC<SelectWarCryProps> = ({ selectedWarCry, setSelectedWarCry, selectedWarCryByAllUsers }) => {
  

  const handleWarCryClick = (warCryIndex: number, soundPath: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedWarCry(warCryIndex);
    const audio = new Audio(soundPath);
    audio.play().catch((e) => console.error("Audio play failed:", e));
  };

  return (
    <div className="grid grid-cols-3 gap-0.5 mt-[90px] px-10 overflow-y-auto max-h-[150px]">
      {Object.entries(pairs).map(([map_key, value], key) => (
        <div
          key={key}
          className={`relative w-max mx-auto flex justify-center items-center bg-white ${
            !selectedWarCryByAllUsers.includes(key) ? "cursor-pointer" : "cursor-not-allowed"
          } ${selectedWarCry === key ? "border-[2px] border-green-500" : ""}`}
          onClick={() => handleWarCryClick(key, value.audio, !selectedWarCryByAllUsers.includes(key))}
        >
          <img
            src={value.image}
            alt={`war-cry-${key}`}
            className={`w-12 h-12 object-contain ${selectedWarCryByAllUsers.includes(key) && "opacity-30"}`}
          />
          {selectedWarCry === key && (
            <div className="absolute top-0 left-0 w-full h-full rounded-xl"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SelectWarCry;
