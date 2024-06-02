import React, { useEffect, useRef, useState } from "react";

const Lever = () => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(1); // Start with a default of 1
  const sensitivity = 2; // Increase sensitivity for more responsiveness
  const leverRef = useRef(null);

  useEffect(() => {
    const lever = leverRef.current;

    const getAngleRelativeToCenter = (x, y) => {
      const rect = lever.getBoundingClientRect();
      const center_x = rect.left + rect.width / 2;
      const center_y = rect.bottom - rect.height / 2;
      return Math.atan2(y - center_y, x - center_x) * (180 / Math.PI);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const touchAngle = getAngleRelativeToCenter(touch.clientX, touch.clientY);
      let angleDifference = touchAngle * sensitivity;

      // Constrain the angle between 0 and 180
      angleDifference = Math.max(0, Math.min(angleDifference, 180));
      setCurrentAngle(angleDifference);
      // Calculate displayNumber, ensuring it's never less than 1
      setDisplayNumber(Math.max(1, Math.round((angleDifference / 180) * 9)));
    };

    const handleTouchEnd = () => {
      setCurrentAngle(0); // Reset lever angle but keep number displayed
    };

    lever.addEventListener("touchmove", handleTouchMove);
    lever.addEventListener("touchend", handleTouchEnd);

    return () => {
      lever.removeEventListener("touchmove", handleTouchMove);
      lever.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sensitivity]);

  return (
    <>
      <div className="panel">
        <div className="number-display">{displayNumber}</div>
      </div>

      <div className="lever-container">
        <img
          src="https://i.ibb.co/fXQVWpW/Lever-handle.png"
          alt="Rotating Lever"
          ref={leverRef}
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transition: "transform 0.5s ease-out",
            height: "100px",
            position: "relative",
            top: "-50px",
            transformOrigin: "50% 100%", // for rotation around the bottom center
          }}
        />
      </div>
    </>
  );
};

export default Lever;
