import { useEffect, useState } from "react";
import Button from "./components/Button";
import Drivers from "../assets/images/drivers-sheep.png";
import AreYouSmarter from "../assets/images/areyousmarter.png";
import ChooseSheepIcon from "./components/ChooseSheepIcon";
import SelectWarCry from "./components/SelectWarCry";
import Players from "./components/Players";
import { socket } from "@/utils/socketio";
import { useRaceById } from "@/hooks/useRaceById";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { useGameContext } from "@/utils/game-context";
import { useNavigate, useParams } from "react-router-dom";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import { useTimer } from "react-timer-hook";
import { httpGetRaceDataById } from "@/utils/http-requests";
import getScreenTime from "@/utils/getScreenTime";


const SCREEN_NAME = "DRIVERS";


function DriversScreen() {
  const [step, setStep] = useState(1);
  const [dots, setDots] = useState(".");
  const [selectedIcon, setSelectedIcon] = useState<number | null>(null);
  const [selectedWarCry, setSelectedWarCry] = useState<string | null>(null);
  const [selectedIconsByAllUsers, setSelectedIconsByAllUsers] = useState([1,2,3]);

  const navigate = useNavigate();
  const {raceId} = useParams();
  const {smartAccountAddress} = useSmartAccount();
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [seconds, setSeconds] = useState(1000);
  const { race } = useRaceById(Number(raceId));
  const [readyToNavigateNext, setReadyToNavigateNext] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStep1Click = () => setStep(2);
  const handleStep2Click = () => setStep(3);
  const handleStep3Click = () => setStep(4);
  const handleStep4Click = () => {
    setSelectedIcon(null);
    setSelectedWarCry(null);
    setStep(1);
  };

  const handleIconClick = (iconIndex: number, isAvailable: boolean) => {
    if (isAvailable) setSelectedIcon(iconIndex);
  };

  // navigator
  useEffect(() => {
    if (race && readyToNavigateNext && smartAccountAddress && raceId != undefined) {
      console.log("UPDATE PROGRESS", {
        raceId,
        userAddress: smartAccountAddress,
        property: `drivers`,
      });
      socket.emit('update-progress', {
        raceId,
        userAddress: smartAccountAddress,
        property: `drivers`,
      });

      const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;
      socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
      navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
    }
  }, [race, readyToNavigateNext, SCREEN_NAME, smartAccountAddress, raceId]);
  

  //const { totalSeconds, restart, pause } = useTimer({
  //  expiryTimestamp: new Date(),
  //  onExpire: () => setReadyToNavigateNext(true),
  //  autoStart: false
  //});
  
  // setups the timer
  useEffect(() => {
    if (race && SCREEN_NAME) {
      httpGetRaceDataById(`race-${race.id}`)
        .then(({data}) => {
          const time = new Date();
          const expectedTime = getScreenTime(data, SCREEN_NAME);
          time.setSeconds(time.getSeconds() + expectedTime);
          
          setSeconds(expectedTime);
          //restart(time);
        });
    }
  }, [race, SCREEN_NAME]);
  
  
  // handle socket events
  useEffect(() => {
    console.log("EFFECT >>>>", {smartAccountAddress});
    if (smartAccountAddress) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
          console.log({amount})
          if (raceId === raceIdSocket) {
            setAmountOfConnected(amount);
          }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
          console.log("JOINED", raceIdSocket, raceId);
          if (raceId == raceIdSocket && socketPart == SCREEN_NAME) {
              console.log("JOINED++")
              socket.emit("get-connected", { raceId });
          }
      });

      socket.on('leaved', ({ part: partSocket, raceId: raceIdSocket, movedToNext, connectedCount }) => {
        if (partSocket == SCREEN_NAME && raceId == raceIdSocket) {
          if (!movedToNext) {
            console.log("LEAVED")
            setAmountOfConnected(connectedCount);
          } else {
            setReadyToNavigateNext(true);
          }
        }
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
      }
    }
  }, [socket, raceId, smartAccountAddress, amountOfConnected]);
  
      
  useEffect(() => {
    if (raceId && socket && race && SCREEN_NAME) {
      if (!socket.connected) {
        socket.connect();
      }
        
      socket.on('screen-changed', ({ screen }) => {
        if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
          socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: `drivers`,
          });
          // alert(`screen-changed = ${screen}`)
          navigate(generateLink(screen, Number(raceId)));
        }
      });
        
        
      socket.on('latest-screen', ({ screen }) => {
        if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
          socket.emit('update-progress', {
            raceId,
            userAddress: smartAccountAddress,
            property: `drivers`,
          });
          navigate(generateLink(screen, Number(raceId)));
        }
      });
        
        
      return () => {
        socket.off('screen-changed');
        socket.off('latest-screen');
      }
    }
  }, [raceId, socket, race, SCREEN_NAME]);
    
    useEffect(() => {
      if(smartAccountAddress && String(raceId).length) {
        if (!socket.connected) {
          console.log("Not conencted, trying to reconnect")
          socket.connect();
        }
        setTimeout(() => {
          console.log("Emitting connect live game event...");
          socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: SCREEN_NAME });
        }, 700);
      }
    }, [smartAccountAddress, socket, raceId]);


  return (
    <div
      className={`mx-auto flex w-full flex-col bg-divers_bg bg-cover bg-bottom justify-center`}
      style={{ height: `${window.innerHeight}px` }}
    >
      <div
        className={`relative w-[280px] h-[410px] mt-16 ${step === 4 && "h-[460px] mt-20"} mx-auto p-1 mb-3`}
      >
        <div
          className={`absolute z-10 left-0 top-0 w-full h-[136px] rounded-3xl ${step === 3 && "h-[230px]"}`}
          style={{
            background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
          }}
        >
          <img src={Drivers} alt="drivers" className="translate-y-[-80px] translate-x-[32px]" />
          {step === 3 && (
            <div className="translate-y-[-85px] flex flex-col text-white">
              <span className="mx-auto text-2xl">WAR CRY</span>
              <span className="mx-auto">select your defining roar</span>
            </div>
          )}
        </div>
        <div className="border-[6px] pt-[140px] border-[#2a3f86] rounded-3xl w-full h-full m-auto bg-white bg-opacity-70">
          {step === 1 && (
            <img src={AreYouSmarter} alt="are u smarter" className="w-[90%] mx-auto" />
          )}
          {step === 2 && (
            <ChooseSheepIcon 
              selectedIcon={selectedIcon} 
              selectedIconsByAllUsers={selectedIconsByAllUsers}
              onIconSelect={handleIconClick} 
            />
          )}
          {step === 3 && (
            <SelectWarCry selectedWarCry={selectedWarCry} setSelectedWarCry={setSelectedWarCry} />
          )}
          {step === 4 && <Players />}
        </div>
      </div>

      {step === 1 && <Button text="Pick Color" className="mb-4" onClick={handleStep1Click} disabled={!race || (race.numOfPlayersRequired != amountOfConnected)} />}
      {step === 2 && (
        <Button
          text="Confirm"
          className="mb-4"
          onClick={handleStep2Click}
          disabled={selectedIcon == null}
        />
      )}
      {step === 3 && (
        <Button
          text="Confirm"
          className="mb-4"
          onClick={handleStep3Click}
          disabled={!selectedWarCry}
        />
      )}

      <div className="uppercase text-white mx-auto pt-1.5">
        {
          race && (amountOfConnected == race.numOfPlayersRequired)
          ?
          <>ALL PLAYERS JOINED.</>
          :
          <>WAITING FOR ALL PLAYERS TO JOIN ({amountOfConnected} / {race?.numOfPlayersRequired || 9})<span className="inline-block w-4 text-left">{dots}</span></>
        }
      </div>

      {step === 4 && (
        <Button text="Start" className="mt-2" onClick={handleStep4Click} />
      )}
    </div>
  );
}

export default DriversScreen;
