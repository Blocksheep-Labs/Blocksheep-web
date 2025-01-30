import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../../utils/socketio";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { useGameContext } from "../../../utils/game-context";
import Button from "./components/Button";
import Drivers from "../assets/images/drivers-sheep.png";
import AreYouSmarter from "../assets/images/areyousmarter.png";
import SHEEP_ICONS from "../assets/select-sheep-arr.json";

function DriversScreen() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const navigate = useNavigate();
  const { updateGameState, gameState } = useGameContext();
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [amountOfConnected, setAmountOfConnected] = useState(0);

  const [step, setStep] = useState(1);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStep1Click = () => {
    console.log("Step 1 confirmed");
    setStep(2);
  };

  const handleStep2Click = () => {
    console.log("Step 2 confirmed");
    setStep(1);
  };

  return (
    <div
      className={`mx-auto flex w-full flex-col bg-race_bg bg-cover bg-bottom justify-center`}
      style={{ height: `${window.innerHeight}px` }}
    >
      <div className="relative w-3/4 h-[61%] mx-auto p-1 mb-3 mt-16">
        <div
          className="absolute z-10 left-0 top-0 w-full h-1/3 rounded-2xl"
          style={{
            background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
          }}
        >
          <img src={Drivers} alt="drivers" className="translate-y-[-33%] translate-x-[14%]" />
        </div>
        <div className="border-[6px] pt-[52%] border-[#2a3f86] rounded-3xl w-full h-full m-auto bg-white bg-opacity-70">
          {step === 1 && (
            <img src={AreYouSmarter} alt="are u smarter" className="w-[90%] mx-auto" />
          )}
          {step === 2 && <div>SELECT SHEEP</div>}
        </div>
      </div>

      {step === 1 && <Button text="Pick Color" className="mb-4" onClick={handleStep1Click} />}
      {step === 2 && <Button text="Confirm" className="mb-4" onClick={handleStep2Click} />}

      <div className="uppercase text-white mx-auto pt-1.5">
        WAITING FOR ALL PLAYERS TO JOIN<span className="inline-block w-4 text-left">{dots}</span>
      </div>
    </div>
  );
}

export default DriversScreen;
