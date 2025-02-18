import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/index.css";
import PlayImage from "../../assets/images/play.png";
import SheepOnCarImage from "../../assets/images/sheep-on-car.png";
import BlockSheepLogoImage from "../../assets/images/blocksheep-logo.png";

/************************************************
 * 1) UNIQUE RACE ANIMATION (React)
 ************************************************/
const UniqueRaceAnimation = (props) => {
  const { handleClick } = props;
  const [showText, setShowText] = useState(false);
  const [textAnimationComplete, setTextAnimationComplete] = useState(false);
  const [showFinalElements, setShowFinalElements] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show text immediately
    setShowText(true);

    // After 2.8s, text is done
    const textTimeout = setTimeout(() => {
      setTextAnimationComplete(true);
    }, 2800);

    // After 3.3s, logos + background
    const finalElementsTimeout = setTimeout(() => {
      setShowFinalElements(true);
    }, 3300);

    // After 3.5s, show play button
    const buttonTimeout = setTimeout(() => {
      setShowButton(true);
    }, 3500);

    // Cleanup timeouts on unmount
    return () => {
      clearTimeout(textTimeout);
      clearTimeout(finalElementsTimeout);
      clearTimeout(buttonTimeout);
    };
  }, []);

  // REMOVE AFTER DRIVERS NAVIGATE TEST
  const handleDriversBtn = async () => {
    navigate("/race/299/drivers");
  };
  // REMOVE AFTER DRIVERS NAVIGATE TEST

  return (
    <>
      {showText && (
        <div className="text-container">
          <p className={`unique-text ${textAnimationComplete ? "text-black" : ""}`}>
            Every Race is Unique.
          </p>
        </div>
      )}

      {showFinalElements && (
        <>
          <img src={BlockSheepLogoImage} alt="Text Only" className="top-logo" />
          <img src={SheepOnCarImage} alt="Sheep Only" className="bottom-logo" />
          <div className="bg-fade"></div>
        </>
      )}

      {showButton && (
        <img
          src={PlayImage}
          alt="Play Button"
          className={`play-button bg-transparent transition-all duration-300`}
          style={{
            opacity: isClicked ? 0 : 1,
            bottom: isClicked ? "-25%" : "5%",
          }}
          onClick={() => {
            setIsClicked(true);
            handleClick();
          }}
        />
      )}
      {showButton && (
        <button
          onClick={handleDriversBtn}
          className="border py-1 px-2 text-xl text-black z-10 absolute bottom-5 left-1/2"
        >
          DRIVERS
        </button>
      )}
    </>
  );
};

export default UniqueRaceAnimation;
