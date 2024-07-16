import React from "react";
import SheepIcon from "../assets/common/sheeepy.png";
import EtherIcon from "../assets/common/ether.png";
import TimerIcon from "../assets/common/timer.png";
import ConsoleIcon from "../assets/common/console.png";
import NextFlag from "../assets/common/flag.png";
import { Race } from "../types";
import { BLOCK_SHEEP_CONTRACT, USDC_MULTIPLIER } from "../config/constants";
import BlockSheepABI from "../contracts/BlockSheep";
// import { Web3Button, useContract, useContractWrite } from "@thirdweb-dev/react";
type RaceStatusItemProps = {
  icon: string;
  label: string;
};

function RaceStatusItem({ icon, label }: RaceStatusItemProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-1">
      <div className="size-8 flex justify-center">
        <img src={icon} alt="sheep" className="h-full" />
      </div>
      <p className="text-white bg-black px-2 rounded-xl shadow-xl">{label}</p>
    </div>
  );
}

type RaceItemProps = {
  race: Race;
  onClickJoin: (a: number) => void;
  onClickRegister: (a: number) => void;
  cost: BigInt
};

function RaceItem({ race, onClickJoin, onClickRegister, cost }: RaceItemProps) {
  // const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT);
  // const { mutateAsync: register } = useContractWrite(blockSheep, "register");
  //console.log(race)

  return (
    <div className="relative rounded-xl bg-race_pattern bg-cover bg-center">
      <div className="flex flex-col gap-4">
        <div className="mx-[20%] mt-[-16px] flex flex-row justify-between">
          <RaceStatusItem icon={SheepIcon} label={`${race.playersCount}/3`} />
          <RaceStatusItem icon={EtherIcon} label={(race.numOfQuestions * Number(cost) / USDC_MULTIPLIER).toString() + "$"} />
          <RaceStatusItem icon={TimerIcon} label="5m 30s" />
        </div>
        <div className="mx-[30%] flex justify-between">
          <RaceStatusItem icon={ConsoleIcon} label={race.numOfGames.toString()} />
          {race.registered ? (
            <button onClick={() => onClickJoin(race.id)} className="relative">
              <div className="h-16 overflow-hidden">
                <img src={NextFlag} alt="next-flag" className="h-[120%]" />
              </div>
              <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg text-[#18243F]">
                Join
              </p>
            </button>
          ) : (
            <button onClick={() => onClickRegister(race.id)} className="relative">
              <div className="h-16 overflow-hidden">
                <img src={NextFlag} alt="next-flag" className="h-[140%]" />
              </div>
              <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg text-[#18243F]">
                Enroll
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RaceItem;
