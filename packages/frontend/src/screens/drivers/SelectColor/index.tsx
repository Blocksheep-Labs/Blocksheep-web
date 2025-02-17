import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../../utils/socketio";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { useGameContext } from "../../../utils/game-context";
import Button from "./components/Button";
import Drivers from "../assets/images/drivers-sheep.png";
import AreYouSmarter from "../assets/images/areyousmarter.png";
import ChooseSheepIcon from "./components/ChooseSheepIcon";
import SelectWarCry from "./components/SelectWarCry";
import { userHasAdminAccess } from "../../../utils/contract-functions";
import Players from "./components/Players";

function DriversScreen() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const navigate = useNavigate();
  const { updateGameState, gameState } = useGameContext();
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [amountOfConnected, setAmountOfConnected] = useState(0);

  const [step, setStep] = useState(1);
  const [dots, setDots] = useState(".");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedWarCry, setSelectedWarCry] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (smartAccountClient) {
      userHasAdminAccess(smartAccountClient).then((data) => {
        // console.log({ data });
        if (!!data) setIsUserAdmin(!!data);
      });
    }
  }, []);

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

  const handleIconClick = (iconName: string, isAvailable: boolean) => {
    if (isAvailable) setSelectedIcon(iconName);
  };

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
            <ChooseSheepIcon selectedIcon={selectedIcon} onIconSelect={handleIconClick} />
          )}
          {step === 3 && (
            <SelectWarCry selectedWarCry={selectedWarCry} setSelectedWarCry={setSelectedWarCry} />
          )}
          {step === 4 && <Players />}
        </div>
      </div>

      {step === 1 && <Button text="Pick Color" className="mb-4" onClick={handleStep1Click} />}
      {step === 2 && (
        <Button
          text="Confirm"
          className="mb-4"
          onClick={handleStep2Click}
          disabled={!selectedIcon}
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
        WAITING FOR ALL PLAYERS TO JOIN<span className="inline-block w-4 text-left">{dots}</span>
      </div>

      {step === 4 && isUserAdmin && (
        <Button text="Start" className="mt-2" onClick={handleStep4Click} />
      )}
    </div>
  );
}

export default DriversScreen;
