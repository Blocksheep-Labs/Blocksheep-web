import "./RaceItem.styles.css";
import { useEffect, useState } from "react";
import SheepIcon from "../../assets/common/sheeepy.png";
import TimerIcon from "../../assets/common/timer.png";
import msToTime from "../../utils/msToTime";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { useSmartAccount } from "../../hooks/smartAccountProvider";

import BullRunIcon from "../../assets/common/bullrun-icon.jpg";
import RabbitHoleIcon from "../../assets/common/rabbithole-icon.jpg";
import UnderdogIcon from "../../assets/common/underdog-icon.jpg";
import GamePreview from "../../assets/common/game-preview.jpg";
import USDCIcon from "../../assets/common/usdc.png";
import { TRace } from "@/hooks/useRaceById";
import { useRefundOnCanceledRace } from "@/hooks/useRefundOnCanceledRace";



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
  race: TRace;
  onClickJoin: (a: number) => void;
  onClickRegister: (id: number) => Promise<void>;
  cost: number;
  participatesIn: string[];
};

function RaceItem({ race, onClickJoin, onClickRegister, cost, participatesIn }: RaceItemProps) {
  const { refundOnCanceledRace } = useRefundOnCanceledRace();

  const [timeLeft, setTimeLeft] = useState((Number(race.endAt) * 1000) - new Date().getTime());
  const [loading, setLoading] = useState(false);

  const withdrawFundsHandler = async() => {
    setLoading(true);
    await refundOnCanceledRace(cost, Number(race.id));
    setLoading(false);
  }

  const handleRegister = async(id: number) => {
    setLoading(true);
    await onClickRegister(id);
    setLoading(false);
  }
  
  useEffect(() => {
    if (timeLeft < 0) {
      return;
    }

    const intId = setInterval(() => {
      setTimeLeft((Number(race.endAt) * 1000) - new Date().getTime());
    }, 1000);

    return () => {
      clearInterval(intId);
    }
  }, []);


  return (
    <div className="outerLayer BaseLayer">
      <div className="outerLayer lightGreenLayer">
        <div className="contentLayer greenLayer">
          <div className="topImageWrapper">
            <img
              src={GamePreview}
              alt="Top Icon"
              className="topImage"
            />
          </div>

          <div className="content">
            <div className="gridContainer">
              <div className="gridItem">
                <div className="iconBox">
                  <img
                    src={SheepIcon}
                    alt="Sheep Icon"
                    className="icon"
                  />
                  <span>{race.registeredUsers.length}/{race.numOfPlayersRequired}</span>
                </div>
              </div>

              <div className="gridItem">
                <div className="iconBox">
                  <img
                    src={USDCIcon}
                    alt="Coin Icon"
                    className="icon"
                  />
                  <span>{(cost).toString()}</span>
                </div>
              </div>

              <div className="gridItem">
                <div className="timerBox max-w-[78px] overflow-hidden">
                  <img
                    src={TimerIcon}
                    alt="Timer Icon"
                    className="timerIcon"
                  />
                  <span className="">
                    {
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
                      msToTime((Number(race.endAt) * 1000) - new Date().getTime())
                    }
                  </span>
                </div>
              </div>

              <div className="gridItem">

                {
                  (() => {
                    if (loading) {
                      return;
                    }
                    if (race.registered && race.status == 1 && race.registeredUsers.length <= race.numOfPlayersRequired && !race.refunded) {
                      return (<div className="buttonBox joinButton" onClick={withdrawFundsHandler}>Refund</div>);
                    } else if (!race.refunded) {
                      return (
                        race.registered 
                        ? 
                        <div className="buttonBox joinButton" onClick={() => onClickJoin(race.id)}>{participatesIn.map(i => Number(i)).includes(race.id) ? 'Rejoin' : 'Join'}</div> 
                        : 
                        <div className="buttonBox joinButton" onClick={() => handleRegister(race.id)}>Enroll</div>
                      );
                    } else {
                      return <></>
                    }
                  })()
                }
              </div>
            </div>
          </div>
        </div>

        <div className="miniIcons">
          <img
            src={UnderdogIcon}
            alt="Mini Icon"
            className="miniIcon"
          />
          <img
            src={RabbitHoleIcon}
            alt="Mini Icon"
            className="miniIcon"
          />
          <img
            src={BullRunIcon}
            alt="Mini Icon"
            className="miniIcon"
          />
        </div>
      </div>
                
      {
         <button onClick={() => onClickJoin(race.id)}>Force join</button>
      }
    </div>
  );
}

export default RaceItem;
