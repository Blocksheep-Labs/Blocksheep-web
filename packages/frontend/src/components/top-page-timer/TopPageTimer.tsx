import React, { useState, useEffect } from "react";

interface TopPageTimerProps {
  duration: number; // duration in milliseconds
}

const TopPageTimer: React.FC<TopPageTimerProps> = ({ duration }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepCount = 0;
    const intervalTime = 10; // Interval time in milliseconds
    const totalSteps = duration / intervalTime;

    // Start the timer
    const interval = setInterval(() => {
      stepCount++;
      const newProgress = (stepCount / totalSteps) * 100;

      if (newProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
      } else {
        setProgress(newProgress);
      }
    }, intervalTime);

    // Clear interval on component unmount or when duration changes
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="absolute top-3 flex items-center justify-center w-full h-10 z-50">
      <div className="w-[90%] h-[2px] bg-[#555] overflow-hidden">
        <div
          className="h-full bg-white"
          style={{
            transition: 'width 0.01s linear',
            width: `${progress}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default TopPageTimer;
