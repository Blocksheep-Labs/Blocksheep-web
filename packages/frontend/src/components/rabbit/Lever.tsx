// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import LeverHandleImage from "../../assets/rabbit-hole/Lever-handle.png";

const Lever = (props: {
  isRolling: boolean;
  displayNumber: number;
  maxAvailable: number;
  setDisplayNumber: (a: number) => void;
}) => {
  const {displayNumber, setDisplayNumber, isRolling, maxAvailable} = props;
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const [rotationCount, setRotationCount] = useState(0);
  const sensitivity = 3; // Increase sensitivity for more responsiveness
  const leverRef = useRef(null);

  useEffect(() => {
    const lever = leverRef.current;

    const getAngleRelativeToCenter = (x, y) => {
      const rect = lever.getBoundingClientRect();
      const center_x = rect.left + rect.width / 2;
      const center_y = rect.bottom - rect.height / 2;
      return Math.atan2(y - center_y, x - center_x) * (180 / Math.PI);
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      //setRotationCount(0);
      //setDisplayNumber(0);
    }

    const handleTouchMove = (e, angle: number) => {
      e.preventDefault();      
      if (isRolling) {
        return;
      }
      
      setCurrentAngle(currentAngle + 4);

      // calculate the rotation angle based on total rotations count
      if (currentAngle > 360 * rotationCount + 10) {
        if (displayNumber == 10) return;

        setRotationCount(rotationCount + 1);
        setDisplayNumber(displayNumber + 1);
      }
    };

    const handleTouchEnd = () => {
      //setCurrentAngle(0); // Reset lever angle but keep number displayed
    };

    lever.addEventListener("touchmove", handleTouchMove);
    lever.addEventListener("touchend", handleTouchEnd);
    lever.addEventListener("touchstart", handleTouchStart);

    return () => {
      lever.removeEventListener("touchmove", handleTouchMove);
      lever.removeEventListener("touchend", handleTouchEnd);
      lever.removeEventListener("touchstart", handleTouchStart);
    };
  }, [sensitivity, currentAngle, rotationCount, isRolling]);

  return (
    <>
      <div className="panel">
        <div className="number-display font-bold">{displayNumber}/{maxAvailable}</div>
      </div>

      <div className="lever-container z-20">
        <img
          src={LeverHandleImage}
          alt="Rotating Lever"
          ref={leverRef}
          style={{
            opacity: `${isRolling ? "0.5" : "1"}`,
            transform: `rotate(${currentAngle}deg)`,
            transition: "transform 0.5s ease-out",
            height: "100px",
            position: "relative",
            top: "-45px",
            transformOrigin: "50% 86.5%", // for rotation around the bottom center
          }}
        />
      </div>
    </>
  );
};

export default Lever;
