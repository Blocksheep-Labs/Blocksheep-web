import { useEffect, useState } from "react";
import SheepIcon from "../assets/common/sheeepy.png";
import EtherIcon from "../assets/common/ether.png";
import TimerIcon from "../assets/common/timer.png";
import ConsoleIcon from "../assets/common/console.png";
import NextFlag from "../assets/common/flag.png";
import { Race } from "../types";
import { USDC_MULTIPLIER } from "../config/constants";
import msToTime from "../utils/msToTime";
import { refundBalance } from "../utils/contract-functions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../config/wagmi";
import { useSmartAccount } from "../hooks/smartAccountProvider";
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
  onClickRegister: (id: number , questionsCount: number) => Promise<void>;
  cost: number
};

function RaceItem({ race, onClickJoin, onClickRegister, cost }: RaceItemProps) {
  const { smartAccountClient } = useSmartAccount();
  // const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT);
  // const { mutateAsync: register } = useContractWrite(blockSheep, "register");
  //console.log(race)
  const [timeLeft, setTimeLeft] = useState((Number(race.startAt) * 1000) - new Date().getTime());
  const [loading, setLoading] = useState(false);

  const withdrawFundsHandler = async() => {
    setLoading(true);
    const hash = await refundBalance(race.numOfQuestions * cost, race.id, smartAccountClient);

    console.log("Withdraw balance hash:", hash);
    await waitForTransactionReceipt(config, {
      hash,
      confirmations: 2
    });
    setLoading(false);
  }

  const handleRegister = async(id: number) => {
    setLoading(true);
    await onClickRegister(id, race.numOfQuestions);
    setLoading(false);
  }
  
  useEffect(() => {
    if (timeLeft < 0) {
      return;
    }

    const intId = setInterval(() => {
      setTimeLeft((Number(race.startAt) * 1000) - new Date().getTime());
    }, 1000);

    return () => {
      clearInterval(intId);
    }
  }, []);


  return (
    <div className="relative rounded-xl bg-race_pattern bg-cover bg-center">
      <div className="flex flex-col gap-4">
        <div className="mx-[20%] mt-[-16px] flex flex-row justify-between">
          <RaceStatusItem icon={SheepIcon} label={`${race.registeredUsers.length}/${race.numOfPlayersRequired}`} />
          <RaceStatusItem icon={EtherIcon} label={(race.numOfQuestions * cost / USDC_MULTIPLIER).toString() + "$"} />
          <RaceStatusItem icon={TimerIcon} label={
            timeLeft < 0
            ?
            (() => {
              // CREATED (due to the contract)
              if (race.status === 1) {
                return "Expired";
              }
              
              // STARTED (due to the contract)
              if (race.status === 2) {
                return "Running";
              } 

              if (race.status === 3) {
                return "Canceled";
              }

              // DISTRIBUTED (due to the contract)
              if (race.status === 4) {
                return "Finished";
              }

              return "Unknown";
            })()
            :
            msToTime((Number(race.startAt) * 1000) - new Date().getTime())
          } />
        </div>
        <div className="mx-[30%] flex justify-between">
          <RaceStatusItem icon={ConsoleIcon} label={`${race?.gamesCompletedPerUser?.length}/${race.numOfGames.toString()}`} />
          {
            (() => {
              if (race.registered && race.status == 1 && race.registeredUsers.length <= race.numOfPlayersRequired && !race.refunded) {
                return (
                  <>
                    <button 
                      onClick={withdrawFundsHandler} 
                      className={`relative ${loading && 'mix-blend-overlay'} text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`}
                      disabled={loading}
                    >
                      <div className="h-16 overflow-hidden">
                        <img src={NextFlag} alt="next-flag" className="h-[140%]" />
                      </div>
                      <p className="absolute left-3 top-[8px] -rotate-12 text-center font-[Berlin-Bold] text-md">
                        Refund
                      </p>
                    </button>

                    <button 
                      onClick={() => onClickJoin(race.id)} 
                      className={`relative ${loading && 'mix-blend-overlay'} text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`}
                      disabled={loading} //  || race.gamesCompletedPerUser?.length == race.numOfGames
                    >
                      <div className="h-16 overflow-hidden">
                        <img src={NextFlag} alt="next-flag" className="h-[120%]" />
                      </div>
                      <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg">
                        Join
                      </p>
                    </button>
                  </>
                );
              } else if (!race.refunded) {
                return (
                  <>
                    {race.registered ? (
                      <button 
                        onClick={() => onClickJoin(race.id)} 
                        className={`relative ${loading && 'mix-blend-overlay'} text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`}
                        disabled={loading} //  || race.gamesCompletedPerUser?.length == race.numOfGames
                      >
                        <div className="h-16 overflow-hidden">
                          <img src={NextFlag} alt="next-flag" className="h-[120%]" />
                        </div>
                        <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg">
                          Join
                        </p>
                      </button>
                      ) : (
                      <button 
                        onClick={() => handleRegister(race.id)} 
                        className={`relative ${loading && 'mix-blend-overlay'} text-[#18243F] hover:text-white disabled:text-gray-400 disabled:hover:text-gray-400`} 
                        disabled={loading}
                      >
                        <div className="h-16 overflow-hidden">
                          <img src={NextFlag} alt="next-flag" className="h-[140%]" />
                        </div>
                        <p className="absolute left-3 top-1 -rotate-12 text-center font-[Berlin-Bold] text-lg">
                          Enroll
                        </p>
                      </button>
                    )}
                  </>
                );
              } else {
                return <></>
              }
            })()
          }
        </div>
      </div>
    </div>
  );
}

export default RaceItem;
