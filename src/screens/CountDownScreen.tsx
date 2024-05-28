import React, { useEffect, useState } from "react";
import RaceBoard from "../components/RaceBoard";
import { useNavigate } from "react-router-dom";

function CountDownScreen() {
  const [seconds, setSeconds] = useState(3);
  const navigate = useNavigate();

  // const handleClose = () => {
  //   navigate("/race/1");
  // };

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((old) => (old > 0 ? old - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // useEffect(() => {
  //   // eslint-disable-next-line no-undef
  //   let timer: NodeJS.Timeout;
  //   if (seconds === 0) {
  //     timer = setTimeout(handleClose, 1000);
  //     handleClose();
  //   }
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [seconds]);
  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="absolute inset-0 bg-[rgb(153,161,149)]">
        <RaceBoard
          progress={Array.from({ length: 9 }, () => {
            return { curr: 0, delta: 0 };
          })}
        />
        <div className="absolute left-0 top-0 flex size-full items-center justify-center">
          <div className="flex size-36 items-center justify-center rounded-3xl bg-yellow-500">
            <p className="font-[Berlin] text-[70px]">{seconds === 0 ? "GO" : seconds}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CountDownScreen;
