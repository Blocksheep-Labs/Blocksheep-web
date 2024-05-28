import React from "react";
import SheepIcon from "../assets/common/sheeepy.png";
import EtherIcon from "../assets/common/ether.png";
import TimerIcon from "../assets/common/timer.png";
import ConsoleIcon from "../assets/common/console.png";
import NextFlag from "../assets/common/flag.png";
import { Race } from "../types";
import { BLOCK_SHEEP_CONTRACT } from "../constants";
import BlockSheepABI from "../contracts/BlockSheep";
import { Web3Button, useContract, useContractWrite } from "@thirdweb-dev/react";
type RaceStatusItemProps = {
  icon: string;
  label: string;
};

function RaceStatusItem({ icon, label }: RaceStatusItemProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-1">
      <div className="size-8">
        <img src={icon} alt="sheep" className="h-full" />
      </div>
      <p className="text-white">{label}</p>
    </div>
  );
}

type RaceItemProps = {
  race: Race;
  onClickJoin: () => void;
};

function RaceItem({ race, onClickJoin }: RaceItemProps) {
  const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT);
  const { mutateAsync: register } = useContractWrite(blockSheep, "register");

  return (
    <div className="relative rounded-xl bg-race_pattern bg-cover bg-center">
      <div className="flex flex-col gap-4">
        <div className="mx-[20%] mt-[-16px] flex flex-row justify-between">
          <RaceStatusItem icon={SheepIcon} label={`${race.playersCount}/9`} />
          <RaceStatusItem icon={EtherIcon} label="10s" />
          <RaceStatusItem icon={TimerIcon} label="5m 30s" />
        </div>
        <div className="mx-[30%] flex justify-between">
          <RaceStatusItem icon={ConsoleIcon} label={race.numOfGames.toString()} />
          {race.registered ? (
            <button onClick={onClickJoin} className="relative">
              <div className="h-16 overflow-hidden">
                <img src={NextFlag} alt="next-flag" className="h-[120%]" />
              </div>
              <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg text-[#18243F]">
                Join
              </p>
            </button>
          ) : (
            // <Web3Button
            //   className="!m-1 !h-4 !w-auto !p-1"
            //   contractAddress={BLOCK_SHEEP_CONTRACT}
            //   contractAbi={BlockSheepABI}
            //   action={async () => await register({ args: [race.id] })}
            // >
            //   Register
            // </Web3Button>
            <button
              className="!m-1 !h-4 !w-auto !p-1"
              onClick={() => {
                console.log("registering");
                // async () => await register({args: [race.id]})
              }}
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RaceItem;
