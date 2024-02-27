import React, { useEffect, useState } from "react";

export type ReadyModalProps = {
  handleClose: () => void;
};

function ReadyModal({ handleClose }: ReadyModalProps) {
  const [seconds, setSeconds] = useState(3);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((old) => (old > 0 ? old - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let timer: NodeJS.Timeout;
    if (seconds === 0) {
      timer = setTimeout(handleClose, 1000);
      handleClose();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [seconds]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgb(0,0,0,0.75)]">
      <p className="font-[Berlin] text-[150px] text-green-500">{seconds === 0 ? "GO" : seconds}</p>
    </div>
  );
}

export default ReadyModal;
